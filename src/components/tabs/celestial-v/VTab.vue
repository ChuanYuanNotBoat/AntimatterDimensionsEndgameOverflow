<script>
import CelestialQuoteHistory from "@/components/CelestialQuoteHistory";
import GlyphSetPreview from "@/components/GlyphSetPreview";
import PrimaryButton from "@/components/PrimaryButton";
import { V_REDUCTION_MODE } from "@/core/secret-formula";
import VUnlockRequirement from "./VUnlockRequirement";
import VUpgradeButton from "./VUpgradeButton";

export default {
  name: "VTab",
  components: {
    CelestialQuoteHistory,
    VUnlockRequirement,
    VUpgradeButton,
    PrimaryButton,
    GlyphSetPreview
  },
  data() {
    return {
      mainUnlock: false,
      canUnlockCelestial: false,
      totalUnlocks: 0,
      pp: 0,
      showReduction: false,
      runRecords: [],
      runGlyphs: [],
      isFlipped: false,
      wantsFlipped: true,
      isRunning: false,
      hasAlchemy: false,
      hasUpgrades: false,
    };
  },
  computed: {
    mainUnlockDB: () => GameDatabase.celestials.v.mainUnlock,
    celestialUnlockClassObject() {
      return {
        "o-v-milestone": true,
        "o-v-milestone--unlocked": this.canUnlockCelestial,
        "c-v-unlock-button--enabled": this.canUnlockCelestial
      };
    },
    // If V is flipped, change the layout of the grid
    hexGrid() {
      return this.isFlipped && this.wantsFlipped
        ? [
          VRunUnlocks.all[6],
          {},
          {},
          {},
          { isRunButton: true },
          VRunUnlocks.all[7],
          VRunUnlocks.all[8],
          {},
          {}
        ]
        : [
          VRunUnlocks.all[0],
          VRunUnlocks.all[1],
          {},
          VRunUnlocks.all[5],
          { isRunButton: true },
          VRunUnlocks.all[2],
          VRunUnlocks.all[4],
          VRunUnlocks.all[3],
          {}
        ];
    },
    vUnlock: () => VUnlocks.vAchievementUnlock,
    runMilestones() {
      return [
        [
          VUnlocks.shardReduction,
          VUnlocks.adPow,
          VUnlocks.fastAutoEC
        ],
        [
          VUnlocks.autoAutoClean,
          VUnlocks.achievementBH,
          VUnlocks.raUnlock
        ],
      ];
    },
    upgrades() {
      return [
        VUpgrade.auto,
      ];
    },
    runButtonClassObject() {
      return {
        "l-v-hexagon": true,
        "c-v-run-button": true,
        "c-v-run-button--running": this.isRunning,
        "c-celestial-run-button--clickable": !this.isDoomed,
        "o-pelle-disabled-pointer": this.isDoomed
      };
    },
    runDescription() {
      return GameDatabase.celestials.descriptions[3].effects().replace(/^\w/u, c => c.toUpperCase());
    },
    isDoomed: () => Pelle.isDoomed || Slabdrill.isCursed,
  },
  methods: {
    update() {
      this.mainUnlock = VUnlocks.vAchievementUnlock.isUnlocked;
      this.canUnlockCelestial = V.canUnlockCelestial;
      this.totalUnlocks = V.spaceTheorems;
      this.pp = Currency.perkPoints.value;
      this.showReduction = VUnlocks.shardReduction.isUnlocked;
      this.runRecords = cloneDeep(player.celestials.v.runRecords);
      this.runGlyphs = cloneDeep(player.celestials.v.runGlyphs.map(gList => Glyphs.copyForRecords(gList)));
      this.isFlipped = V.isFlipped;
      this.wantsFlipped = player.celestials.v.wantsFlipped;
      this.isRunning = V.isRunning;
      this.hasAlchemy = Ra.unlocks.unlockGlyphAlchemy.canBeApplied;
      this.hasUpgrades = ExpansionPack.vPack.isBought && !player.disablePostReality;
    },
    unlockCelestial() {
      if (V.canUnlockCelestial) V.unlockCelestial();
    },
    startRun() {
      if (this.isDoomed) return;
      Modal.celestials.show({ name: "V's", number: 3 });
    },
    has(info) {
      return info.isUnlocked;
    },
    mode(hex) {
      return hex.config.mode === V_REDUCTION_MODE.SUBTRACTION ? "reduced" : "divided";
    },
    reductionValue(hex) {
      return hex.config.mode === V_REDUCTION_MODE.SUBTRACTION
        ? formatInt(hex.reduction)
        : format(Decimal.pow10(hex.reduction));
    },
    showRecord(hex) {
      return new Decimal(this.runRecords[hex.id]).gt(0) || hex.completions > 0;
    },
    reduceGoals(hex) {
      if (!Currency.perkPoints.purchase(hex.reductionCost)) return;
      const steps = hex.config.reductionStepSize ? hex.config.reductionStepSize : 1;
      player.celestials.v.goalReductionSteps[hex.id] += steps;
      for (const unlock of VRunUnlocks.all) {
        unlock.tryComplete();
      }
      V.checkForUnlocks();
    },
    reductionTooltip(hex) {
      return `Spend ${quantify("Perk Point", hex.reductionCost, 2, 0)}
        to reduce goal by ${format(hex.config.perReductionStep)}`;
    },
    hexColor(hex) {
      const completions = hex.completions;
      const maxed = hex.config.values.length;
      if (completions === maxed) return "var(--color-v--base)";
      const r = 255 - 5 * completions;
      const g = 255 - 10 * completions;
      const b = 255 - 20 * completions;
      return `rgb(${r},${g},${b})`;
    },
    toggleFlipped() {
      player.celestials.v.wantsFlipped = !this.wantsFlipped;
    },
    createCursedGlyph() {
      Glyphs.giveCursedGlyph();
    },
  }
};
</script>

<template>
  <div class="l-v-celestial-tab">
    <CelestialQuoteHistory celestial="v" />
    <div
      v-if="!mainUnlock"
      class="c-v-info-text"
    >
      <v-unlock-requirement
        v-for="req in mainUnlockDB"
        :key="req.name"
        :db-entry="req"
      />
      <div class="l-v-milestones-grid__row">
        <div
          :class="celestialUnlockClassObject"
          @click="unlockCelestial"
        >
          <p>{{ $legacyText(_s(vUnlock.description)) }}</p>
          <p>{{ $legacyText(_s(vUnlock.rewardText)) }}</p>
        </div>
      </div>
    </div>
    <div v-else>
      <div
        v-if="isFlipped"
        class="c-v-info-text"
      >
        <PrimaryButton
          class="o-primary-btn--subtab-option"
          @click="toggleFlipped"
        >
          <LocalizedText id="ade.066c64b0abb7a9dc">
    <template #p0><span v-if="wantsFlipped">{{ $t('ade.e0bcc69a62163dce') }}</span>
<span v-else>{{ $t('ade.04aa4eaa9accbfcd') }}</span></template>
  </LocalizedText>
        </PrimaryButton>
        <PrimaryButton
          class="o-primary-btn--subtab-option l-cursed-glyph-creation"
          @click="createCursedGlyph"
        >
          {{ $t('ade.f72357ad6eb513c4') }}
        </PrimaryButton>
        <br>
        {{ $t('ade.6f7ec4b74f1f3487') }}
        <br>
        {{ $t('ade.a22a2b0de6986bdb', { p0: $legacyText(_s(formatInt(-3))) }) }}
        <br>
        <span v-if="!isDoomed">{{ $t('ade.d9b4e40a9e193be2') }}</span>
        <br><br>
        {{ $t('ade.43eb96c94412beb9', { p0: $legacyText(_s(formatInt(2))), p1: $legacyText(_s(formatInt(1))) }) }}
        <br>
        {{ $t('ade.2d41f17716b52954') }}
      </div>
      <div
        v-if="showReduction"
        class="c-v-info-text"
      >
        {{ $t('ade.72a577765e7e40b3', { p0: $legacyText(_s(quantify("Perk Point",pp,2,0))) }) }}
      </div>
      <div class="l-v-upgrades-grid">
        <VUpgradeButton
          v-if="hasUpgrades"
          v-for="upgrade in upgrades"
          :key="upgrade.id"
          :upgrade="upgrade"
        />
      </div>
      <div class="l-v-unlocks-container">
        <li
          v-for="(hex, hexId) in hexGrid"
          :key="hexId + '-v-hex'"
          :style="[hex.isRunButton ? {zIndex: 1} : {zIndex: 0}]"
        >
          <div
            v-if="hex.config"
            class="l-v-hexagon c-v-unlock"
            :style="'background-color: ' + hexColor(hex)"
          >
            <p class="o-v-unlock-name">
              <br v-if="hex.canBeReduced && showReduction">{{ $legacyText(_s(hex.config.name)) }}
            </p>
            <p
              class="o-v-unlock-desc"
              v-html="$legacyHtml(hex.formattedDescription)"
            />
            <p
              v-if="has(runMilestones[0][0]) && hex.isReduced"
              class="o-v-unlock-goal-reduction"
            >
              {{ $t('ade.00819aa9a5c30b19', { p0: $legacyText(_s(mode(hex))), p1: $legacyText(_s(reductionValue(hex))) }) }}
            </p>
            <p class="o-v-unlock-amount">
              {{ $t('ade.57d48b4d06afb549', { p0: $legacyText(_s(formatInt(hex.completions))), p1: $legacyText(_s(formatInt(hex.config.values.length))) }) }}
            </p>
            <div v-if="showRecord(hex)">
              <p class="o-v-unlock-record">
                {{ $t('ade.63e526c10b31e099', { p0: $legacyText(_s(hex.config.formatRecord(runRecords[hex.id]))) }) }}
              </p>
              <p>
                <GlyphSetPreview
                  :glyphs="runGlyphs[hex.id]"
                  :text="hex.config.name"
                  :text-hidden="true"
                />
              </p>
              <div v-if="hex.canBeReduced && showReduction">
                <div class="l-v-goal-reduction-spacer" />
                <button
                  class="o-primary-btn l-v-reduction"
                  :class="{ 'o-primary-btn--disabled': !hex.canBeReduced || pp < hex.reductionCost }"
                  :ach-tooltip="$legacyText(reductionTooltip(hex))"
                  @click="reduceGoals(hex)"
                >
                  <i class="fas fa-angle-double-down" />
                </button>
              </div>
            </div>
          </div>
          <div
            v-else-if="hex.isRunButton"
            :class="runButtonClassObject"
            @click="startRun()"
          >
            <b
              class="o-v-start-text"
              :class="{ 'o-pelle-disabled': isDoomed }"
            >
              <span v-if="isRunning">{{ $t('ade.7eb1604c3f5151e4') }} </span>
              <span v-else>{{ $t('ade.62b158013e5a02ae') }} </span>
              V's Reality.
            </b>
            <br>
            <div :style="{ 'font-size': hasAlchemy ? '1.2rem' : '' }">
              {{ $legacyText(_s(runDescription)) }}
            </div>
            <div class="c-v-run-button__line c-v-run-button__line--1" />
            <div class="c-v-run-button__line c-v-run-button__line--2" />
            <div class="c-v-run-button__line c-v-run-button__line--3" />
          </div>
          <div v-else>
            <div class="l-v-hexagon l-placeholder-invisible" />
          </div>
        </li>
      </div>
      <div class="c-v-info-text">
        {{ $t('ade.05b9a281d4ab23de') }}
      </div>
      <div class="c-v-info-text">
        <LocalizedText id="ade.76b0672813bce858">
          <template #p0>{{ $legacyText(_s(formatInt(totalUnlocks))) }}</template>
          <template #p1><span v-if="!isDoomed">
          You gain {{ $legacyText(_s(formatInt(1))) }} Space Theorem for each completion,
          allowing you to purchase Time Studies which are normally locked.
          <br>
          {{ $t('ade.ebe2001648c00f24') }}
        </span></template>
        </LocalizedText>
      </div>
      <br>
      <div class="l-v-milestones-grid">
        <div
          v-for="(row, rowId) in runMilestones"
          :key="rowId + '-v-ms-row'"
          class="l-v-milestones-grid__row"
        >
          <div
            v-for="(milestone, colId) in row"
            :key="colId + rowId*10 + '-v-ms'"
            class="o-v-milestone"
            :class="{'o-v-milestone--unlocked':
              has(milestone)}"
          >
            <div :class="{ 'o-pelle-disabled': isDoomed && milestone.pelleDisabled }">
              <p>{{ $legacyText(_s(milestone.description)) }}</p>
              <p>{{ $t('ade.bd13cbc1d66c8881', { p0: $legacyText(_s(milestone.rewardText)) }) }}</p>
              <p v-if="milestone.formattedEffect">
                <LocalizedText id="ade.3ec0110124609f74">
                  <template #p0><b>{{ $legacyText(_s(milestone.formattedEffect)) }}</b></template>
                </LocalizedText>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.o-v-start-text {
  font-size: 1.5rem;
}

.l-placeholder-invisible {
  opacity: 0;
}

.l-v-goal-reduction-spacer {
  height: 0.8rem;
}

.l-cursed-glyph-creation {
  background: var(--color-effarig--base);
}
</style>
