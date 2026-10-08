import Vue from "vue";

function finiteDisplayDecimal(input, fallback = 1) {
  try {
    const value = new Decimal(input);
    if (Decimal.isFinite(value)) {
      return { value: Decimal.clamp(value, new Decimal(DC.BEMAX).neg(), DC.BEMAX), invalid: false };
    }
    if (Number.isNaN(value.sign) || Number.isNaN(value.layer) || Number.isNaN(value.mag)) {
      return { value: new Decimal(fallback), invalid: true };
    }
    return { value: value.sign > 0 ? new Decimal(DC.BEMAX) : new Decimal(fallback), invalid: true };
  } catch {
    return { value: new Decimal(fallback), invalid: true };
  }
}

function readDisplayDecimal(getter) {
  try {
    return finiteDisplayDecimal(getter() ?? 1);
  } catch {
    return { value: new Decimal(1), invalid: true };
  }
}

function visibleTransform(transform) {
  if (transform === null) return false;
  if (transform.alwaysShow) return true;
  if (["multiply", "power"].includes(transform.type) && transform.value !== null) {
    return transform.value.neq(1);
  }
  return transform.before.neq(transform.after) || (transform.value !== null && transform.value.neq(1));
}

export class BreakdownEntryInfo {
  constructor(key) {
    this.key = key;
    const keyArgs = this.key.split("_");
    const dbEntry = GameDatabase.multiplierTabValues[keyArgs[0]][keyArgs[1]];
    const args = keyArgs.length >= 3
      ? keyArgs.slice(2).map(a => (a.match("^\\d+$") ? Number(a) : a))
      : [];
    this._name = createGetter(dbEntry.name, args);
    this._multValue = createGetter(dbEntry.multValue, args);
    this._powValue = createGetter(dbEntry.powValue, args);
    this._transformValue = createGetter(dbEntry.transformValue, args);
    this._dilationEffect = createGetter(dbEntry.dilationEffect, args);
    this._isActive = createGetter(dbEntry.isActive, args);
    this._fakeValue = createGetter(dbEntry.fakeValue, args);
    this._icon = createGetter(dbEntry.icon, args);
    this._displayOverride = createGetter(dbEntry.displayOverride, args);
    this._isDilated = createGetter(dbEntry.isDilated, args);
    this._isBase = createGetter(dbEntry.isBase, args);
    this._isOrdered = createGetter(dbEntry.isOrdered, args);
    this._ignoresNerfPowers = createGetter(dbEntry.ignoresNerfPowers, args);
    this._hasTransform = dbEntry.transformValue !== undefined;
    this.data = Vue.observable({
      mult: new Decimal(0),
      pow: 0,
      isVisible: false,
      lastVisibleAt: 0,
      hasTransform: false,
      transformType: "",
      transformBefore: new Decimal(1),
      transformAfter: new Decimal(1),
      transformValue: new Decimal(1),
      transformHasValue: false,
      transformDisplay: "",
      transformFinalWith: new Decimal(1),
      transformFinalWithout: new Decimal(1),
      transformHasFinalWithout: false,
      transformAggregate: false,
      transformAggregateScope: "",
      transformPositiveImpact: new Decimal(0),
      transformNegativeImpact: new Decimal(0),
      transformHasImpactBudget: false,
      invalidValue: false
    });
  }

  update(includeFinal = false, valueMode = "all") {
    const active = this.isActive;
    const transform = active ? this.getTransform(includeFinal, valueMode) : null;
    // Cache the values locally. The old code evaluated both the multiplier and power
    // once for visibility and again when writing the observed data, multiplied across
    // every expanded row on each UI update.
    let mult = DC.D1;
    let pow = 1;
    let isVisible = false;
    let invalidValue = false;
    if (active) {
      const multResult = readDisplayDecimal(this._multValue);
      const powResult = readDisplayDecimal(this._powValue);
      mult = multResult.value;
      pow = powResult.value;
      invalidValue = multResult.invalid || powResult.invalid;
      if (this._hasTransform) {
        isVisible = visibleTransform(transform);
      } else {
        isVisible = pow.neq(1) || mult.neq(1);
      }
      isVisible ||= invalidValue;
    }
    this.data.mult.fromDecimal(isVisible ? mult : DC.D1);
    this.data.pow = isVisible ? pow : 1;
    this.data.isVisible = isVisible;
    this.data.invalidValue = invalidValue;

    this.data.hasTransform = transform !== null;
    if (transform) {
      this.data.transformType = transform.type;
      this.data.transformBefore.fromDecimal(transform.before);
      this.data.transformAfter.fromDecimal(transform.after);
      this.data.transformHasValue = transform.value !== null;
      this.data.transformValue.fromDecimal(transform.value ?? DC.D1);
      this.data.transformDisplay = transform.display;
      this.data.transformFinalWith.fromDecimal(transform.finalWith ?? transform.after);
      this.data.transformHasFinalWithout = transform.finalWithout !== null;
      this.data.transformFinalWithout.fromDecimal(transform.finalWithout ?? transform.after);
      this.data.transformAggregate = transform.aggregate;
      this.data.transformAggregateScope = transform.aggregateScope;
      this.data.transformHasImpactBudget = transform.positiveImpact !== null;
      this.data.transformPositiveImpact.fromDecimal(transform.positiveImpact ?? DC.D0);
      this.data.transformNegativeImpact.fromDecimal(transform.negativeImpact ?? DC.D0);
    } else {
      this.data.transformType = "";
      this.data.transformBefore.fromDecimal(DC.D1);
      this.data.transformAfter.fromDecimal(DC.D1);
      this.data.transformHasValue = false;
      this.data.transformValue.fromDecimal(DC.D1);
      this.data.transformDisplay = "";
      this.data.transformFinalWith.fromDecimal(DC.D1);
      this.data.transformFinalWithout.fromDecimal(DC.D1);
      this.data.transformHasFinalWithout = false;
      this.data.transformAggregate = false;
      this.data.transformAggregateScope = "";
      this.data.transformHasImpactBudget = false;
      this.data.transformPositiveImpact.fromDecimal(DC.D0);
      this.data.transformNegativeImpact.fromDecimal(DC.D0);
    }

    if (isVisible) this.data.lastVisibleAt = Date.now();
  }

  get name() {
    return this._name();
  }

  get mult() {
    return readDisplayDecimal(this._multValue).value;
  }

  get pow() {
    return readDisplayDecimal(this._powValue).value;
  }

  get transform() {
    return this.getTransform(false);
  }

  getTransform(includeFinal = false, valueMode = "all") {
    if (!this._hasTransform) return null;
    let raw;
    try {
      raw = this._transformValue();
      if (raw?.forMode) raw = raw.forMode(valueMode);
    } catch {
      raw = { type: "diagnostic", before: 1, after: 1, alwaysShow: true,
        display: "Diagnostic formula unavailable" };
    }
    if (raw === undefined || raw === null) return null;

    const checkedBefore = finiteDisplayDecimal(raw.before ?? 1);
    const checkedAfter = finiteDisplayDecimal(raw.after ?? checkedBefore.value, checkedBefore.value);
    const before = checkedBefore.value;
    const after = checkedAfter.value;
    // Each lazy getter must be read at most once per update.
    const finalWith = includeFinal ? raw.finalWith : null;
    const finalWithout = includeFinal && Object.hasOwn(raw, "finalWithout") ? raw.finalWithout : null;
    const checkedValue = raw.value === undefined || raw.value === null
      ? null : finiteDisplayDecimal(raw.value);
    const invalid = checkedBefore.invalid || checkedAfter.invalid || checkedValue?.invalid;
    return {
      type: raw.type ?? "override",
      before,
      after,
      value: checkedValue?.value ?? null,
      display: invalid ? "Diagnostic value unavailable" : (raw.display ?? ""),
      alwaysShow: (raw.alwaysShow ?? false) || invalid,
      finalWith: finalWith === undefined || finalWith === null ? null : finiteDisplayDecimal(finalWith).value,
      // Do not access lazy finalWithout while displaying only Direct impact.
      finalWithout: finalWithout === undefined || finalWithout === null ? null : finiteDisplayDecimal(finalWithout).value,
      aggregate: raw.aggregate ?? false,
      aggregateScope: raw.aggregateScope ?? "",
      positiveImpact: raw.positiveImpact === undefined ? null : finiteDisplayDecimal(raw.positiveImpact, 0).value,
      negativeImpact: raw.negativeImpact === undefined ? null : finiteDisplayDecimal(raw.negativeImpact, 0).value,
    };
  }

  get dilationEffect() {
    const value = finiteDisplayDecimal(this._dilationEffect() ?? 1).value.toNumber();
    return Number.isFinite(value) ? value : 1;
  }

  get isActive() {
    return this._isActive() ?? false;
  }

  get fakeValue() {
    const value = this._fakeValue();
    return value === undefined || value === null ? value : finiteDisplayDecimal(value).value;
  }

  get icon() {
    return this._icon();
  }

  get displayOverride() {
    let value;
    try {
      value = this._displayOverride();
    } catch {
      return "Diagnostic value unavailable";
    }
    if (typeof value !== "string") return value;
    if (/NaN/u.test(value)) return "Diagnostic value unavailable";
    if (/^[×^]?[+-]?Infinity(?:\/sec)?$/u.test(value)) return "Beyond display limit";
    return value;
  }

  get isDilated() {
    return this._isDilated();
  }

  get isBase() {
    return this._isBase();
  }

  get isOrdered() {
    const explicit = this._isOrdered();
    if (explicit !== undefined) return explicit;
    // Fallback for transform-backed entries without an explicit flag (IP/EP/DT/Infinities/
    // Eternities/Replicanti/Tickspeed sub-entries): nested panels use the same ordered formula
    // style as the resource roots (e.g. IP/EP). Panels whose child rows are raw multiplier/power
    // entries (e.g. IP_base → antimatter display row, IP_achievement → general_* rows) keep the
    // legacy percent-share view, which is the only meaningful presentation for those rows.
    if (!this._hasTransform) return false;
    const groups = GameDatabase.multiplierTabTree[this.key];
    if (groups === undefined) return true;
    // MultiplierTabTree contains arrays of key strings, not BreakdownEntryInfoGroup objects.
    // Use the cached entries to inspect static transform metadata without evaluating formulas.
    return groups.every(keys => keys.every(key => createEntryInfo(key)._hasTransform));
  }

  get ignoresNerfPowers() {
    return this._ignoresNerfPowers() ?? false;
  }

  isVisibleWithTransform(transform) {
    if (!this.isActive) return false;
    if (this._hasTransform) {
      return visibleTransform(transform);
    }
    return this.pow.neq(1) || this.mult.neq(1);
  }

  get isVisible() {
    return this.isVisibleWithTransform(this.transform);
  }
}

function createGetter(property, args) {
  if (typeof property === "function") {
    return () => property(...args);
  }

  return () => property;
}

const cache = new Map();

export function createEntryInfo(key) {
  const cached = cache.get(key);
  if (cached !== undefined) {
    return cached;
  }
  const entry = new BreakdownEntryInfo(key);
  cache.set(key, entry);
  return entry;
}
