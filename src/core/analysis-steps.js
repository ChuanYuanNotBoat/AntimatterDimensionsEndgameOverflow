// Optional, read-only observation of a gameplay formula. With no observer the
// original result and its Number/Decimal type pass through unchanged.
export function analysisStep(observer, key, type, before, after, value) {
  if (!observer) return after;
  if (observer.skip.has(key)) return before;
  observer.steps[key] = { type, before, after, ...(value === undefined ? {} : { value }) };
  return after;
}
