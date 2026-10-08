const assert = require('node:assert/strict');
const {test} = require('node:test');
const {execFileSync} = require('node:child_process');
const {setup,Decimal} = require('./helpers/chapter3-gameplay.cjs');
const ids=['timepow','timespeed','timeetermult','timeEP','dilationDT','dilationgalaxyThreshold','dilationTTgen',
  'dilationpow','replicationspeed','replicationpow','replicationdtgain','replicationglyphlevel','infinityrate',
  'infinityIP','infinityinfmult','powerpow','powermult','powerdimboost','powerbuy10'];
function world() {
  const w=setup();w.player.celestials.slabdrill.isCursed=true;
  w.context.ALTERATION_TYPE={ADDITION:1,EMPOWER:2,BOOST:3};
  w.load('core/secret-formula/reality/glyph-effects.js');
  return w;
}
test('all cursed basic Glyph formulas retain ordinary values and stay finite at zero and huge levels',()=>{
  const w=world();
  const baseline=execFileSync('git',['show','559120d11:src/core/secret-formula/reality/glyph-effects.js'],{encoding:'utf8'})
    .replace(/^import[^;]+;\s*/gm,'').replace(/^export /gm,'')
    .replace(/\bGlyphCombiner\b/g,'LegacyGlyphCombiner').replace(/\bglyphEffects\b/g,'legacyGlyphEffects');
  w.run(baseline);
  const current=w.run('glyphEffects'),previous=w.run('legacyGlyphEffects');
  for(const id of ids) {
    assert.ok(new Decimal(current[id].effect(new Decimal(1000),3.5))
      .eq_tolerance(previous[id].effect(new Decimal(1000),3.5),1e-12),id);
    for(const level of [w.DC.D0,w.DC.BEMAX]) {
      const value=new Decimal(current[id].effect(level,3.5));
      assert.ok([value.sign,value.layer,value.mag].every(Number.isFinite),id);
    }
  }
  assert.ok(current.dilationgalaxyThreshold.effect(w.DC.D0,3.5).eq(1));
  assert.ok(current.infinityIP.combine([w.DC.BEMAX,w.DC.BEMAX]).value.eq(w.DC.BEMAX));
});
