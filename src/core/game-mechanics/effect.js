import { boundedSignedValue } from "../finite-decimal";

function finiteEffectValue(value, label = "effect value") {
  if (typeof value === "number") {
    if (Number.isNaN(value)) throw new Error(`Invalid numerical ${label}`);
    if (value === Infinity) return Number.MAX_VALUE;
    if (value === -Infinity) return -Number.MAX_VALUE;
    return value;
  }
  if (value instanceof Decimal) return boundedSignedValue(value, label);
  return value;
}

export class Effect {
  constructor(effect, cap, condition) {
    if (effect === undefined || this.isCustomEffect) return;
    const isFunction = v => typeof v === "function";
    const isNumber = v => typeof v === "number";
    const isDecimal = v => v instanceof Decimal;
    const isConstant = v => isNumber(v) || isDecimal(v);
    if (!isFunction(effect) && !isConstant(effect)) throw new Error("Unknown effect value type.");

    const createProperty = () => ({ configurable: false });
    const addGetter = (property, v, label) => {
      if (isConstant(v)) {
        property.writable = false;
        property.value = finiteEffectValue(v, label);
      } else if (isFunction(v)) {
        property.get = () => finiteEffectValue(v(), label);
      } else {
        throw new Error("Unknown getter type.");
      }
    };

    if (condition !== undefined) {
      if (!isFunction(condition)) throw new Error("Effect condition must be a function.");
      const conditionProperty = createProperty();
      conditionProperty.get = condition;
      Object.defineProperty(this, "isEffectConditionSatisfied", conditionProperty);
    }

    const uncappedEffectValueProperty = createProperty();
    addGetter(uncappedEffectValueProperty, effect, "uncapped effect value");
    Object.defineProperty(this, "uncappedEffectValue", uncappedEffectValueProperty);

    if (cap !== undefined) {
      const capProperty = createProperty();
      addGetter(capProperty, cap, "effect cap");
      Object.defineProperty(this, "cap", capProperty);
    }

    const effectValueProperty = createProperty();
    addGetter(effectValueProperty, effect, "effect value");
    if (isConstant(cap)) {
      if (isNumber(effect)) {
        effectValueProperty.get = () => Math.min(finiteEffectValue(effect), this.cap);
      } else if (isDecimal(effect)) {
        effectValueProperty.get = () => Decimal.min(finiteEffectValue(effect), this.cap);
      } else if (isFunction(effect)) {
        effectValueProperty.configurable = true;
        effectValueProperty.get = () => {
          const first = finiteEffectValue(effect());
          const specializedProperty = createProperty();
          if (isNumber(first)) specializedProperty.get = () => Math.min(finiteEffectValue(effect()), this.cap);
          else if (isDecimal(first)) specializedProperty.get = () => Decimal.min(finiteEffectValue(effect()), this.cap);
          else throw new Error("Unknown effect value type.");
          Object.defineProperty(this, "effectValue", specializedProperty);
          return specializedProperty.get();
        };
      }
    } else if (isFunction(cap)) {
      if (isNumber(effect)) {
        effectValueProperty.get = () => {
          const capValue = this.cap;
          const value = finiteEffectValue(effect);
          return capValue === undefined ? value : Math.min(value, capValue);
        };
      } else if (isDecimal(effect)) {
        effectValueProperty.get = () => {
          const capValue = this.cap;
          const value = finiteEffectValue(effect);
          return capValue === undefined ? value : Decimal.min(value, capValue);
        };
      } else if (isFunction(effect)) {
        effectValueProperty.configurable = true;
        effectValueProperty.get = () => {
          const first = finiteEffectValue(effect());
          const specializedProperty = createProperty();
          if (isNumber(first)) {
            specializedProperty.get = () => {
              const capValue = this.cap;
              const value = finiteEffectValue(effect());
              return capValue === undefined ? value : Math.min(value, capValue);
            };
          } else if (isDecimal(first)) {
            specializedProperty.get = () => {
              const capValue = this.cap;
              const value = finiteEffectValue(effect());
              return capValue === undefined ? value : Decimal.min(value, capValue);
            };
          } else throw new Error("Unknown effect value type.");
          Object.defineProperty(this, "effectValue", specializedProperty);
          return specializedProperty.get();
        };
      }
    }
    Object.defineProperty(this, "effectValue", effectValueProperty);
  }

  get effectValue() { throw new Error("Effect is undefined."); }
  get uncappedEffectValue() { throw new Error("Effect is undefined."); }
  get cap() { throw new Error("Cap is undefined."); }
  get isEffectConditionSatisfied() { return true; }
  get isEffectActive() { return true; }
  get canBeApplied() { return this.isEffectActive && this.isEffectConditionSatisfied; }
  effectOrDefault(defaultValue) { return this.canBeApplied ? this.effectValue : defaultValue; }
  applyEffect(applyFn) { if (this.canBeApplied) applyFn(this.effectValue); }
  get isCustomEffect() { return false; }
}
