import {
  boundedPositivePower,
  boundedPositiveProduct,
  boundedPositiveQuotient,
  boundedSignedProduct,
  boundedSignedQuotient,
  boundedSignedSum,
  finiteNumber,
} from "../finite-decimal";

export const Effects = {
  sum(...effectSources) {
    let result = 0;
    applyEffectsOf(effectSources, v => result = finiteNumber(result + finiteNumber(v, 0), result));
    return result;
  },
  product(...effectSources) {
    let result = 1;
    applyEffectsOf(effectSources, v => result = finiteNumber(result * finiteNumber(v, 1), result));
    return result;
  },
  sumDecimal(...effectSources) {
    let result = DC.D0;
    applyEffectsOf(effectSources, v => result = boundedSignedSum(result, v));
    return result;
  },
  productDecimal(...effectSources) {
    let result = DC.D1;
    applyEffectsOf(effectSources, v => {
      result = result.gte(0) && Decimal.gte(v, 0)
        ? boundedPositiveProduct(result, v)
        : boundedSignedProduct(result, v);
    });
    return result;
  },
  last(defaultValue, ...effectSources) {
    let result = defaultValue;
    let foundLast = false;
    const reversedSources = effectSources.filter(s => s !== null && s !== undefined).reverse();
    const reducer = v => {
      result = typeof v === "number" ? finiteNumber(v, defaultValue) : v;
      foundLast = true;
    };
    for (const effectSource of reversedSources) {
      effectSource.applyEffect(reducer);
      if (foundLast) break;
    }
    return result;
  },
  max(defaultValue, ...effectSources) {
    let result = finiteNumber(defaultValue, 0);
    applyEffectsOf(effectSources, v => result = Math.max(result, finiteNumber(v, result)));
    return result;
  },
  min(defaultValue, ...effectSources) {
    let result = finiteNumber(defaultValue, 0);
    applyEffectsOf(effectSources, v => result = Math.min(result, finiteNumber(v, result)));
    return result;
  }
};

Decimal.prototype.plusEffectOf = function(effectSource) {
  let result = this;
  effectSource.applyEffect(v => result = boundedSignedSum(result, v));
  return result;
};
Decimal.prototype.plusEffectsOf = function(...effectSources) {
  let result = this;
  applyEffectsOf(effectSources, v => result = boundedSignedSum(result, v));
  return result;
};
Decimal.prototype.minusEffectOf = function(effectSource) {
  let result = this;
  effectSource.applyEffect(v => result = boundedSignedSum(result, new Decimal(v).neg()));
  return result;
};
Decimal.prototype.minusEffectsOf = function(...effectSources) {
  let result = this;
  applyEffectsOf(effectSources, v => result = boundedSignedSum(result, new Decimal(v).neg()));
  return result;
};
Decimal.prototype.timesEffectOf = function(effectSource) {
  let result = this;
  effectSource.applyEffect(v => {
    result = result.gte(0) && Decimal.gte(v, 0)
      ? boundedPositiveProduct(result, v)
      : boundedSignedProduct(result, v);
  });
  return result;
};
Decimal.prototype.timesEffectsOf = function(...effectSources) {
  let result = this;
  applyEffectsOf(effectSources, v => {
    result = result.gte(0) && Decimal.gte(v, 0)
      ? boundedPositiveProduct(result, v)
      : boundedSignedProduct(result, v);
  });
  return result;
};
Decimal.prototype.dividedByEffectOf = function(effectSource) {
  let result = this;
  effectSource.applyEffect(v => {
    result = result.gte(0) && Decimal.gte(v, 0)
      ? boundedPositiveQuotient(result, v)
      : boundedSignedQuotient(result, v);
  });
  return result;
};
Decimal.prototype.dividedByEffectsOf = function(...effectSources) {
  let result = this;
  applyEffectsOf(effectSources, v => {
    result = result.gte(0) && Decimal.gte(v, 0)
      ? boundedPositiveQuotient(result, v)
      : boundedSignedQuotient(result, v);
  });
  return result;
};
Decimal.prototype.powEffectOf = function(effectSource) {
  let result = this;
  effectSource.applyEffect(v => result = result.gte(0) ? boundedPositivePower(result, v) : result.pow(v));
  return result;
};
Decimal.prototype.powEffectsOf = function(...effectSources) {
  let result = this;
  applyEffectsOf(effectSources, v => result = result.gte(0) ? boundedPositivePower(result, v) : result.pow(v));
  return result;
};

function applyEffectsOf(effectSources, applyFn) {
  for (const effectSource of effectSources) {
    if (effectSource !== null && effectSource !== undefined) effectSource.applyEffect(applyFn);
  }
}
