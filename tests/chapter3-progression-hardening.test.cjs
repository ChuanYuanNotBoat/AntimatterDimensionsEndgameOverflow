'use strict';
const assert=require('node:assert/strict');
const test=require('node:test');
const {setup,Decimal,read}=require('./helpers/chapter3-gameplay.cjs');
const finite=value=>[value.sign,value.layer,value.mag].every(Number.isFinite);
for(const id of [1,3]) {
  test(`Compression ${id}: bulk matches repeated purchases and declined payments are atomic`,()=>{
    const a=setup(),b=setup();
    for(const w of [a,b]) {w.player.compression.rebuyables[id]=2;w.player.compression.thermalRadiation=new Decimal('1e30');}
    assert.equal(a.context.buyCompressionUpgrade(id,7),true);
    for(let i=0;i<7;i++) assert.equal(b.context.buyCompressionUpgrade(id),true);
    assert.equal(a.player.compression.rebuyables[id],9);
    assert.ok(a.player.compression.thermalRadiation.eq_tolerance(b.player.compression.thermalRadiation, 1e-12));
    a.context.Currency.thermalRadiation.purchase=()=>false;
    const before=JSON.stringify(a.player);assert.equal(a.context.buyCompressionUpgrade(id),false);assert.equal(JSON.stringify(a.player),before);
  });
  test(`Compression ${id}: enormous budgets stop at the safe integer boundary`,()=>{
    const w=setup();w.player.compression.thermalRadiation=w.DC.BEMAX;
    assert.equal(w.context.buyCompressionUpgrade(id,Infinity),true);
    assert.equal(w.player.compression.rebuyables[id],Number.MAX_SAFE_INTEGER);
    assert.equal(w.context.buyCompressionUpgrade(id,Infinity),false);
    assert.ok(finite(w.context.CompressionUpgrade[id===1?'trGain':'hrGain'].effectValue));
  });
}
test('Compression wave threshold caps at 250 and resets only after payment',()=>{
  const w=setup();w.player.compression.rebuyables[2]=249;w.player.compression.thermalRadiation=w.DC.BEMAX;
  assert.equal(w.context.buyCompressionUpgrade(2,Infinity),true);assert.equal(w.player.compression.rebuyables[2],250);
  assert.ok(w.player.compression.thermalRadiation.eq(0));assert.ok(w.player.compression.nextThreshold.eq(1000));
  const before=JSON.stringify(w.player);for(const id of [0,11,NaN,-1])assert.equal(w.context.buyCompressionUpgrade(id),false);
  for(const bulk of [0,.5,-1,NaN])assert.equal(w.context.buyCompressionUpgrade(1,bulk),false);
  assert.equal(JSON.stringify(w.player),before);
});
test('Hawking Radiation has a zero reward below Infinity and a finite reward at the ceiling',()=>{
  const w=setup();for(const am of [0,1,10,'1e307'])assert.ok(w.context.getBaseHR(new Decimal(am),false).eq(0));
  assert.ok(w.context.getBaseHR(new Decimal('1e308'),false).eq(1));assert.ok(finite(w.context.getHR(w.DC.BEMAX,false)));
  w.context.Player.canCrunch=false;assert.ok(w.context.getHR(w.DC.BEMAX,true).eq(0));
});
test('Waves award exact thresholds without rounding gaps or overflow',()=>{
  const w=setup();for(const tr of [0,1,999]){w.player.compression.thermalRadiation=new Decimal(tr);w.context.updateElectromagneticWaves();assert.ok(w.player.compression.baseElectromagneticWaves.eq(0));}
  for(let count=1;count<=12;count++){w.player.compression.thermalRadiation=Decimal.pow(10,count-1).times(1000);w.context.updateElectromagneticWaves();assert.ok(w.player.compression.baseElectromagneticWaves.eq(count),`threshold ${count}`);}
  w.player.compression.upgrades.add(4);w.context.updateElectromagneticWaves();assert.ok(w.player.compression.totalElectromagneticWaves.eq(24));
  w.player.compression.thermalRadiation=w.DC.BEMAX;w.context.updateElectromagneticWaves();assert.ok(finite(w.player.compression.nextThreshold));assert.ok(finite(w.player.compression.totalElectromagneticWaves));
});
for(const mode of ['curse','core','ad9','void','overcharge','compression','universe','warp'])test(`Stale entry confirmation rejects ${mode} without resetting`,()=>{
  const w=setup();const slab=w.player.celestials.slabdrill;
  if(mode==='curse')slab.isCursed=true;if(mode==='core')slab.core.isActive=true;if(mode==='ad9')slab.isDestroyed=true;
  if(mode==='void')w.player.endgame.largeHadronCollider.void.isRunning=true;
  if(mode==='overcharge')w.player.endgame.overcharge.isRunning=true;
  if(mode==='compression')w.player.compression.active=true;if(mode==='universe')w.player.universes.current=1;if(mode==='warp')slab.isWarping=true;
  const before=JSON.stringify(w.player);for(const fn of [()=>w.context.enterUniverse(1),()=>w.context.enterCompression(),()=>w.context.enterOvercharge()])assert.equal(fn(),false);
  assert.equal(w.state.resets,0);assert.equal(JSON.stringify(w.player),before);
});
test('Universes reject locked placeholders, settle before reset, and exit only once',()=>{
  const w=setup();for(const id of [0,3,4,8,99])assert.equal(w.context.enterUniverse(id),false);
  assert.equal(w.context.enterUniverse(1),true);w.player.universes.highestTransientAntimatter=w.DC.BEMAX;
  assert.equal(w.context.exitUniverse(2),false);assert.equal(w.context.exitUniverse(1),true);assert.ok(w.player.universes.ephemeralLight.gt(0));
  const before=JSON.stringify(w.player);assert.equal(w.context.exitUniverse(1),false);assert.equal(JSON.stringify(w.player),before);assert.equal(w.state.glyphs,2);
});
for(const [level,key,cap] of [[1,'bi',9],[2,'eter',6],[3,'chall',32],[4,'ts',62]])test(`Overcharge ${level} settles finite rewards in core exactly once`,()=>{
  const w=setup();w.player.endgame.overcharge.level=level;assert.equal(w.context.enterOvercharge(),true);
  for(const ep of [0,1,10,'1e3999']){w.player.eternityPoints=new Decimal(ep);assert.equal(w.context.getOverchargeEnergyGain(),0);}
  w.player.eternityPoints=new Decimal('1e4000');assert.equal(w.context.getOverchargeEnergyGain(),1);
  w.player.eternityPoints=w.DC.BEMAX;assert.equal(w.context.getOverchargeEnergyGain(),cap);assert.equal(w.context.exitOvercharge(),true);assert.equal(w.player.endgame.overcharge.completions[key],cap);assert.equal(w.context.exitOvercharge(),false);
});
test('Slabdrill hunting checks live cooldown and all power effects remain finite',()=>{
  const w=setup(),s=w.player.celestials.slabdrill;assert.equal(w.context.Slabdrill.hunt(),false);assert.equal(w.context.Slabdrill.enterCore(),false);
  s.isCursed=true;s.core.isActive=true;s.core.chaosCores=Number.MAX_SAFE_INTEGER;assert.equal(w.context.Slabdrill.hunt(),false);
  s.core.chaosCores=3;s.core.lastFound=Date.now();assert.equal(w.context.Slabdrill.hunt(),false);
  s.stage=11;w.context.Slabdrill.advanceLayer();assert.equal(s.stage,11);s.serpentinePower=w.DC.BEMAX;
  for(const [name,effect] of Object.entries(w.context.Slabdrill.slabPowers))assert.ok(finite(effect()),name);
  assert.ok(w.context.Slabdrill.powerPerSecond(0).eq(0));assert.ok(w.context.Slabdrill.powerPerSecond(1).gte(0));
});
test('Universe production and tetration keep economics in Decimal',()=>{
  const w=setup();w.player.antimatter=w.DC.BEMAX;w.context.Time.thisEndgameRealTime.totalSeconds=new Decimal(Number.MAX_VALUE);
  for(const id of [1,2]){w.player.universes.current=id;assert.ok(finite(id===1?w.context.getRelativisticParticlesPerSecond():w.context.getMolecularMassPerSecond()));}
  for(const height of [0,.75,1.5,10])assert.ok(w.context.boundedTetrate10(height).eq(Decimal.tetrate(10,height)));
  assert.ok(w.context.boundedTetrate10('1e17').eq(w.DC.BEMAX));
});
test('Legacy save normalization is idempotent and preserves progress and unknown fields',()=>{
  const w=setup();w.player.universes.current=2;w.player.universes.ephemeralLight=new Decimal('ee400');w.player.compression.active=true;
  w.player.compression.totalElectromagneticWaves=new Decimal('ee400');w.player.compression.rebuyables[1]=Number.MAX_VALUE;
  w.player.celestials.slabdrill.core.chaosCores=Infinity;w.player.communityMetadata={note:'keep'};
  w.context.normalizeChapter3Save(w.player);assert.equal(w.player.compression.active,false);assert.equal(w.player.universes.current,2);
  assert.equal(w.player.endgameMasteries.preferredPaths.length,3);assert.equal(w.player.compression.rebuyables[1],Number.MAX_SAFE_INTEGER);assert.ok(w.player.universes.ephemeralLight.eq('ee400'));
  assert.ok(finite(w.player.celestials.laitela.hadrons.trueTotal));assert.equal(w.player.communityMetadata.note,'keep');
  const before=JSON.stringify(w.player);w.context.normalizeChapter3Save(w.player);assert.equal(JSON.stringify(w.player),before);
});
test('Large offline steps stop at every mandatory cinematic quote',()=>{
  const source=read('game.js');const assignments=source.match(/player\.celestials\.slabdrill\.(?:goodbyeTick|warpTick) = Math\.min\([^;]+;/g);
  assert.equal(assignments.length,4);for(const statement of assignments){const w=setup();w.context.realDiff=86400000;w.run(statement);const cap=Number(statement.match(/Math\.min\((\d+)/)[1]);const key=statement.includes('goodbyeTick')?'goodbyeTick':'warpTick';assert.equal(w.player.celestials.slabdrill[key],cap);}
});

test('Cursed TS123 and TS143 handle freshly reset clocks without 0/0',()=>{
  const w=setup();w.player.celestials.slabdrill.isCursed=true;w.player.disablePostReality=true;
  const seconds=()=>({totalSeconds:new Decimal(0),plus(){return this}});
  Object.assign(w.context.Time,{thisInfinity:seconds(),thisInfinityRealTime:seconds(),thisEternity:seconds(),thisEternityRealTime:seconds()});
  w.context.TimeSpan={fromMinutes:seconds};w.context.Alpha={isRunning:false};w.context.Perk={};
  w.context.TS_REQUIREMENT_TYPE=new Proxy({},{get:()=>0});w.DC.D15=new Decimal(15);
  w.load('core/secret-formula/eternity/time-studies/normal-time-studies.js');
  for(const id of [123,143])assert.ok(finite(w.run(`normalTimeStudies.find(x=>x.id===${id}).effect()`)));
});

test('Legacy Pelle Domain cinematic flags cannot keep later challenge entries locked',()=>{
  const w=setup();const slab=w.player.celestials.slabdrill;slab.isDestroyed=true;slab.hasBoughtNinthDimension=true;slab.isWarping=true;slab.isGoodbye=true;
  w.context.normalizeChapter3Save(w.player);assert.equal(slab.isWarping,false);assert.equal(slab.isGoodbye,false);assert.equal(w.context.enterUniverse(1),true);
});

test('Ethereal generation does not multiply an overflowing factor by zero',()=>{
  const w=setup(),neutral={isBought:false,canBeApplied:false,applyEffect(){},effectOrDefault:v=>v};
  w.player.endgame.celestialPoints=w.DC.BEMAX;w.player.endgame.galacticPower=w.DC.BEMAX;
  w.player.celestials.laitela.singularities=w.DC.D0;w.player.reality={realityMachines:w.DC.BEMAX};
  w.context.Alpha={currentStage:0};w.context.EtherealStars={blue:{reward:w.DC.BEMAX},all:[]};
  w.context.DivineDimensions={conversionFormula1:w.DC.D1};w.context.DivinityUpgrade={divineL2U3:neutral};
  Object.assign(w.context.DivinityMilestone,{hadronEmpowerment:{isReached:false},celestialSurge:{isReached:false},ascendedSurge:{isReached:false}});
  w.context.ResurgenceUpgrade={ethSurge:neutral,synergy6:neutral};w.context.SingularityMilestone={singEthPowerBoost:neutral};
  const raw=read('core/ethereal.js');const fn=raw.match(/export function getEtherealPowerGainPerSecond\(\) \{[\s\S]*?\n\}/)[0];
  w.run(fn.replace(/^export /,''));assert.ok(w.context.getEtherealPowerGainPerSecond().eq(0));
  w.player.celestials.laitela.singularities=w.DC.BEMAX;assert.ok(finite(w.context.getEtherealPowerGainPerSecond()));
});

test('Mastery import budgets account for virtual entanglements and mixed-case shorthand',()=>{
  const w=setup();w.context.EndgameMastery.permaMasteries={isBought:true};
  w.context.Currency.endgameSkills={value:new Decimal(3000000)};
  w.context.GameCache={currentMasteryTree:{value:{spentSkills:[0,0]}}};
  w.load('core/endgame-masteries/endgame-mastery-tree.js');
  assert.equal(w.run('EndgameMasteryTree.isValidImportString("endgameE,celestialE,divineE")'),true);
  assert.equal(w.run('EndgameMasteryTree.truncateInput("endgameE")'),'281,291,301');
  w.run('this.tree = new EndgameMasteryTree();');
  for(const id of [281,291,301])w.context.tree.buySingleMastery({id,cost:123},true);
  assert.equal(w.context.tree.spentSkills[0],3000000);assert.equal(w.context.tree.purchasedMasteries.length,2);
});
