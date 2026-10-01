const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const Decimal = require('break_eternity.js');
const read = file => fs.readFileSync(path.join(__dirname, '../src', file), 'utf8');

function vue(filename, globals = {}) {
  const code = read(filename).match(/<script>([\s\S]*?)<\/script>/)[1]
    .replace(/^import[\s\S]*?;\s*/gm, '').replace('export default', 'module.exports =');
  const context = { module: { exports: {} }, Decimal, GlyphTooltipEffect: {}, GlyphTooltip: {}, ...globals };
  vm.runInNewContext(code, context);
  return context.module.exports;
}

test('Slabdrill cap 0 reaches the tooltip effect calculation instead of falling back to stored level', () => {
  const core = read('core/glyphs/glyph-core.js');
  const context = { Decimal, Slabdrill: { isCursed: true, power: new Decimal(0) }, Glyphs: { levelBoost: 100 } };
  vm.runInNewContext(core.slice(core.indexOf('export function getAdjustedGlyphLevel('),
    core.indexOf('export function respecGlyphs(')).replace('export ', ''), context);
  const glyph = { level: new Decimal(1e9), strength: 3.5, type: 'replication', effects: 256 };
  const capped = context.getAdjustedGlyphLevel(glyph);
  assert.ok(capped.eq(0));
  const tooltip = vue('components/GlyphTooltip.vue', {
    generatedTypes: ['replication'], GlyphEffects: { replicationpow: { isGenerated: true } },
    getGlyphEffectValuesFromBitmask: (_, level) => [{ id: 'replicationpow', value: level.pow(0.4).add(1) }],
  });
  const instance = { ...glyph, displayLevel: capped };
  instance.effectiveLevel = tooltip.computed.effectiveLevel.call(instance);
  assert.ok(instance.effectiveLevel.eq(0));
  assert.equal(tooltip.computed.isLevelCapped.call(instance), true);
  assert.equal(tooltip.computed.isLevelBoosted.call(instance), false);
  assert.ok(tooltip.computed.sortedEffects.call(instance)[0].value.eq(1));
  assert.ok(glyph.level.eq(1e9), 'Displaying a cap must preserve the stored Glyph');
});

test('uncapped previews, positive caps and Reality boosts remain distinct from cap 0', () => {
  const tooltip = vue('components/GlyphTooltip.vue');
  for (const [displayLevel, effective, capped, boosted] of [
    [null, 100, false, false], [new Decimal(0), 0, true, false],
    [new Decimal(20), 20, true, false], [new Decimal(120), 120, false, true],
  ]) {
    const instance = { level: new Decimal(100), displayLevel };
    assert.ok(tooltip.computed.effectiveLevel.call(instance).eq(effective));
    assert.equal(tooltip.computed.isLevelCapped.call(instance), capped);
    assert.equal(tooltip.computed.isLevelBoosted.call(instance), boosted);
  }
});

test('inventory hint and modified-level opt-out preserve a valid zero cap', () => {
  const component = vue('components/GlyphComponent.vue');
  const instance = { glyph: { level: new Decimal(1e9) }, isInventoryGlyph: true, isActiveGlyph: false };
  const hintContext = { Decimal, getAdjustedGlyphLevel: () => new Decimal(0), DC: { D0: new Decimal(0) } };
  const update = component.methods.updateDisplayLevel.toString();
  vm.runInNewContext(`this.update = (${update.replace(/^updateDisplayLevel/, 'function')});`, hintContext);
  hintContext.update.call(instance);
  assert.ok(instance.displayLevel.eq(0));
  instance.ignoreModifiedLevel = true;
  hintContext.update.call(instance);
  assert.equal(instance.displayLevel, null);
});
