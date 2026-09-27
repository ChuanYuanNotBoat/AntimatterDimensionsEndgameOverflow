// Central finite-arithmetic helpers for the post-Break-Eternity range.
// Gameplay resources may reach DC.BEMAX, but arithmetic must never create a
// Decimal whose sign/layer/mag are NaN or Infinity.
const ceiling = () => new Decimal(DC.BEMAX);
const floorPositive = () => ceiling().recip();

function rawDecimal(input) {
  return input instanceof Decimal ? new Decimal(input) : new Decimal(input);
}

export function isFiniteDecimal(input) {
  const value = rawDecimal(input);
  return [value.sign, value.layer, value.mag].every(Number.isFinite);
}

export function finiteDecimal(input, label = "Decimal value") {
  const value = rawDecimal(input);
  if ([value.sign, value.layer, value.mag].some(Number.isNaN)) {
    throw new Error(`Invalid Decimal operand in ${label}`);
  }
  if (!Number.isFinite(value.sign)) throw new Error(`Invalid Decimal sign in ${label}`);
  if (!Number.isFinite(value.layer) || !Number.isFinite(value.mag)) {
    if (value.sign > 0) return ceiling();
    if (value.sign < 0) return ceiling().neg();
    return DC.D0;
  }
  return value;
}

export function boundedPositiveValue(input, label = "positive value") {
  return Decimal.clamp(finiteDecimal(input, label), 0, ceiling());
}

export function boundedSignedValue(input, label = "signed value") {
  return Decimal.clamp(finiteDecimal(input, label), ceiling().neg(), ceiling());
}

export function boundedPositivePower(base, exponent) {
  const value = boundedPositiveValue(base, "power base");
  const power = boundedSignedValue(exponent, "power exponent");
  if (power.eq(0) || value.eq(1)) return DC.D1;
  if (value.eq(0)) return power.lt(0) ? ceiling() : DC.D0;

  const baseLog = value.log10();
  if (baseLog.eq(0)) return DC.D1;
  const absLog = baseLog.abs();
  const absPower = power.abs();
  const maxLog = ceiling().log10();
  if (absPower.gte(maxLog.div(absLog))) {
    return baseLog.lt(0) === power.lt(0) ? ceiling() : DC.D0;
  }

  const result = value.pow(power);
  if ([result.sign, result.layer, result.mag].some(Number.isNaN)) {
    throw new Error("Invalid Decimal result in boundedPositivePower");
  }
  if (!isFiniteDecimal(result)) {
    return baseLog.lt(0) === power.lt(0) ? ceiling() : DC.D0;
  }
  return Decimal.min(result, ceiling());
}

export function boundedPositiveProduct(left, right) {
  const a = boundedPositiveValue(left, "product left");
  const b = boundedPositiveValue(right, "product right");
  if (a.eq(0) || b.eq(0)) return DC.D0;

  const maxLog = ceiling().log10();
  const sumLog = a.log10().add(b.log10());
  if (sumLog.gte(maxLog)) return ceiling();
  if (sumLog.lte(maxLog.neg())) return DC.D0;

  const result = a.times(b);
  return isFiniteDecimal(result) ? Decimal.min(result, ceiling()) : ceiling();
}

export function boundedPositiveSum(left, right) {
  const a = boundedPositiveValue(left, "sum left");
  const b = boundedPositiveValue(right, "sum right");
  if (a.eq(0)) return b;
  if (b.eq(0)) return a;
  if (a.eq(ceiling()) || b.eq(ceiling())) return ceiling();
  if (b.gte(ceiling().sub(a))) return ceiling();

  const result = a.add(b);
  return isFiniteDecimal(result) ? Decimal.min(result, ceiling()) : ceiling();
}

export function boundedPositiveQuotient(numerator, denominator) {
  const a = boundedPositiveValue(numerator, "division numerator");
  const b = boundedPositiveValue(denominator, "division denominator");
  if (a.eq(0)) return DC.D0;
  if (b.eq(0)) return ceiling();

  const maxLog = ceiling().log10();
  const resultLog = a.log10().sub(b.log10());
  if (resultLog.gte(maxLog)) return ceiling();
  if (resultLog.lte(maxLog.neg())) return DC.D0;

  const result = a.div(b);
  if ([result.sign, result.layer, result.mag].some(Number.isNaN)) {
    throw new Error("Invalid Decimal result in boundedPositiveQuotient");
  }
  if (!isFiniteDecimal(result)) return result.sign > 0 ? ceiling() : DC.D0;
  return Decimal.min(result, ceiling());
}

export function boundedPositiveReciprocal(value) {
  return boundedPositiveQuotient(1, value);
}

export function boundedSignedSum(left, right) {
  const a = boundedSignedValue(left, "signed sum left");
  const b = boundedSignedValue(right, "signed sum right");
  if (a.eq(0)) return b;
  if (b.eq(0)) return a;
  if (a.sign === b.sign) {
    const magnitude = boundedPositiveSum(a.abs(), b.abs());
    return a.sign < 0 ? magnitude.neg() : magnitude;
  }
  return boundedSignedValue(a.add(b), "signed sum result");
}

export function boundedSignedProduct(left, right) {
  const a = boundedSignedValue(left, "signed product left");
  const b = boundedSignedValue(right, "signed product right");
  if (a.eq(0) || b.eq(0)) return DC.D0;
  const magnitude = boundedPositiveProduct(a.abs(), b.abs());
  return a.sign === b.sign ? magnitude : magnitude.neg();
}

export function boundedSignedQuotient(numerator, denominator) {
  const a = boundedSignedValue(numerator, "signed division numerator");
  const b = boundedSignedValue(denominator, "signed division denominator");
  if (a.eq(0)) return DC.D0;
  if (b.eq(0)) return a.sign < 0 ? ceiling().neg() : ceiling();
  const magnitude = boundedPositiveQuotient(a.abs(), b.abs());
  return a.sign === b.sign ? magnitude : magnitude.neg();
}

export function boundedPositiveProductMany(values, initial = DC.D1) {
  return values.reduce((result, value) => boundedPositiveProduct(result, value), new Decimal(initial));
}

export function boundedPositiveSumMany(values, initial = DC.D0) {
  return values.reduce((result, value) => boundedPositiveSum(result, value), new Decimal(initial));
}

// Use only for state intentionally stored as a JavaScript Number. Unbounded
// gameplay multipliers/powers should remain Decimal instead of calling this.
export function finiteNumber(input, fallback = 0, maxAbs = Number.MAX_VALUE) {
  if (typeof input === "number") {
    if (Number.isNaN(input)) return fallback;
    if (input === Infinity) return maxAbs;
    if (input === -Infinity) return -maxAbs;
    return Math.clamp(input, -maxAbs, maxAbs);
  }
  const value = finiteDecimal(input, "Number conversion");
  if (value.gte(maxAbs)) return maxAbs;
  if (value.lte(-maxAbs)) return -maxAbs;
  const result = value.toNumber();
  if (Number.isNaN(result)) return fallback;
  if (result === Infinity) return maxAbs;
  if (result === -Infinity) return -maxAbs;
  return result;
}

export function minimumPositiveDecimal() {
  return floorPositive();
}
