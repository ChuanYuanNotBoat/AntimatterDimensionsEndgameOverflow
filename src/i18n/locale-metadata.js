// Adding a language only requires a new JSON file; its metadata lives in that file.
const context = require.context("../locales", false, /\.json$/u);
export const languagePacks = Object.fromEntries(context.keys().sort().map(file => {
  const pack = context(file);
  const id = file.slice(2, -5);
  if (pack.$meta?.id !== id) throw new Error(`Language metadata does not match ${file}`);
  return [id, pack];
}));
export const localeMetadata = Object.freeze(Object.values(languagePacks)
  .map(pack => Object.freeze({ ...pack.$meta })));
