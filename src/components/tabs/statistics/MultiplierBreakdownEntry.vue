<script>
import { BreakdownEntryInfo } from "./breakdown-entry-info";
import { getResourceEntryInfoGroups } from "./breakdown-entry-info-group";
import { PercentageRollingAverage } from "./percentage-rolling-average";
import PrimaryToggleButton from "@/components/PrimaryToggleButton";
import MultiplierBreakdownTotal from "./MultiplierBreakdownTotal";
import GameplayLimitSummary from "./GameplayLimitSummary";
import { auditEtherealStar, starResourceForEntry } from "@/core/secret-formula/multiplier-tab/ethereal-star-audit";

// A few props are special-cased because they're base values which can be less than 1, but we don't want to
// show them as nerfs
const nerfBlacklist = ["IP_base", "EP_base", "TP_base"];

// Session-scoped UI memory. These are deliberately NOT saved (player.options.multiplierTab keeps
// its existing fields and the save format is unchanged); they reset when the page is reloaded.
const sessionImpactFinal = { value: false };
const sessionGroupSelection = new Map();

function padPercents(percents) {
  // Add some padding to percents to prevent text flicker
  // Max length is for "-100.0%"
  return percents.padStart(7, "\xa0");
}

function finiteDecimal(value, fallback = DC.D1) {
  try {
    const decimal = new Decimal(value);
    if (Decimal.isFinite(decimal)) return Decimal.clamp(decimal, new Decimal(DC.BEMAX).neg(), DC.BEMAX);
    if (Number.isNaN(decimal.sign) || Number.isNaN(decimal.layer) || Number.isNaN(decimal.mag)) {
      return new Decimal(fallback);
    }
    return decimal.sign > 0 ? new Decimal(DC.BEMAX) : new Decimal(fallback);
  } catch {
    return new Decimal(fallback);
  }
}

function finiteShare(value) {
  const result = finiteDecimal(value, DC.D0).toNumber();
  return Number.isFinite(result) ? Math.max(-1, Math.min(1, result)) : 0;
}

export default {
  name: "MultiplierBreakdownEntry",
  components: {
    PrimaryToggleButton,
    MultiplierBreakdownTotal,
    GameplayLimitSummary
  },
  props: {
    resource: {
      type: BreakdownEntryInfo,
      required: true,
    },
    isRoot: {
      type: Boolean,
      required: false,
      default: false,
    },
    depth: {
      type: Number,
      default: 0,
    },
    presentation: {
      type: String,
      default: "formula",
    },
    valueMode: {
      type: String,
      default: "all",
    }
  },
  data() {
    return {
      selected: 0,
      percentList: [],
      averagedPercentList: [],
      legacyBarOffsets: [],
      legacyBarHeights: [],
      orderedPathPercentList: [],
      orderedPathOffsets: [],
      orderedPathNerfPercentList: [],
      orderedDirectNerfs: [],
      showGroup: [],
      showDetails: [],
      starAudits: {},
      hadChildEntriesAt: [],
      mouseoverIndex: -1,
      lastNotEmptyAt: 0,
      dilationExponent: 1,
      isDilated: false,
      // This is used to temporarily remove the transition function from the bar styling when changing the way
      // multipliers are split up; the animation which results from not doing this looks very awkward
      lastLayoutChange: Date.now(),
      now: Date.now(),
      totalMultiplier: DC.D1,
      totalPositivePower: 1,
      selectedEffect: DC.D1,
      selectedRawEffect: DC.D1,
      selectedRawEffectAvailable: false,
      replacePowers: player.options.multiplierTab.replacePowers,
      // Start with the exact, inexpensive step delta. Final is opt-in because
      // it must replay the complete formula once for each visible source.
      // Remembered across panels within this session only.
      orderedFinalImpact: sessionImpactFinal.value,
      inNC12: false,
    };
  },
  computed: {
    groups() {
      const groups = getResourceEntryInfoGroups(this.resource.key);
      if (!this.isRoot || this.presentation !== "classic" || !this.isDimensionRoot) return groups;
      return [groups[this.resource.key.endsWith("_total") ? 2 : 1]].filter(Boolean);
    },
    /**
     * @returns {BreakdownEntryInfo[]}
     */
    entries() {
      return this.groups[this.selected]?.entries ?? [];
    },
    rollingAverage() {
      return new PercentageRollingAverage();
    },
    containerClass() {
      return {
        "c-multiplier-entry-container": true,
        "c-multiplier-entry-root-container": this.isRoot,
      };
    },
    isEmpty() {
      return this.entries.length === 0 || !this.isRecent(this.lastNotEmptyAt);
    },
    disabledText() {
      if (/^(CD|DD|RM|RMCap|IM|DM|TR|HR|realities|endgames)_(total|projectedTotal)(_\d+)?$/u.test(this.resource.key)) {
        return this.$t("analysis.expansion.noSources");
      }
      if (!this.resource.isBase) return `Total effect inactive, disabled, or reduced to ${formatX(1)}`;
      return Decimal.eq(this.resource.mult, 0)
        ? `You cannot gain this resource (prestige requirement not reached)`
        : `You have no multipliers for this resource (will gain ${format(1)} on prestige)`;
    },
    // IC4 is the first time the player sees a power-based effect, not counting how infinity power is handled.
    // This doesn't need to be reactive because completing IC4 for the first time forces a tab switch
    hasSeenPowers() {
      return InfinityChallenge(4).isCompleted || PlayerProgress.eternityUnlocked();
    },
    // While infinity power is a power-based effect, we want to disallow showing that as an equivalent multiplier
    // since that it doesn't make a whole lot of sense to do that. We also want to hide this for entries related
    // to tickspeed/galaxies because we already mostly hack those with fake values and should thus not allow those
    // to be changed either.
    allowPowerToggle() {
      if (this.usesOrdered) return false;
      const forbiddenEntries = ["AD_infinityPower", "AD_classicinfinityPower", "galaxies", "tickspeed"];
      // Uses startsWith instead of String equality since it has to match both the top-level entry and any
      // related children entries further down the tree.
      return !forbiddenEntries.some(key => this.resource.key.startsWith(key));
    },
    isDimensionOverall() {
      return ["AD_total", "ID_total", "TD_total", "CD_total", "DD_total"].includes(this.resource.key);
    },
    canShowFinalImpact() {
      return this.usesOrdered;
    },
    impactMode() {
      return this.orderedFinalImpact;
    },
    // AD/ID/TD root panels (Overall and per-tier views) get their Overall/by-dimension grouping
    // from the analysis header's inline switch instead of the legacy grouping button.
    isDimensionRoot() {
      return this.isRoot && /^(AD|ID|TD|CD|DD)_total(_\d+)?$/u.test(this.resource.key);
    },
    usesOrdered() {
      return this.resource.isOrdered;
    },
    // Explanatory footnote for ordered panels, data-driven instead of a template branch chain.
    orderedNoteText() {
      if (this.valueMode !== "all") return this.$t("analysis.note.selected", {
        kind: this.$t(this.valueMode === "exponent" ? "analysis.source.power" : "analysis.source.multiplication")
      });
      if (this.resource.key === "tickspeed_galaxies") return this.$t("analysis.note.galaxies");
      if (this.isDimensionOverall && this.selected === 0) return this.$t("analysis.note.categories");
      return this.$t(this.isDimensionOverall ? "analysis.note.tiers" : "analysis.note.formula");
    },
  },
  watch: {
    replacePowers(newValue) {
      if (this.allowPowerToggle && this.valueMode === "all") {
        player.options.multiplierTab.replacePowers = newValue;
      }
    },
    orderedFinalImpact() {
      sessionImpactFinal.value = this.orderedFinalImpact;
      if (!this.usesOrdered) return;
      this.lastLayoutChange = Date.now();
      this.rollingAverage.clear();
      // Switching to Final must first populate on-demand counterfactuals.
      this.update(true);
    },
  },
  beforeCreate() {
    // The global UI mixin invokes update() from its created hook, BEFORE this
    // component's created hook runs. Initialize non-reactive bookkeeping here.
    this._lastMultiplierRefresh = -Infinity;
    this._lastChildScan = [];
    this._cachedChildAvailability = [];
    this._lastStarAuditAt = -Infinity;
    this._modeMatches = new Map();
  },
  created() {
    // Dimension roots suppress the obsolete all-tiers grouping button (the analysis header's
    // inline switch supersedes it); child panels keep it and honor the saved toggle. Per-resource
    // in-session grouping memory takes precedence over that shared saved fallback; the save
    // format itself is untouched.
    if (this.isDimensionRoot || this.groups.length <= 1) return;
    const remembered = sessionGroupSelection.get(this.resource.key);
    if (remembered !== undefined) {
      const maxIndex = this.groups.length - 1;
      this.selected = Math.max(0, Math.min(remembered, maxIndex));
      return;
    }
    if (player.options.multiplierTab.showAltGroup) this.changeGroup();
  },
  methods: {
    // Vue templates resolve helpers on the component instance.
    starResourceForEntry,
    entryMatchesMode(entry, seen = new Set()) {
      if (this.valueMode === "all") return entry.isActive;
      const cached = this._modeMatches.get(entry.key);
      if (cached !== undefined) return cached;
      if (seen.has(entry.key)) return false;
      seen.add(entry.key);
      if (!entry.isActive) {
        this._modeMatches.set(entry.key, false);
        return false;
      }
      if (entry._hasTransform) {
        const transform = entry.getTransform(false, this.valueMode);
        if (transform?.type === (this.valueMode === "multiplier" ? "multiply" : "power")) {
          this._modeMatches.set(entry.key, true);
          return true;
        }
      } else {
        const activeValue = this.valueMode === "multiplier" ? entry.mult : entry.pow;
        if (Decimal.neq(activeValue, 1)) {
          this._modeMatches.set(entry.key, true);
          return true;
        }
      }
      const matches = getResourceEntryInfoGroups(entry.key)
        .some(group => group.entries.some(child => this.entryMatchesMode(child, new Set(seen))));
      this._modeMatches.set(entry.key, matches);
      return matches;
    },
    update(force = false) {
      const now = Date.now();
      // Recompute just the displayed trace, not all counterfactuals. Keep the
      // visible page near the game's UI cadence; deeper expansions get a small
      // budget so opening a large tree does not block gameplay.
      const intervals = [80, 100, 160, 240];
      const interval = intervals[Math.min(this.depth, 3)];
      if (!force && now - this._lastMultiplierRefresh < interval) return;
      this._modeMatches.clear();
      for (let i = 0; i < this.entries.length; i++) {
        const entry = this.entries[i];
        // Full formula replays are only needed for Final mode or an expanded
        // row's detail panel. Direct calculations still update every refresh.
        const starScope = this.showDetails[i] && starResourceForEntry(entry.key);
        // The Star-specific detail uses gameplay methods, not the costly
        // statistics counterfactual (and its synthetic eight-tier product).
        entry.update(!this.usesOrdered || this.impactMode ||
          (Boolean(this.showDetails[i]) && !starScope), this.valueMode);
        if (starScope && now - this._lastStarAuditAt >= 750) {
          // Only the open Star detail needs the gameplay counterfactual;
          // never run it for collapsed rows or ordinary statistics refreshes.
          const audit = auditEtherealStar(starScope.resource, starScope.tier);
          this.$set(this.starAudits, entry.key, audit);
          this._lastStarAuditAt = Date.now();
        }
        const childGroups = getResourceEntryInfoGroups(entry.key);
        // A collapsed legacy entry needs a child-visibility scan only once per second;
        // previously every tick evaluated every descendant's entire multiplier.
        const scan = this.showGroup[i] || now - (this._lastChildScan[i] ?? -Infinity) >= 2000;
        if (scan) {
          this._lastChildScan[i] = now;
          this._cachedChildAvailability[i] = childGroups.some(group => group.entries.some(child =>
            child.isVisible && this.entryMatchesMode(child)));
        }
        if (this._cachedChildAvailability[i]) this.hadChildEntriesAt[i] = now;
      }
      this.dilationExponent = this.resource.dilationEffect;
      this.isDilated = this.dilationExponent !== 1;
      this.calculatePercents();
      // Measure the cooldown from the END of the computation, otherwise a
      // slow trace causes back-to-back expensive updates on the next frame.
      this.now = Date.now();
      this._lastMultiplierRefresh = this.now;
      this.replacePowers = player.options.multiplierTab.replacePowers && this.allowPowerToggle;
      this.inNC12 = NormalChallenge(12).isRunning;
    },
    toggleGroup(index) {
      // Legacy alias for callers still treating expansion as a single action.
      this.toggleChildren(index);
    },
    toggleChildren(index) {
      if (!this.hasChildEntries(index)) return;
      // Vue 2 does not observe direct writes to previously absent array indexes.
      this.$set(this.showGroup, index, !this.showGroup[index]);
      this.update(true);
    },
    toggleDetails(index) {
      this.$set(this.showDetails, index, !this.showDetails[index]);
      if (starResourceForEntry(this.entries[index].key)) this._lastStarAuditAt = -Infinity;
      this.update(true);
    },
    toggleBar(index) {
      if (this.usesOrdered && this.entries[index]?.data?.hasTransform) {
        this.toggleDetails(index);
        return;
      }
      if (this.hasChildEntries(index)) this.toggleChildren(index);
    },
    changeGroup() {
      this.selected = (this.selected + 1) % this.groups.length;
      sessionGroupSelection.set(this.resource.key, this.selected);
      player.options.multiplierTab.showAltGroup = this.selected === 1;
      this.showGroup = Array.repeat(false, this.entries.length);
      this.showDetails = Array.repeat(false, this.entries.length);
      this.starAudits = {};
      this._lastStarAuditAt = -Infinity;
      this.hadChildEntriesAt = Array.repeat(0, this.entries.length);
      this.lastLayoutChange = Date.now();
      this.rollingAverage.clear();
      this._lastChildScan = [];
      this._cachedChildAvailability = [];
      this.update(true);
    },
    calculatePercents() {
      if (this.usesOrdered) {
        this.calculateOrderedImpacts();
        return;
      }

      if (this.valueMode !== "all") {
        this.calculateSingleTypeImpacts();
        return;
      }

      const powList = this.entries.map(e => new Decimal(e.data.pow));
      const totalPosPow = powList.filter(p => p.gt(1))
        .reduce((x, y) => finiteDecimal(x.times(y)), DC.D1);
      const totalNegPow = powList.filter(p => p.lt(1))
        .reduce((x, y) => finiteDecimal(x.times(y)), DC.D1);
      const totalValue = finiteDecimal(this.resource.fakeValue ?? this.resource.mult);
      const log10Mult = finiteDecimal(totalValue.log10().div(totalPosPow), DC.D0);
      const hasActiveEntries = this.entries.some(entry => entry.data.isVisible);
      if (hasActiveEntries) {
        this.lastNotEmptyAt = Date.now();
      }
      let percentList = [];
      for (const entry of this.entries) {
        const pow = new Decimal(entry.data.pow);
        const multFrac = log10Mult.eq(0) ? DC.D0 : finiteDecimal(Decimal.log10(entry.data.mult).div(log10Mult), DC.D0);
        const powFrac = totalPosPow.eq(1) ? DC.D0 : finiteDecimal(pow.log10().div(totalPosPow.log10()), DC.D0);

        // Handle nerf powers differently from everything else in order to render them with the correct bar percentage
        const rawPerc = pow.gte(1)
          ? multFrac.div(totalPosPow).add(powFrac.times(DC.D1.sub(DC.D1.div(totalPosPow))))
          : finiteDecimal(pow.log10().div(totalNegPow.log10()).times(totalNegPow.sub(1)), DC.D0);
        const perc = finiteDecimal(rawPerc, DC.D0);

        // Keep these as Decimals until after normalization; individual contributions can be far outside Number range
        // in Endgame even though the final percentages are always small finite values.
        percentList.push([
          entry.ignoresNerfPowers,
          nerfBlacklist.includes(entry.key) ? Decimal.max(perc, 0.0001) : perc
        ]);
      }

      // Shortly after a prestige, these may add up to a lot more than the base amount as production catches up. This
      // is also necessary to suppress some visual weirdness for certain categories which have lots of exponents but
      // actually apply only to specific dimensions (eg. charged infinity upgrades)
      // We have a nerfedPerc variable to give a percentage breakdown as if all multipliers which ARE affected by nerf
      // power effects already had them applied; there is support in the classes to allow for some to be affected but
      // not others. The only actual case of this occurring is V's Reality not affecting gamespeed for DT, but it was
      // cleaner to adjust the class structure instead of specifically special-casing it here
      const positivePercs = percentList.filter(p => p[1].gt(0));
      const totalPerc = positivePercs.reduce((x, y) => x.add(y[1]), DC.D0);
      const nerfedPerc = positivePercs
        .reduce((x, y) => x.add(y[0] ? y[1] : y[1].times(totalNegPow)), DC.D0);
      percentList = percentList.map(p => {
        if (p[1].gt(0)) {
          if (nerfedPerc.eq(0)) return 0;
          return finiteShare((p[0] ? p[1] : p[1].times(totalNegPow)).div(nerfedPerc));
        }
        if (totalPerc.eq(0) || totalNegPow.eq(0)) return finiteShare(Decimal.max(p[1], -1));
        return finiteShare(Decimal.max(
          p[1].times(totalPerc.sub(nerfedPerc)).div(totalPerc).div(totalNegPow),
          -1
        ));
      });
      this.percentList = percentList;
      this.rollingAverage.add(hasActiveEntries ? percentList : undefined);
      this.averagedPercentList = this.rollingAverage.average;
      this.updateLegacyBars();
      this.totalMultiplier = finiteDecimal(Decimal.pow10(log10Mult));
      this.totalPositivePower = totalPosPow;
    },
    calculateSingleTypeImpacts() {
      const selectedValues = this.entries.map(entry => {
        if (!entry.data.isVisible || !this.entryMatchesMode(entry)) return DC.D1;
        const value = this.valueMode === "multiplier" ? entry.data.mult : entry.data.pow;
        return finiteDecimal(value);
      });
      const values = selectedValues.map(value => (value.eq(0)
        ? new Decimal(DC.BEMAX).log10().neg()
        : finiteDecimal(value.abs().log10(), DC.D0)));
      const max = values.reduce((result, value) => Decimal.max(result, value.abs()), DC.D0);
      const scaled = values.map(value => (max.eq(0) ? DC.D0 : value.div(max)));
      const weight = scaled.reduce((sum, value) => sum.add(value.abs()), DC.D0);
      const shares = scaled.map(value => (weight.eq(0) ? 0 : finiteShare(value.div(weight))));
      const totalLog = values.reduce((result, value) => finiteDecimal(result.add(value), DC.D0), DC.D0);
      const sign = selectedValues.reduce((product, value) => product * value.sign, 1);
      this.selectedEffect = sign === 0 ? DC.D0 : finiteDecimal(Decimal.pow10(totalLog).times(sign));
      if (this.entries.some(entry => entry.data.isVisible && this.entryMatchesMode(entry))) {
        this.lastNotEmptyAt = Date.now();
      }
      this.percentList = shares;
      this.rollingAverage.add(shares);
      this.averagedPercentList = this.rollingAverage.average;
      this.updateLegacyBars();
      this.totalMultiplier = this.selectedEffect;
      this.totalPositivePower = DC.D1;
    },
    updateLegacyBars() {
      const netPercent = Math.max(0, this.averagedPercentList.reduce((sum, value) => sum + value, 0));
      const heights = this.averagedPercentList.map(value => {
        if (this.valueMode === "all" && value > 0) return value * netPercent;
        return Math.abs(value);
      });
      const scale = Math.max(1, heights.reduce((sum, height) => sum + height, 0));
      let position = 0;
      this.legacyBarOffsets = [];
      this.legacyBarHeights = [];
      for (const rawHeight of heights) {
        const height = rawHeight / scale;
        this.legacyBarOffsets.push(position);
        this.legacyBarHeights.push(height);
        position += height;
      }
    },
    calculateOrderedImpacts() {
      const impacts = this.entries.map((entry, index) => this.orderedImpactDelta(index, this.impactMode));
      const directImpacts = this.entries.map((entry, index) => this.orderedImpactDelta(index, false));
      const maxImpact = impacts
        .map(delta => delta.abs())
        .reduce((max, delta) => Decimal.max(max, delta), DC.D0);
      // Normalize direct-path segments by the largest impact before summing.
      // Raw OoM deltas can be near the Decimal representation boundary, where
      // adding several of them can overflow even though the final shares are <= 1.
      const gains = directImpacts.map((delta, i) => (this.entries[i].data.transformHasImpactBudget
        ? this.entries[i].data.transformPositiveImpact : delta.clampMin(0)));
      const losses = directImpacts.map((delta, i) => (this.entries[i].data.transformHasImpactBudget
        ? this.entries[i].data.transformNegativeImpact : delta.neg().clampMin(0)));
      const maxDirectImpact = [...gains, ...losses].reduce((max, delta) => Decimal.max(max, delta), DC.D0);
      const scale = value => (maxDirectImpact.eq(0) ? DC.D0 : value.div(maxDirectImpact));
      const scaledGains = gains.map(scale);
      const scaledLosses = losses.map(scale);
      const positive = scaledGains.reduce((sum, value) => sum.add(value), DC.D0);
      const loss = scaledLosses.reduce((sum, value) => sum.add(value), DC.D0);
      const budget = Decimal.max(positive, loss);
      const surviving = positive.sub(loss).clampMin(0);
      const hasVisibleTransforms = this.entries.some(entry => entry.data.isVisible &&
        (this.valueMode === "all" || this.entryMatchesMode(entry)));
      if (hasVisibleTransforms) this.lastNotEmptyAt = Date.now();
      if (this.valueMode !== "all") {
        const selectedLog = directImpacts.reduce((sum, delta) => finiteDecimal(sum.add(delta), DC.D0), DC.D0);
        this.selectedEffect = finiteDecimal(Decimal.pow10(selectedLog));
        const desired = this.valueMode === "multiplier" ? "multiply" : "power";
        const selected = this.entries.filter(entry => entry.data.isVisible && this.entryMatchesMode(entry));
        this.selectedRawEffectAvailable = selected.length > 0 && selected.every(entry =>
          entry.data.transformType === desired && entry.data.transformHasValue);
        this.selectedRawEffect = selected.reduce((product, entry) =>
          finiteDecimal(product.times(entry.data.transformValue)), DC.D1);
      }

      const relativeImpacts = impacts.map(delta => {
        if (delta.eq(0)) return 0;
        if (this.impactMode) return maxImpact.eq(0) ? 0 : finiteShare(delta.div(maxImpact));
        if (maxDirectImpact.eq(0) || budget.eq(0)) return 0;
        return finiteShare(delta.div(maxDirectImpact).div(budget));
      });
      this.orderedPathNerfPercentList = scaledLosses.map(value => (budget.eq(0) ? 0 : finiteShare(value.div(budget))));
      this.orderedPathPercentList = scaledGains.map((value, i) => {
        let share = new Decimal(this.orderedPathNerfPercentList[i]);
        if (positive.neq(0) && budget.neq(0)) share = share.add(value.div(positive).times(surviving.div(budget)));
        return finiteShare(share);
      });
      this.orderedDirectNerfs = directImpacts.map(delta => delta.lt(0));
      let offset = 0;
      this.orderedPathOffsets = this.orderedPathPercentList.map(share => {
        const currentOffset = offset;
        offset += share;
        return currentOffset;
      });

      this.percentList = relativeImpacts;
      this.rollingAverage.add(hasVisibleTransforms ? relativeImpacts : undefined);
      this.averagedPercentList = this.rollingAverage.average;
      this.totalMultiplier = this.resource.mult;
      this.totalPositivePower = DC.D1;
    },
    orderedImpactDelta(index, finalMode = this.impactMode) {
      const entry = this.entries[index];
      return this.orderedEntryDelta(entry, finalMode);
    },
    orderedEntryDelta(entry, finalMode) {
      const data = entry.data;
      if (this.valueMode !== "all") {
        const desiredType = this.valueMode === "multiplier" ? "multiply" : "power";
        if (data.transformType !== desiredType) {
          // Groups are alternative presentations of the same sources, not additive lists.
          const children = getResourceEntryInfoGroups(entry.key)[0]?.entries ?? [];
          return children.reduce((sum, child) => {
            if (!this.entryMatchesMode(child)) return sum;
            child.update(finalMode, this.valueMode);
            return finiteDecimal(sum.add(this.orderedEntryDelta(child, finalMode)), DC.D0);
          }, DC.D0);
        }
      }
      if (!data.hasTransform || !data.isVisible) return DC.D0;
      // A positive starting value supplies the bar's baseline budget. Zero or sub-unit
      // inputs are never drawn as a penalty from an artificial starting value of 1.
      if (data.transformType === "input") return this.log10ForImpact(data.transformAfter).clampMin(0);
      // A trace mismatch is a residual/debugging signal, not a gameplay source.
      // Keep the row visible, but never let it consume contribution/path percentage.
      if (entry.key.endsWith("traceMismatch")) return DC.D0;
      const before = new Decimal(finalMode && data.transformHasFinalWithout
        ? data.transformFinalWithout
        : data.transformBefore);
      const after = new Decimal(finalMode && data.transformHasFinalWithout
        ? data.transformFinalWith
        : data.transformAfter);
      // Once both sides have saturated at the same gameplay boundary, this step
      // has no observable direct impact. Avoid subtracting two boundary-scale logs.
      if (before.eq(after)) return DC.D0;
      const delta = this.log10ForImpact(after).sub(this.log10ForImpact(before));
      return Decimal.isFinite(delta) ? delta : DC.D0;
    },
    log10ForImpact(value) {
      let decimal = new Decimal(value);
      // The statistics page must never propagate Number/Decimal Infinity into
      // percentage normalization. Gameplay values at or beyond the representable
      // boundary are displayed as the existing BEMAX saturation point.
      if ([decimal.sign, decimal.layer, decimal.mag].some(Number.isNaN)) return DC.D0;
      if (![decimal.sign, decimal.layer, decimal.mag].every(Number.isFinite)) {
        decimal = decimal.sign > 0 ? new Decimal(DC.BEMAX) : DC.D0;
      }
      // Values below x1 are still real effects. Use the Decimal display floor only
      // for zero, rather than erasing sub-unit multipliers or speeds.
      return Decimal.max(decimal, new Decimal(DC.BEMAX).recip()).log10();
    },
    orderedImpactStyle(index) {
      const impact = this.averagedPercentList[index] ?? 0;
      const iconObj = this.entries[index].icon;
      return {
        width: `${100 * Math.min(Math.abs(impact), 1)}%`,
        left: impact < 0 ? undefined : 0,
        right: impact < 0 ? 0 : undefined,
        background: impact < 0
          ? `repeating-linear-gradient(-45deg, var(--color-bad), ${iconObj?.color ?? "var(--color-bad)"} 0.8rem)`
          : iconObj?.color ?? "var(--color-accent)",
        opacity: impact === 0 ? 0 : 0.35,
      };
    },
    orderedPathStyle(index) {
      const share = this.orderedPathPercentList[index] ?? 0;
      const nerf = this.orderedPathNerfPercentList[index] ?? 0;
      const positiveHeight = share === 0 ? 100 : 100 * Math.max(0, share - nerf) / share;
      const iconObj = this.entries[index].icon ?? this.resource.icon;
      return {
        position: "absolute",
        top: `${100 * (this.orderedPathOffsets[index] ?? 0)}%`,
        height: `${100 * share}%`,
        width: "100%",
        "transition-duration": this.isRecent(this.lastLayoutChange) ? undefined : "0.2s",
        border: share === 0 ? "" : "0.1rem solid var(--color-text)",
        color: iconObj?.textColor ?? "black",
        background: nerf > 0
          ? `linear-gradient(to bottom, ${iconObj?.color ?? "var(--color-accent)"} ${positiveHeight}%,
            transparent ${positiveHeight}%),
            repeating-linear-gradient(-45deg, var(--color-bad), ${iconObj?.color ?? "var(--color-bad)"} 0.8rem)`
          : iconObj?.color ?? this.resource.icon?.color ?? "var(--color-accent)",
      };
    },
    styleObject(index) {
      const percents = this.averagedPercentList[index] ?? 0;
      const iconObj = this.entries[index].icon;
      return {
        position: "absolute",
        top: `${100 * (this.legacyBarOffsets[index] ?? 0)}%`,
        height: `${100 * (this.legacyBarHeights[index] ?? 0)}%`,
        width: "100%",
        "transition-duration": this.isRecent(this.lastLayoutChange) ? undefined : "0.2s",
        border: percents === 0 ? "" : "0.1rem solid var(--color-text)",
        color: iconObj?.textColor ?? "black",
        background: percents < 0
          ? `repeating-linear-gradient(-45deg, var(--color-bad), ${iconObj?.color} 0.8rem)`
          : iconObj?.color,
      };
    },
    singleEntryClass(index) {
      return {
        "c-single-entry": true,
        "c-single-entry-highlight": this.mouseoverIndex === index,
      };
    },
    shouldShowEntry(entry) {
      if (this.valueMode !== "all" && !this.entryMatchesMode(entry)) return false;
      return entry.isActive && entry.data.isVisible;
    },
    barSymbol(index) {
      return this.entries[index].icon?.symbol ?? null;
    },
    hasChildEntries(index) {
      return Boolean(this._cachedChildAvailability[index]);
    },
    expandIcon(index) {
      return this.showGroup[index] ? "far fa-minus-square" : "far fa-plus-square";
    },
    detailIcon(index) {
      return this.showDetails[index] ? "fas fa-times-circle" : "fas fa-info-circle";
    },
    expandIconStyle(index) {
      return {
        opacity: this.hasChildEntries(index) ? 1 : 0
      };
    },
    detailIconStyle(index) {
      return {
        opacity: this.usesOrdered && this.entries[index].data.hasTransform ? 1 : 0
      };
    },
    entryString(index) {
      if (this.usesOrdered) return this.orderedEntryString(index);
      const percents = this.percentList[index] ?? 0;
      if (percents < 0 && !nerfBlacklist.includes(this.entries[index].key)) {
        return this.nerfString(index);
      }

      // We want to handle very small numbers carefully to distinguish between "disabled/inactive" and
      // "too small to be relevant"
      let percString;
      if (percents === 0) percString = formatPercents(0);
      else if (percents === 1) percString = formatPercents(1);
      else if (percents < 0.001) percString = `<${formatPercents(0.001, 1)}`;
      else if (percents > 0.9995) percString = `~${formatPercents(1)}`;
      else percString = formatPercents(percents, 1);
      percString = padPercents(percString);

      // Display both multiplier and powers, but make sure to give an empty string if there's neither
      const entry = this.entries[index];
      if (!entry.data.isVisible) {
        return `${percString}: ${this.$legacyText(entry.name)}`;
      }
      if (entry.data.invalidValue) return `${percString}: ${entry.name} (Diagnostic value unavailable)`;
      const overrideStr = this.valueMode === "all" ? entry.displayOverride : null;
      let valueStr;
      {
        const values = [];
        const formatFn = x => {
          const isDilated = entry.isDilated;
          if (isDilated && this.dilationExponent !== 1 && this.dilationExponent !== 0) {
            const undilated = this.applyDilationExp(x, 1 / this.dilationExponent);
            return `${formatX(undilated, 2, 2)} ➜ ${formatX(x, 2, 2)}`;
          }
          return entry.isBase
            ? format(x, 2, 2)
            : formatX(x, 2, 2);
        };
        if (this.valueMode === "all" && this.replacePowers && Decimal.neq(entry.data.pow, 1)) {
          // For replacing powers with equivalent multipliers, we calculate what the total additional multiplier
          // from ALL power effects taken together would be, and then we split up that additional multiplier
          // proportionally to this individual power's contribution to all positive powers
          const pow = new Decimal(entry.data.pow);
          const totalPositivePower = new Decimal(this.totalPositivePower);
          const powFrac = totalPositivePower.eq(1) ? DC.D0 : pow.log10().div(totalPositivePower.log10());
          const equivMult = finiteDecimal(this.totalMultiplier.pow(totalPositivePower.sub(1).times(powFrac)));
          values.push(formatFn(finiteDecimal(entry.data.mult.times(equivMult))));
        } else {
          if (this.valueMode !== "exponent" && Decimal.neq(entry.data.mult, 1)) {
            values.push(formatFn(entry.data.mult));
          }
          if (this.valueMode !== "multiplier" && Decimal.neq(entry.data.pow, 1)) {
            values.push(formatPow(entry.data.pow, 2, 3));
          }
        }
        if (values.length === 0) values.push(this.valueMode === "exponent" ? formatPow(1) : formatX(1));
        if (overrideStr && !values.includes(overrideStr)) values.push(this.$legacyText(overrideStr));
        valueStr = `(${values.join("; ")})`;
      }

      return `${percString}: ${this.$legacyText(entry.name)} ${valueStr}`;
    },
    orderedEntryString(index) {
      const entry = this.entries[index];
      const impact = this.percentList[index] ?? 0;
      let impactString;
      if (impact === 0) impactString = formatPercents(0);
      else if (Math.abs(impact) < 0.001) {
        impactString = `${impact < 0 ? ">-" : "<"}${formatPercents(0.001, 1)}`;
      } else {
        impactString = formatPercents(impact, 1);
      }
      const mode = this.impactMode ? "final" : "direct";
      const pathShare = this.resource.key === "tickspeed_total" && entry.key === "tickspeed_galaxies"
        ? this.$t("analysis.row.path", { share: formatPercents(this.orderedPathPercentList[index] ?? 0, 1) })
        : "";
      const value = entry.data.invalidValue ? this.$t("analysis.row.unavailable") : this.transformValueString(entry);
      if (entry.data.transformType === "input") {
        return this.$t("analysis.row.input", { name: this.$legacyText(entry.name), value });
      }
      return this.$t("analysis.row.relative", {
        impact: padPercents(impactString), mode: this.$t(`analysis.impact.${mode}`), path: pathShare,
        name: this.$legacyText(entry.name), value: this.$legacyText(value)
      });
    },
    transformValueString(entry) {
      const data = entry.data;
      // Mixed dimension categories already provide their raw multipliers and per-tier powers.
      // Avoid adding an equivalent ratio (or an artificial 1 → value) beside the same effects.
      if (data.transformAggregate && data.transformDisplay && !data.transformHasValue &&
          /[×^]/u.test(data.transformDisplay)) return `(${this.$legacyText(data.transformDisplay)})`;
      const values = [];
      if (!data.hasTransform) {
        // Informational rows without an ordered trace (e.g. ID_highestDim, ID_tickspeed) can
        // appear inside ordered panels; show their actual effect instead of a fake "1 ➜ 1".
        const overrideStr = entry.displayOverride;
        if (Decimal.neq(data.mult, 1)) {
          values.push(entry.isBase ? format(data.mult, 2, 2) : formatX(data.mult, 2, 2));
        }
        if (Decimal.neq(data.pow, 1)) values.push(formatPow(data.pow, 2, 3));
        if (values.length === 0) values.push(formatX(1));
        if (overrideStr && !values.includes(overrideStr)) values.push(this.$legacyText(overrideStr));
        return `(${values.join("; ")})`;
      }
      switch (data.transformType) {
        case "multiply":
          values.push(formatX(data.transformHasValue ? data.transformValue
            : data.transformAfter.div(data.transformBefore.max(new Decimal(DC.BEMAX).recip())), 2, 2));
          break;
        case "power":
          values.push(data.transformHasValue ? formatPow(data.transformValue, 2, 3)
            : `${format(data.transformBefore, 2, 2)} ➜ ${format(data.transformAfter, 2, 2)}`);
          break;
        case "input":
          values.push(format(data.transformAfter, 2, 2));
          break;
        case "formula":
          if (data.transformAggregate && data.transformBefore.gt(0)) {
            values.push(formatX(data.transformAfter.div(data.transformBefore), 2, 2));
          } else {
            values.push(`${format(data.transformBefore, 2, 2)} ➜ ${format(data.transformAfter, 2, 2)}`);
          }
          break;
        case "softcap":
        case "hardcap":
        case "override":
        case "floor":
        default:
          values.push(`${format(data.transformBefore, 2, 2)} ➜ ${format(data.transformAfter, 2, 2)}`);
      }
      if (data.transformAggregate && data.transformHasValue && data.transformType === "power") {
        values[0] = this.$t("analysis.row.perTier", { value: values[0] });
      }
      if (data.transformDisplay && !values.includes(data.transformDisplay)) {
        values.push(this.$legacyText(data.transformDisplay));
      }
      return `(${values.join("; ")})`;
    },
    transformTypeString(entry) {
      if (entry.data.transformAggregate) return "Aggregate";
      const labels = {
        multiply: "Multiplier",
        input: "Formula input",
        power: "Power",
        formula: "Formula",
        softcap: "Softcap",
        hardcap: "Hardcap",
        override: "Override",
        floor: "Rounding",
      };
      return labels[entry.data.transformType] ?? "Transformation";
    },
    transformImpactString(entry, finalImpact) {
      const data = entry.data;
      const before = finalImpact && data.transformHasFinalWithout
        ? data.transformFinalWithout : data.transformBefore;
      const after = finalImpact && data.transformHasFinalWithout
        ? data.transformFinalWith : data.transformAfter;
      if (after.eq(0) && before.gt(0)) return "Output reduced to zero";
      if (before.eq(0) && after.gt(0)) return "Output restored from zero";
      let delta;
      if (finalImpact && data.transformHasFinalWithout) {
        delta = this.log10ForImpact(data.transformFinalWith).sub(this.log10ForImpact(data.transformFinalWithout));
      } else {
        delta = this.log10ForImpact(data.transformAfter).sub(this.log10ForImpact(data.transformBefore));
      }
      if (delta.eq(0)) return `${format(0, 2, 2)} OoM`;
      const sign = delta.gt(0) ? "+" : "";
      return `${sign}${format(delta, 2, 2)} OoM`;
    },
    nerfString(index) {
      const entry = this.entries[index];
      const percString = padPercents(formatPercents(this.percentList[index], 1));

      // Display both multiplier and powers, but make sure to give an empty string if there's neither
      const overrideStr = this.valueMode === "all" ? entry.displayOverride : null;
      let valueStr;
      const formatFn = entry.isBase
        ? x => format(x, 2, 2)
        : x => `/${format(finiteDecimal(x.reciprocal()), 2, 2)}`;

      {
        const values = [];
        if (this.valueMode === "all" && this.replacePowers && Decimal.neq(entry.data.pow, 1)) {
          const finalMult = this.resource.fakeValue ?? this.resource.mult;
          values.push(formatFn(finiteDecimal(finalMult.pow(DC.D1.sub(DC.D1.div(entry.data.pow))))));
        } else {
          if (this.valueMode !== "exponent" && Decimal.neq(entry.data.mult, 1)) {
            values.push(formatFn(entry.data.mult));
          }
          if (this.valueMode !== "multiplier" && Decimal.neq(entry.data.pow, 1)) {
            values.push(formatPow(entry.data.pow, 2, 3));
          }
        }
        if (values.length === 0) values.push(formatX(1));
        if (overrideStr && !values.includes(overrideStr)) values.push(this.$legacyText(overrideStr));
        valueStr = `(${values.join("; ")})`;
      }

      return `${percString}: ${this.$legacyText(entry.name)} ${valueStr}`;
    },
    totalString() {
      const resource = this.resource;
      const name = this.$legacyText(resource.name);
      const overrideStr = resource.displayOverride;
      if (overrideStr) return `${name}: ${this.$legacyText(overrideStr)}`;

      const val = resource.mult;
      return resource.isBase
        ? `${name}: ${format(val, 2, 2)}`
        : `${name}: ${formatX(val, 2, 2)}`;
    },
    applyDilationExp(value, exp) {
      const checked = finiteDecimal(value);
      if (checked.eq(0)) return DC.D0;
      const log = checked.log10();
      const transformed = log.abs().pow(exp).times(log.sign);
      return finiteDecimal(Decimal.pow10(transformed));
    },
    dilationString() {
      const resource = this.resource;
      const baseMult = resource.mult;

      // This is tricky to handle properly; if we're not careful, sometimes the dilation gets applied twice since
      // it's already applied in the multiplier itself. In that case we need to apply an appropriate "anti-dilation"
      // to make the UI look correct. However, this cause some mismatches in individual dimension breakdowns due to
      // the dilation function not being linear (ie. multiply=>dilate gives a different result than dilate=>multiply).
      // In that case we check for isDilated one level down and combine the actual multipliers together instead.
      let beforeMult, afterMult;
      if (this.isDilated && resource.isDilated && this.dilationExponent !== 0) {
        const dilProd = this.entries
          .filter(entry => entry.isVisible && entry.isDilated)
          .map(entry => entry.mult)
          .map(val => this.applyDilationExp(val, 1 / this.dilationExponent))
          .reduce((x, y) => x.times(y), DC.D1);
        beforeMult = dilProd.neq(1) ? dilProd : this.applyDilationExp(baseMult, 1 / this.dilationExponent);
        afterMult = resource.mult;
      } else {
        beforeMult = baseMult;
        afterMult = this.applyDilationExp(beforeMult, this.dilationExponent);
      }

      const formatFn = resource.isBase
        ? x => format(x, 2, 2)
        : x => formatX(x, 2, 2);
      return `Dilation Effect: Exponent${formatPow(this.dilationExponent, 2, 3)}
        (${formatFn(beforeMult, 2, 2)} ➜ ${formatFn(afterMult, 2, 2)})`;
    },
    isRecent(date) {
      return (this.now - date) < 200;
    }
  },
};
</script>

<template>
  <div :class="containerClass">
    <div
      v-if="usesOrdered && !isEmpty"
      class="c-stacked-bars c-ordered-path-bars"
    >
      <div
        v-for="(perc, index) in orderedPathPercentList"
        :key="50 + index"
        :style="orderedPathStyle(index)"
        :class="{ 'c-bar-highlight' : mouseoverIndex === index }"
        @mouseover="mouseoverIndex = index"
        @mouseleave="mouseoverIndex = -1"
        @click="toggleBar(index)"
      >
        <span
          class="c-bar-overlay"
          v-html="barSymbol(index)"
        />
      </div>
    </div>
    <div
      v-else-if="!isEmpty"
      class="c-stacked-bars"
    >
      <div
        v-for="(perc, index) in averagedPercentList"
        :key="100 + index"
        :style="styleObject(index)"
        :class="{ 'c-bar-highlight' : mouseoverIndex === index }"
        @mouseover="mouseoverIndex = index"
        @mouseleave="mouseoverIndex = -1"
        @click="toggleBar(index)"
      >
        <span
          class="c-bar-overlay"
          v-html="barSymbol(index)"
        />
      </div>
    </div>
    <div />
    <div class="c-info-list">
      <div class="c-total-mult">
        <b>
          <MultiplierBreakdownTotal
            v-if="isRoot"
            :resource="resource"
            :presentation="presentation"
            :value-mode="valueMode"
          />
          <template v-else>{{ $legacyText(_s(totalString())) }}</template>
        </b>
        <span
          class="c-display-settings"
          :class="{ 'c-ordered-display-settings': usesOrdered }"
        >
          <span
            v-if="usesOrdered"
            class="c-impact-display-label"
          >{{ $t('analysis.detail.impact') }}</span>
          <PrimaryToggleButton
            v-if="usesOrdered && canShowFinalImpact"
            v-model="orderedFinalImpact"
            v-tooltip="$legacyTooltip('Final includes amplification or reduction from later formula steps; Direct only measures this step itself')"
            :off="$t('analysis.impact.direct')"
            :on="$t('analysis.impact.final')"
            class="o-primary-btn c-impact-display-btn"
          />
          <PrimaryToggleButton
            v-else-if="valueMode === 'all' && hasSeenPowers && allowPowerToggle"
            v-model="replacePowers"
            v-tooltip="$legacyTooltip('Change Display for Power effects')"
            off="^N"
            on="×N"
            class="o-primary-btn c-change-display-btn"
          />
          <i
            v-if="groups.length > 1 && !isDimensionRoot"
            v-tooltip="$legacyTooltip('Change Multiplier Grouping')"
            class="o-primary-btn c-change-display-btn fas fa-arrows-rotate"
            @click="changeGroup"
          />
        </span>
      </div>
      <div v-if="valueMode !== 'all' && !isEmpty" class="c-selected-effect">
        <template v-if="usesOrdered">
          <div v-if="selectedRawEffectAvailable">
            {{ $t(valueMode === 'exponent' ? 'analysis.product.exponents' : 'analysis.product.multipliers') }}:
            {{ $legacyText(_s(valueMode === 'exponent' ? formatPow(selectedRawEffect, 2, 3) : formatX(selectedRawEffect, 2, 2))) }}
          </div>
          {{ $t('analysis.product.directRatios') }}: {{ $legacyText(_s(formatX(selectedEffect, 2, 2))) }}
        </template>
        <template v-else-if="valueMode === 'exponent'">
          {{ $t('analysis.product.exponents') }}: {{ $legacyText(_s(formatPow(selectedEffect, 2, 3))) }}
        </template>
        <template v-else>
          {{ $t('analysis.product.multipliers') }}: {{ $legacyText(_s(formatX(selectedEffect, 2, 2))) }}
        </template>
      </div>
      <div
        v-if="isEmpty"
        class="c-no-effect"
      >
        {{ $t('analysis.noActive', { kind: $t('analysis.effect.' + valueMode) }) }}
        <br>
        <br>
        <template v-if="valueMode === 'all'">{{ $legacyText(_s(disabledText)) }}</template>
      </div>
      <div
        v-for="(entry, index) in entries"
        v-else
        :key="entry.key"
        @mouseover="mouseoverIndex = index"
        @mouseleave="mouseoverIndex = -1"
      >
        <div
          v-if="shouldShowEntry(entry)"
          :class="singleEntryClass(index)"
        >
          <div class="c-entry-click-target">
            <span
              v-if="usesOrdered"
              class="c-ordered-impact-bar"
              :style="orderedImpactStyle(index)"
            />
            <span class="c-entry-text">
              <span class="c-entry-expanders">
                <button
                  v-if="hasChildEntries(index)"
                  type="button"
                  class="c-inline-expander c-inline-expander--children"
                  v-tooltip="$legacyTooltip('Show child entries')"
                  @click.stop="toggleChildren(index)"
                >
                  <span
                    :class="expandIcon(index)"
                    :style="expandIconStyle(index)"
                  />
                </button>
                <button
                  v-if="usesOrdered && entry.data.hasTransform"
                  type="button"
                  class="c-inline-expander c-inline-expander--details"
                  v-tooltip="$legacyTooltip('Show or hide detail box')"
                  @click.stop="toggleDetails(index)"
                >
                  <span
                    :class="detailIcon(index)"
                    :style="detailIconStyle(index)"
                  />
                </button>
              </span>
              <button
                type="button"
                class="c-entry-name"
                :aria-expanded="!!(showGroup[index] || showDetails[index])"
                @click="toggleBar(index)"
              >{{ $legacyText(_s(entryString(index))) }}</button>
            </span>
          </div>
          <div
            v-if="usesOrdered && showDetails[index] && entry.data.hasTransform"
            class="c-ordered-transform-details"
          >
            <div
              v-if="starResourceForEntry(entry.key) && starAudits[entry.key]"
              class="c-transform-detail-grid"
            >
              <span>{{ $t('analysis.detail.starAmount') }}</span>
              <b>{{ $legacyText(_s(starAudits[entry.key].color)) }} / {{ $legacyText(_s(format(starAudits[entry.key].count, 2, 2))) }}</b>
              <span>{{ $t('analysis.detail.grayBonus') }}</span>
              <b>+{{ $legacyText(_s(format(starAudits[entry.key].grayBoost, 2, 2))) }}%</b>
              <span>{{ $t('analysis.detail.effectiveExponent') }}</span>
              <b>{{ $legacyText(_s(formatPow(starAudits[entry.key].exponent, 2, 5))) }}</b>
              <span>{{ $t('analysis.detail.operation') }}</span>
              <b>10^(sign(L) × |L|^p), L = log10(multiplier)</b>
              <span>{{ $t('analysis.detail.scope') }}</span>
              <b>{{ $legacyText(_s(starAudits[entry.key].scope)) }}; {{ $legacyText(_s(starAudits[entry.key].tierCount)) }} active</b>
              <span>{{ $t('analysis.detail.directStar') }}</span>
              <b>{{ $legacyText(_s(format(starAudits[entry.key].directStarOoM, 2, 2))) }} OoM (sum of selected multiplier logs)</b>
              <span>{{ $t('analysis.detail.downstream') }}</span>
              <b>{{ $legacyText(_s(format(starAudits[entry.key].multiplierOoM, 2, 2))) }} OoM (multiplier product, NOT currency gain)</b>
              <span>{{ $t('analysis.detail.propagation') }}</span>
              <b>{{ $legacyText(_s(starAudits[entry.key].propagation)) }}</b>
              <span>{{ $t('analysis.detail.endpoint') }}</span>
              <b>{{ $legacyText(_s(starAudits[entry.key].endpointLabel)) }}</b>
              <span>{{ $t('analysis.detail.currentStar') }}</span>
              <b>{{ $legacyText(_s(format(starAudits[entry.key].currentProduction, 2, 2))) }}</b>
              <span>{{ $t('analysis.detail.withoutStar') }}</span>
              <b>{{ $legacyText(_s(format(starAudits[entry.key].withoutProduction, 2, 2))) }}</b>
              <span>{{ $t('analysis.detail.productionDifference') }}</span>
              <b v-if="starAudits[entry.key].productionOoM !== null">
                {{ $legacyText(_s(format(starAudits[entry.key].productionOoM, 2, 2))) }} OoM
              </b>
              <b v-else>{{ $t('analysis.detail.zeroProduction') }}</b>
              <span v-if="starAudits[entry.key].mismatch">{{ $t('analysis.detail.traceCheck') }}</span>
              <b v-if="starAudits[entry.key].mismatch">{{ $t('analysis.detail.traceMismatch') }}</b>
              <p class="c-star-audit-note">
                Calculated from gameplay's multiplier and production functions by replacing only this Star's exponent
                with 1. Other stars, caps, and challenges are unchanged. This is an instantaneous comparison at fixed
                dimension amounts, NOT a prediction of future gains from the full dimension chain.
              </p>
            </div>
            <div v-else class="c-transform-detail-grid">
              <span>{{ $t('analysis.detail.type') }}</span>
              <b>{{ $legacyText(_s(transformTypeString(entry))) }}</b>
              <template v-if="entry.data.transformAggregate">
                <span>{{ $t('analysis.detail.scope') }}</span>
                <b>{{ $legacyText(_s(entry.data.transformAggregateScope || 'Producing dimension tiers')) }}</b>
                <template v-if="entry.data.transformHasValue">
                  <span>{{ $t('analysis.detail.sourceValue') }}</span>
                  <b>{{ $legacyText(_s(transformValueString(entry))) }}</b>
                </template>
                <span>{{ $t('analysis.detail.combinedDirect') }}</span>
                <b>{{ $legacyText(_s(transformImpactString(entry, false))) }}</b>
                <template v-if="entry.data.transformHasFinalWithout">
                  <span>{{ $t('analysis.detail.combinedFinal') }}</span>
                  <b>{{ $legacyText(_s(transformImpactString(entry, true))) }}</b>
                </template>
              </template>
              <template v-else>
                <span>{{ $t('analysis.detail.directEffect') }}</span>
                <b>{{ $legacyText(_s(transformValueString(entry) || '—')) }}</b>
                <span>{{ $t('analysis.detail.before') }}</span>
                <b>{{ $legacyText(_s(format(entry.data.transformBefore, 2, 2))) }}</b>
                <span>{{ $t('analysis.detail.after') }}</span>
                <b>{{ $legacyText(_s(format(entry.data.transformAfter, 2, 2))) }}</b>
                <span>{{ $t('analysis.detail.directImpact') }}</span>
                <b>{{ $legacyText(_s(transformImpactString(entry, false))) }}</b>
                <template v-if="['hardcap', 'softcap'].includes(entry.data.transformType)">
                  <span>{{ $t('analysis.detail.limitStatus') }}</span>
                  <b v-if="entry.data.transformAfter.lt(entry.data.transformBefore)">
                    Suppression at this operation: {{ $legacyText(_s(transformImpactString(entry, false))) }}
                  </b>
                  <b v-else>{{ $t('analysis.detail.noReduction') }}</b>
                  <template v-if="entry.data.transformDisplay">
                    <span>{{ $t('analysis.detail.limitThreshold') }}</span>
                    <b>{{ $legacyText(_s(entry.data.transformDisplay)) }}</b>
                  </template>
                </template>
                <template v-if="entry.data.transformHasFinalWithout">
                  <span>{{ $t('analysis.detail.finalWith') }}</span>
                  <b>{{ $legacyText(_s(format(entry.data.transformFinalWith, 2, 2))) }}</b>
                  <span>{{ $t('analysis.detail.finalWithout') }}</span>
                  <b>{{ $legacyText(_s(format(entry.data.transformFinalWithout, 2, 2))) }}</b>
                  <span>{{ $t('analysis.detail.finalImpact') }}</span>
                  <b>{{ $legacyText(_s(transformImpactString(entry, true))) }}</b>
                </template>
              </template>
            </div>
          </div>
          <MultiplierBreakdownEntry
            v-if="showGroup[index] && hasChildEntries(index)"
            :resource="entry"
            :depth="depth + 1"
            :presentation="presentation"
            :value-mode="valueMode"
          />
        </div>
      </div>
      <!-- A dimension's multiplier product and its real gameplay cap have different
           endpoints. Keep the cap INSIDE the main analysis panel, but in a clearly
           labelled independent section instead of falsely inserting it into
           the AD multiplier formula or expanding every source into eight tiers. -->
      <GameplayLimitSummary
        v-if="isRoot && ['AD_total', 'ID_total', 'TD_total'].includes(resource.key)"
        :resource-key="resource.key.slice(0, 2)"
      />
      <div v-if="isDilated && !isEmpty && !usesOrdered">
        <div class="c-single-entry c-dilation-entry">
          <div>
            {{ $legacyText(_s(dilationString())) }}
          </div>
        </div>
      </div>
      <div
        v-if="usesOrdered && !isEmpty"
        class="c-no-effect c-ordered-note"
      >
        {{ $legacyText(_s(orderedNoteText)) }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.c-multiplier-entry-container {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  box-sizing: border-box;
  gap: 1rem;
  width: 100%;
  max-width: 100rem;
  min-width: 0;
  border: var(--var-border-width, 0.2rem) solid var(--color-text);
  padding: 0.5rem;
  font-weight: normal;
  background-color: var(--color-base);

  -webkit-tap-highlight-color: transparent;
}

.c-multiplier-entry-root-container {
  min-height: 45rem;
}

.c-stacked-bars {
  position: relative;
  flex: 0 0 5rem;
  width: 5rem;
  background-color: var(--color-disabled);
}

.c-ordered-path-bars {
  min-width: 5rem;
}

.c-bar-overlay {
  display: flex;
  width: 100%;
  height: 100%;
  top: -5%;
  position: absolute;
  justify-content: center;
  align-items: center;
  font-size: 1.5rem;
  pointer-events: none;
  user-select: none;
  overflow: hidden;
  opacity: 0.8;
  z-index: 1;
}

.c-bar-highlight {
  animation: a-glow-bar 2s infinite;
}

@keyframes a-glow-bar {
  0% { box-shadow: inset 0 0 0.3rem 0; }
  50% {
    box-shadow: inset 0 0 0.6rem 0;
    filter: brightness(130%);
  }
  100% { box-shadow: inset 0 0 0.3rem 0; }
}

.c-info-list {
  box-sizing: border-box;
  flex: 1;
  min-width: 0;
  padding: 0.2rem;
  overflow-wrap: anywhere;
}

.c-display-settings {
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 0.4rem;
  width: auto;
}

.c-ordered-display-settings {
  justify-content: flex-end;
  align-items: center;
  width: auto;
  min-width: 17rem;
}

.c-impact-display-label {
  margin-right: 0.6rem;
  color: var(--color-text);
  font-size: 1.1rem;
}

.c-impact-display-btn {
  min-width: 7rem;
  margin: 0 0.5rem;
}

.c-change-display-btn {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 3rem;
  margin: 0 0.5rem;
}

.c-total-mult {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.6rem;
  padding-left: 0.5rem;
  margin-bottom: 1rem;
  color: var(--color-text);
}

.c-no-effect {
  color: var(--color-text);
  user-select: none;
}

.c-selected-effect {
  margin: 0.5rem;
  color: var(--color-text);
  text-align: left;
}

.c-single-entry {
  position: relative;
  text-align: left;
  color: var(--color-text);
  padding: 0.2rem 0.5rem;
  margin: 0.2rem;
  border: 0.1rem dashed;
  cursor: pointer;
  user-select: none;
  overflow: hidden;
}

.c-entry-click-target {
  position: relative;
  min-height: 1.8rem;
}

.c-entry-text {
  position: relative;
  z-index: 1;
}

.c-entry-name {
  padding: 0;
  border: none;
  color: inherit;
  background: transparent;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.c-entry-name:focus-visible,
.c-inline-expander:focus-visible {
  outline: 0.2rem solid var(--color-accent);
  outline-offset: 0.1rem;
}

.c-entry-expanders {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  margin-right: 0.35rem;
}

.c-inline-expander {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.35rem;
  min-height: 1.35rem;
  padding: 0;
  color: var(--color-text);
  background: transparent;
  border: none;
  cursor: pointer;
}

.c-inline-expander--details {
  opacity: 0.9;
}

.c-ordered-impact-bar {
  position: absolute;
  top: -0.2rem;
  bottom: -0.2rem;
  z-index: 0;
  pointer-events: none;
  transition: width 0.2s ease;
}

.c-ordered-transform-details {
  position: relative;
  z-index: 1;
  margin: 0.5rem 1.5rem 0.3rem;
  padding: 0.8rem 1rem;
  border: 0.1rem dashed var(--color-text);
  background-color: var(--color-base);
  cursor: default;
}

.c-transform-detail-grid {
  display: grid;
  grid-template-columns: max-content minmax(0, 1fr);
  gap: 0.35rem 1.2rem;
  align-items: baseline;
}

.c-transform-detail-grid b {
  overflow-wrap: anywhere;
}

.c-ordered-note {
  margin: 0.8rem 0.5rem 0;
  font-size: 1.05rem;
  line-height: 1.4;
}

.c-single-entry-highlight {
  border: 0.1rem solid;
  font-weight: bold;
  animation: a-glow-text 2s infinite;
}

@keyframes a-glow-text {
  50% { background-color: var(--color-accent); }
}

.c-dilation-entry {
  border: 0.2rem solid;
  font-weight: bold;
  animation: a-glow-dilation-nerf 3s infinite;
}

@keyframes a-glow-dilation-nerf {
  50% { background-color: var(--color-bad); }
}
@media (max-width: 48rem) {
  .c-multiplier-entry-container {
    gap: 0.5rem;
  }

  .c-stacked-bars,
  .c-ordered-path-bars {
    flex-basis: 2.5rem;
    min-width: 2.5rem;
    width: 2.5rem;
  }

  .c-ordered-display-settings {
    min-width: 0;
  }

  .c-transform-detail-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
.c-star-audit-note {
  grid-column: 1 / -1;
  margin: 0.5rem 0 0;
  opacity: 0.8;
  line-height: 1.4;
}
</style>
