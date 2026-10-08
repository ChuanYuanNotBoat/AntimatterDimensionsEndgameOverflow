import { DisplayI18n } from "./display";
import { resolveText } from "./text-ref";
import { t } from "./index";

// Translate the complete canonical description before a UI splits it around values or markup.
// Keep the gameplay config and its formula callbacks untouched.
export function localizedDescription(config, scope) {
  return { ...config, description: () => {
    const description = resolveText(config.description);
    // These complete optional sentences are appended by the EC gameplay config.
    // Translate them independently so adding a Pelle warning doesn't break the main description.
    const parts = scope.startsWith("eternity-challenges:")
      ? description.split(/(?=The Pelle-Specific effect| Currently:)/u) : [description];
    return parts.map(part => DisplayI18n.translate(part, scope)).join(" ");
  } };
}

export function glyphDescription(template, effect) {
  // These dynamic templates have duplicate historical matching rules. Use one
  // reviewed message directly, retaining the renderer's literal value macros.
  if (effect === "replicationdtgain" && template.startsWith("Multiply")) {
    const variant = template.includes("[and") ? "added" : template.includes("and Replication") ? "addedTotal" : "single";
    return t(`glyph.description.replicationdtgain.${variant}`, { p0: format(DC.E10000) });
  }
  const bases = { replicationglyphlevel: () => format(0.4, 1, 1),
    infinityrate: () => formatInt(7), realityDTglyph: () => format(1.3, 1, 1) };
  if (bases[effect] && /factor for Glyph level|conversion rate/u.test(template)) {
    return t(`glyph.description.${effect}.single`, { p0: bases[effect]() });
  }
  return DisplayI18n.translate(template, `glyph-effects:${effect}`);
}
