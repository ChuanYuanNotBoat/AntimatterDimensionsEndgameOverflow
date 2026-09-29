import {
  boundedPositivePower,
  boundedPositiveProduct,
  boundedSignedValue,
  finiteDecimal,
} from "../../finite-decimal";

const impactLimit = () => new Decimal(DC.BEMAX).log10();

export function isOrderedSourceSkipped(selection, key) {
  return selection instanceof Set ? selection.has(key) : selection === key;
}

function diagnosticValue(input, fallback = DC.D1) {
  try {
    const value = finiteDecimal(input, "multiplier breakdown");
    return { value: Decimal.clamp(value, 0, DC.BEMAX), invalid: false };
  } catch (error) {
    return { value: new Decimal(fallback), invalid: true, error };
  }
}

function impactLog(input) {
  const checked = diagnosticValue(input);
  if (checked.invalid) return null;
  return Decimal.max(checked.value, new Decimal(DC.BEMAX).recip()).log10();
}

function signedImpact(input) {
  try {
    return Decimal.clamp(finiteDecimal(input, "breakdown OoM impact"), impactLimit().neg(), impactLimit());
  } catch {
    return null;
  }
}

function addImpact(total, delta) {
  const a = signedImpact(total);
  const b = signedImpact(delta);
  if (a === null || b === null) return null;
  const limit = impactLimit();
  if (a.gte(0) && b.gte(0) && b.gte(limit.sub(a))) return limit;
  if (a.lte(0) && b.lte(0) && b.neg().gte(limit.add(a))) return limit.neg();
  return signedImpact(a.add(b));
}

export function addOrderedTransform(steps, key, type, before, after, options = {}) {
  const checkedBefore = diagnosticValue(before);
  const checkedAfter = diagnosticValue(after, checkedBefore.value);
  const transform = {
    type: checkedBefore.invalid || checkedAfter.invalid ? "diagnostic" : type,
    before: checkedBefore.value,
    after: checkedAfter.value,
    invalid: checkedBefore.invalid || checkedAfter.invalid,
  };
  if (options.value !== undefined) {
    const checkedValue = diagnosticValue(options.value);
    transform.value = checkedValue.value;
    transform.invalid ||= checkedValue.invalid;
  }
  if (options.display !== undefined) transform.display = options.display;
  if (transform.invalid) {
    transform.display = `${transform.display ?? ""}${transform.display ? "; " : ""}diagnostic value was non-finite`;
    transform.alwaysShow = true;
  } else if (options.alwaysShow !== undefined) transform.alwaysShow = options.alwaysShow;
  steps[key] = transform;
  return transform.after;
}

export function orderedMultiplyStep(steps, key, current, multiplier, skipKey = null, display) {
  if (isOrderedSourceSkipped(skipKey, key)) return current;
  const checkedCurrent = diagnosticValue(current);
  const checkedMultiplier = diagnosticValue(multiplier);
  const invalid = checkedCurrent.invalid || checkedMultiplier.invalid;
  const after = invalid ? checkedCurrent.value : boundedPositiveProduct(checkedCurrent.value, checkedMultiplier.value);
  return steps
    ? addOrderedTransform(steps, key, invalid ? "diagnostic" : "multiply", checkedCurrent.value, after,
      { value: checkedMultiplier.value, display, alwaysShow: invalid })
    : after;
}

export function orderedPowerStep(steps, key, current, power, skipKey = null, display) {
  if (isOrderedSourceSkipped(skipKey, key)) return current;
  const checkedCurrent = diagnosticValue(current);
  let checkedPower;
  try {
    checkedPower = { value: boundedSignedValue(power, "breakdown power"), invalid: false };
  } catch {
    checkedPower = { value: DC.D1, invalid: true };
  }
  const invalid = checkedCurrent.invalid || checkedPower.invalid;
  const after = invalid ? checkedCurrent.value : boundedPositivePower(checkedCurrent.value, checkedPower.value);
  return steps
    ? addOrderedTransform(steps, key, invalid ? "diagnostic" : "power", checkedCurrent.value, after,
      { value: checkedPower.value, display, alwaysShow: invalid })
    : after;
}

export function orderedTransformStep(steps, key, type, current, after, skipKey = null, options = {}) {
  if (isOrderedSourceSkipped(skipKey, key)) return current;
  return steps ? addOrderedTransform(steps, key, type, current, after, options) : diagnosticValue(after).value;
}

export function addOrderedFinalImpacts(steps, evaluate, finalWith, nonRemovableKeys = ["base"]) {
  const nonRemovable = new Set(nonRemovableKeys);
  for (const [key, transform] of Object.entries(steps)) {
    if (nonRemovable.has(key) || transform.type === "diagnostic" ||
        (transform.before.eq(transform.after) && !transform.alwaysShow &&
          (transform.value === undefined || Decimal.eq(transform.value, 1)))) continue;
    transform.finalWith = diagnosticValue(finalWith).value;
    Object.defineProperty(transform, "finalWithout", {
      configurable: true,
      enumerable: true,
      get() {
        let result;
        try {
          result = diagnosticValue(evaluate(key), transform.after).value;
        } catch (error) {
          console.warn(`Multiplier breakdown counterfactual failed for ${key}`, error);
          result = transform.after;
        }
        Object.defineProperty(transform, "finalWithout", {
          configurable: true, enumerable: true, value: result
        });
        return result;
      }
    });
  }
}

export function orderedOoMDifference(first, second) {
  const left = diagnosticValue(first);
  const right = diagnosticValue(second);
  if (left.invalid || right.invalid) return impactLimit();
  if (left.value.eq(right.value)) return DC.D0;
  if (left.value.eq(0) || right.value.eq(0)) return impactLimit();
  return Decimal.min(left.value.log10().sub(right.value.log10()).abs(), impactLimit());
}

export function addOrderedTraceMismatch(steps, finalWith, actual, display,
  absoluteTolerance = 1e-7, relativeTolerance = 1e-12) {
  const expected = diagnosticValue(finalWith);
  const observed = diagnosticValue(actual);
  if (expected.invalid || observed.invalid) {
    return addOrderedTransform(steps, "traceMismatch", "diagnostic", DC.D1, DC.D1, {
      display: `${display}; diagnostic replay produced a non-finite value`, alwaysShow: true
    });
  }
  if (expected.value.eq(observed.value)) return null;
  const difference = orderedOoMDifference(expected.value, observed.value);
  if (difference.lte(absoluteTolerance)) return null;
  if (!expected.value.eq(0) && !observed.value.eq(0)) {
    const scale = Decimal.max(expected.value.log10().abs(), observed.value.log10().abs(), 1);
    if (difference.div(scale).lte(relativeTolerance)) return null;
  }
  return addOrderedTransform(steps, "traceMismatch", "diagnostic", expected.value, observed.value,
    { display, alwaysShow: true });
}

export function aggregateOrderedTransforms(items, resourceLabel, includeFinal = true) {
  const active = items.filter(item => item.transform !== null && item.transform !== undefined &&
    item.transform.type !== "diagnostic");
  if (active.length === 0) return null;

  let hadInvalid = false;
  const delta = (before, after) => {
    const a = impactLog(before);
    const b = impactLog(after);
    if (a === null || b === null) {
      hadInvalid = true;
      return DC.D0;
    }
    return signedImpact(b.sub(a)) ?? DC.D0;
  };
  const directImpact = active.reduce((sum, item) => addImpact(sum,
    delta(item.transform.before, item.transform.after)) ?? sum, DC.D0);
  const directDeltas = active.map(item => delta(item.transform.before, item.transform.after));
  const positiveImpact = directDeltas.reduce((sum, change) =>
    addImpact(sum, change.clampMin(0)) ?? sum, DC.D0);
  const negativeImpact = directDeltas.reduce((sum, change) =>
    addImpact(sum, change.neg().clampMin(0)) ?? sum, DC.D0);
  const finalImpact = active.reduce((sum, item) => {
    const transform = item.transform;
    const d = includeFinal && transform.finalWithout !== undefined && transform.finalWithout !== null
      ? delta(transform.finalWithout, transform.finalWith ?? transform.after)
      : delta(transform.before, transform.after);
    return addImpact(sum, d) ?? sum;
  }, DC.D0);

  const tiers = [...new Set(active.map(item => item.tier).filter(tier => tier !== undefined))];
  const tierText = tiers.length === 1 ? `${resourceLabel}${tiers[0]}` : `${tiers.length} producing ${resourceLabel} tiers`;
  const sourceType = active.every(item => item.transform.type === active[0].transform.type)
    ? active[0].transform.type
    : "formula";
  let sourceValue;
  if (active.every(item => item.transform.value !== undefined && item.transform.value !== null)) {
    if (sourceType === "multiply") {
      sourceValue = active.reduce((product, item) =>
        boundedPositiveProduct(product, item.transform.value), DC.D1);
    } else if (sourceType === "power" && active.every(item =>
      Decimal.eq(item.transform.value, active[0].transform.value))) {
      // Equal powers apply per tier; multiplying them across tiers invents an exponent.
      sourceValue = active[0].transform.value;
    }
  }
  const directBefore = directImpact.lt(0) ? boundedPositivePower(10, directImpact.neg()) : DC.D1;
  const directAfter = directImpact.lt(0) ? DC.D1 : boundedPositivePower(10, directImpact);
  const finalWith = finalImpact.lt(0) ? DC.D1 : boundedPositivePower(10, finalImpact);
  const finalWithout = finalImpact.lt(0) ? boundedPositivePower(10, finalImpact.neg()) : DC.D1;

  return {
    type: sourceType,
    ...(sourceValue === undefined ? {} : { value: sourceValue }),
    before: directBefore,
    after: directAfter,
    positiveImpact,
    negativeImpact,
    ...(includeFinal ? { finalWith, finalWithout } : {}),
    display: hadInvalid ? "Some tier diagnostics were non-finite and were excluded." : "",
    aggregateScope: `Overall across ${tierText}`,
    alwaysShow: active.some(item => item.transform.alwaysShow ||
      (item.transform.value !== undefined && Decimal.neq(item.transform.value, 1))) ||
      directImpact.neq(0) || finalImpact.neq(0),
    aggregate: true,
  };
}

export function createOrderedTransformCache(builder, maxAge = 120) {
  let cached;
  let cachedAt = -Infinity;
  let lastError = null;
  return key => {
    const now = Date.now();
    if (cached === undefined || now < cachedAt || now - cachedAt >= maxAge) {
      try {
        cached = builder();
        lastError = null;
      } catch (error) {
        if (error !== lastError) console.warn("Multiplier breakdown builder failed; keeping the last finite snapshot", error);
        lastError = error;
        cached ??= {};
      }
      cachedAt = Date.now();
    }
    if (key === undefined) return cached;
    return cached[key] ?? null;
  };
}
