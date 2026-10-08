'use strict';
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const Decimal = require('break_eternity.js');
const read = name => fs.readFileSync(path.join(__dirname, '../../src', name), 'utf8').replace(/\r\n/g, '\n');
const source = name => read(name).replace(/^import\s+[^;]+;\n/gm, '').replace(/^export /gm, '');
function setup() {
  const DC = Object.fromEntries([['D0',0],['D1',1],['D2',2],['D3',3],['E1',10],['E3',1000],
    ['NUMMAX',Number.MAX_VALUE],['E9E15','1e9000000000000000'],['BEMAX','10^^9000000000000000']].map(([k,v]) => [k,new Decimal(v)]));
  const player = { antimatter: new Decimal(10), disablePostReality:false, dilation:{active:false},
    compression:{active:false,rebuyables:{1:0,2:0,3:0},upgrades:new Set(),hawkingRadiation:DC.D0,
      thermalRadiation:DC.D0,nextThreshold:DC.E3,baseElectromagneticWaves:DC.D0,totalElectromagneticWaves:DC.D0},
    universes:{current:0,ephemeralLight:DC.D0,stellarAugmenters:DC.D0,relativisticParticles:DC.D0,
      molecularMass:DC.D0,highestTransientAntimatter:DC.E1,highestTangibleMatter:DC.E1},
    celestials:{pelle:{divinities:new Decimal(13)}, slabdrill:{stage:0,isCursed:false,isDestroyed:false,
      isWarping:false,isGoodbye:false,goodbyeTick:0,warpTick:0,hasBoughtNinthDimension:false,
      serpentinePower:DC.D0,core:{isActive:false,chaosCores:0,lastFound:0}},
      laitela:{hadrons:{total:100,light:5,dark:3,exotic:2}}},
    endgame:{ascension:9,ascensionTimer:0,largeHadronCollider:{powerCores:1,
      accelerators:{potency:{fill:0},emptiness:{fill:0},cosmic:{fill:0}},void:{isRunning:false}},
      overcharge:{isRunning:false,level:1,completions:{bi:0,eter:0,chall:0,ts:0}}},
    endgameMasteries:{preferredPaths:[[],[]]}, records:{totalEndgameAntimatter:DC.E1},
    options:{confirmations:{compression:false,overcharge:false,universes:false}}};
  const state={resets:0,glyphs:0};
  const neutral={isBought:false,isUnlocked:false,canBeApplied:false,effectOrDefault:v=>v,applyEffect(){}};
  const context=vm.createContext({Decimal,DC,player,window:{},console,Date,Set,
    GameEnd:{creditsEverClosed:false},Player:{canCrunch:true},PlayerProgress:{compressionUnlocked:()=>true},
    Achievement:()=>neutral,EndgameMastery:()=>neutral,ResurgenceUpgrade:{unl4:{isBought:true}},
    DivinityMilestone:{serpentPower:{isReached:false},powerBurst:{isReached:false}},
    NormalChallenge:()=>({isCharged:true}),GameUI:{update(){}},Quotes:{slabdrill:{}},
    clearCelestialRuns(){},recalculateAllGlyphs(){state.glyphs++},
    Endgame:{resetNoReward(){state.resets++;player.antimatter=DC.E1}},
    Tab:{dimensions:{antimatter:{show(){}}}},Modal:new Proxy({},{get:()=>({show(){}})}),
    mapGameDataToObject:(configs,fn)=>{const mapped=Object.fromEntries(Object.entries(configs).map(([k,v])=>[k,fn(v)]));mapped.all=Object.values(mapped);return mapped;}});
  const run = code => vm.runInContext(code,context);
  const load = name => run(source(name));
  run(read('core/extensions.js').match(/Math\.clamp = [\s\S]*?Math\.clampMax = [\s\S]*?\n};/)[0]);
  load('core/finite-decimal.js');
  load('core/analysis-steps.js');
  for (const file of ['effect','game-mechanic','puchasable','set-purchasable','rebuyable','bit-upgrade-state','effects']) load('core/game-mechanics/'+file+'.js');
  run(source('core/currency.js').split('Currency.antimatter =')[0]);
  run('this.Currency=Currency;this.DecimalCurrency=DecimalCurrency;');
  for(const [currency,target,key] of [['thermalRadiation',player.compression,'thermalRadiation'],
    ['hawkingRadiation',player.compression,'hawkingRadiation'],['eternityPoints',player,'eternityPoints'],
    ['antimatter',player,'antimatter']]) {
    target[key]??=DC.D0;
    context.Currency[currency]=new (run('DecimalCurrency'))();
    Object.defineProperty(context.Currency[currency],'value',{get:()=>target[key],set:v=>target[key]=v});
  }
  load('core/endgame-challenge.js');
  load('core/secret-formula/endgame/compression-upgrades.js');
  load('core/secret-formula/endgame/ascensions.js');
  load('core/secret-formula/celestials/slabdrill.js');
  run('this.GameDatabase={endgame:{compression:compressionUpgrades,ascensions},celestials:{slabdrill:{unlocks:slabdrillUnlocks}}};');
  context.Time={thisEndgameRealTime:{totalSeconds:new Decimal(1),totalMinutes:new Decimal(1),totalHours:new Decimal(1)}};
  load('core/compression.js');load('core/universes.js');load('core/ascension.js');load('core/celestials/slabdrill.js');
  load('core/storage/chapter3-migrations.js');
  run('this.CompressionUpgrade=CompressionUpgrade;this.Universes=Universes;this.Ascensions=Ascensions;this.Slabdrill=Slabdrill;');
  return {context,player,state,DC,run,load};
}
module.exports={setup,read,source,Decimal};
