import { t, I18n } from "./index";

const TEXT_REF = Symbol("i18n text reference");

export function textRef(key, values = {}) {
  return Object.freeze({ [TEXT_REF]: true, key, values });
}

export function isTextRef(value) {
  return value?.[TEXT_REF] === true;
}

export function resolveText(value) {
  try {
    const resolved = typeof value === "function" ? value() : value;
    if (typeof resolved === "string") return resolved;
    if (isTextRef(resolved)) {
      const values = typeof resolved.values === "function" ? resolved.values() : resolved.values;
      return t(resolved.key, values);
    }
    throw new TypeError("Expected a string, text reference, or function returning text");
  } catch (error) {
    I18n.diagnose("text-ref-error", { key: isTextRef(value) ? value.key : "", reason: error.name });
    throw error;
  }
}
