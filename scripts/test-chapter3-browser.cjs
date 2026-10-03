/* Optional browser regression runner. Use an existing Playwright installation;
 * no browser or test dependency is added to the game. Never writes the supplied save. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const playwright=require(process.env.ADE_PLAYWRIGHT_MODULE || (process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright'));
const url=process.env.ADE_TEST_URL || 'http://127.0.0.1:40765/?inspectSave=1';
(async()=>{
 const browser=await playwright.chromium.launch({executablePath:process.env.ADE_CHROMIUM_PATH,
   args:process.env.ADE_CHROMIUM_PATH?['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader']:[],headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1450,height:1100}}),errors=[];
  page.on('pageerror',e=>errors.push(e.stack));page.on('console',m=>{if(/\[i18n\] (?:format|values|catalog):|\[Vue warn\].*(?:Error|Invalid)/.test(m.text()))errors.push(m.text());});
  await page.route('**/*',r=>{const u=new URL(r.request().url());return /\.webm/.test(u.pathname)?r.fulfill({status:200,body:''}):u.origin===new URL(url).origin?r.continue():r.abort();});
  await page.goto(url);await page.waitForFunction(()=>window.GameUI?.initialized);
  const save=fs.readFileSync(process.env.ADE_TEST_SAVE,'utf8').trim();
  const base=await page.evaluate(s=>{
   GameIntervals.stop();GameIntervals.start=()=>{};GameIntervals.restart=()=>{};for(const i of GameIntervals.all()){i.start=()=>{};i.restart=()=>{}}GameStorage.offlineEnabled=false;
   GameStorage.loadPlayerObject(GameSaveSerializer.deserialize(s));Modal.hideAll();Quote.clearAll();
   player.hasSeenIntro=true;player.introFrozen=false;player.celestials.slabdrill.isCursed=false;player.celestials.slabdrill.core.isActive=false;
   player.celestials.slabdrill.isDestroyed=false;player.celestials.slabdrill.isGoodbye=false;player.celestials.slabdrill.isWarping=false;
   player.disablePostReality=false;player.auto.autobuyersOn=false;player.endgame.largeHadronCollider.void.isRunning=false;
   player.endgame.overcharge.isRunning=false;player.compression.active=false;player.universes.current=0;
   player.options.hiddenTabBits=0;player.options.hiddenSubtabBits.fill(0);player.options.confirmations.compression=false;
   player.options.confirmations.overcharge=false;player.options.confirmations.universes=false;Lazy.invalidateAll();
   return GameSaveSerializer.serialize(player);
  },save);
  async function scenario(name,fn){const result=await page.evaluate(({s,fn})=>{
   GameStorage.loadPlayerObject(GameSaveSerializer.deserialize(s));Modal.hideAll();Quote.clearAll();Lazy.invalidateAll();
   const check=(condition,message)=>{if(!condition)throw Error(message)};
   const finite=value=>value instanceof Decimal?[value.sign,value.layer,value.mag].every(Number.isFinite):Number.isFinite(value);
   return new Function('check','finite',fn)(check,finite);
  },{s:base,fn:fn.toString().replace(/^.*?\{([\s\S]*)\}$/,'$1')});console.log(name,JSON.stringify(result));}
  if (!process.env.ADE_TEST_UI_ONLY) {
  await scenario('Compression purchase/entry/exit',()=>{
   player.endgameMasteries.permanentMasteries.push(3);Lazy.invalidateAll();check(PlayerProgress.compressionUnlocked(),'fixture compression unlock');
   check(enterCompression(),'enter');check(!enterCompression(),'repeat enter');
   player.compression.thermalRadiation=DC.BEMAX;check(buyCompressionUpgrade(1,Infinity),'bulk');check(player.compression.rebuyables[1]===Number.MAX_SAFE_INTEGER,'safe count');
   player.records.totalEndgameAntimatter=new Decimal('1e10000');check(exitCompression(),'exit');check(!exitCompression(),'repeat exit');check(finite(player.compression.hawkingRadiation),'HR');
   return {reward:player.compression.hawkingRadiation.toString()};
  });
  await scenario('Universe resets and rewards',()=>{
   player.celestials.pelle.divinities=new Decimal(30);check(enterUniverse(1),'enter');
   player.universes.highestTransientAntimatter=new Decimal('ee100');check(exitUniverse(1),'exit');check(!exitUniverse(1),'repeat exit');check(finite(player.universes.ephemeralLight),'light');
   check(!enterUniverse(4),'unimplemented universe');return {light:player.universes.ephemeralLight.toString()};
  });
  await scenario('Overcharge low and maximum rewards',()=>{
   player.endgame.ascension=9;player.endgame.overcharge.level=1;player.endgame.overcharge.completions.bi=0;check(enterOvercharge(),'enter');player.eternityPoints=DC.D0;
   check(getOverchargeEnergyGain()===0,'low reward');check(exitOvercharge(),'exit');check(player.endgame.overcharge.completions.bi===0,'no NaN');
   check(enterOvercharge(),'re-enter');player.eternityPoints=DC.BEMAX;check(exitOvercharge(),'exit max');check(player.endgame.overcharge.completions.bi===9,'cap');check(!exitOvercharge(),'repeat exit');return {energy:9};
  });
  await scenario('Core snapshot restore and cooldown',()=>{
   player.celestials.slabdrill.isCursed=true;player.disablePostReality=true;player.celestials.slabdrill.stage=5;
   player.dimensions.antimatter[8].amount=new Decimal(1234);player.dimensions.infinity[8].amount=new Decimal(5678);
   player.eternityChalls.eterc7=3;const am=player.antimatter.toString();check(Slabdrill.enterCore(),'core enter');check(!Slabdrill.enterCore(),'repeat core');
   player.celestials.slabdrill.core.lastFound=Date.now();check(!Slabdrill.hunt(),'cooldown');
   check(Slabdrill.exitCore(),'core exit');check(!Slabdrill.exitCore(),'repeat core exit');check(player.antimatter.eq(am),'restore AM');
   check(player.dimensions.antimatter[8].amount.eq(1234),'restore AD9');check(player.dimensions.infinity[8].amount.eq(5678),'restore ID9');check(player.eternityChalls.eterc7===3,'restore EC');return {restored:true};
  });
  await scenario('Star rewards and mastery effects at boundaries',()=>{
   for(const amount of [DC.D0,DC.D1,new Decimal('ee100'),DC.BEMAX]) {
    for(const key of Object.keys(player.endgame.ethereal.stars))player.endgame.ethereal.stars[key]=amount;
    player.universes.stellarAugmenters=amount;Lazy.invalidateAll();
    for(const star of EtherealStars.all)check(finite(star.reward),'star '+star.id+' '+amount);
   }
   for(const value of [DC.D0,DC.D1,DC.BEMAX]){
    player.endgame.celestialPoints=value;player.endgame.celDimExpansion.celestialEternityPoints=value;player.celestials.pelle.divinity.nebulae=value;
    for(const id of [281,282,283,291,292,293])check(finite(EndgameMastery(id).effectValue),'mastery '+id);
   }
   return {stars:9,masteries:6};
  });
  await scenario('Hadrons, collider bulk and singularity',()=>{
   player.compression.totalElectromagneticWaves=DC.BEMAX;Hadrons.updateTotals();Lazy.invalidateAll();check(finite(player.celestials.laitela.hadrons.trueTotal),'hadrons');
   check(LHC.powerCores.buyMax(),'cores buy max');check(player.endgame.largeHadronCollider.powerCores===Number.MAX_SAFE_INTEGER,'core count');check(!LHC.powerCores.buyMax(),'capped');
   player.celestials.laitela.singularityCapIncreases=new Decimal('1e12');Singularity.increaseCap();check(player.celestials.laitela.singularityCapIncreases.gt('1e12'),'increase');Singularity.decreaseCap();check(finite(Singularity.cap),'cap');check(finite(Singularity.singularitiesGained),'gain');return {finite:true};
  });
  await scenario('Save roundtrip and real game ticks',()=>{
   for(const mode of [0,1,2,3,4]){
    player.compression.active=mode===1;player.universes.current=mode===2?1:mode===3?2:0;player.endgame.overcharge.isRunning=mode===4;
    gameLoop(100,{realDiff:100});
   }
   const s=GameSaveSerializer.serialize(player);GameStorage.loadPlayerObject(GameSaveSerializer.deserialize(s));
   check(GameStorage.checkPlayerObject(player)==='','save valid');gameLoop(86400000,{realDiff:86400000});
   check(GameStorage.checkPlayerObject(player)==='','offline tick valid');return {roundtrip:true};
  });
  }
  // Reuse the original save for text checks; changing language must preserve canonical state.
  await page.evaluate(s=>{GameStorage.loadPlayerObject(GameSaveSerializer.deserialize(s));Modal.hideAll();Quote.clearAll();},base);
  const reports=[];
  for(const modern of [true,false])for(const locale of ['zh-CN','en','zh-CN']){
   await page.evaluate(async({modern,locale})=>{player.options.newUI=modern;ui.view.newUI=modern;Tab.options.visual.show(true);GameUI.update();await Vue.nextTick();},{modern,locale});
   const before=await page.evaluate(()=>GameSaveSerializer.serialize(player));await page.selectOption('#ade-language',locale);await page.waitForFunction(l=>document.documentElement.lang===l,locale);
   assert.equal(await page.evaluate(()=>GameSaveSerializer.serialize(player)),before,'language changes save');
   const tabs=await page.evaluate(()=>Object.values(Tab).filter(t=>t?.subtabs).flatMap(t=>t.subtabs.filter(s=>s.isUnlocked).map(s=>[t.key,s.key])));
   for(const [tab,sub] of tabs){
    const result=await page.evaluate(async({tab,sub})=>{Modal.hideAll();Quote.clearAll();Tab[tab][sub].show(true);GameUI.update();await Vue.nextTick();return {text:document.body.innerText,components:ui.$children.map(c=>c.$options.name)}},{tab,sub});
    if(process.env.ADE_TEST_REPORT)fs.writeFileSync(process.env.ADE_TEST_REPORT,JSON.stringify({reports,errors,current:{modern,locale,tab,sub,text:result.text}},null,2));
    assert.doesNotMatch(result.text,/\{p\d+\}|\[\[terms\.|\uE000|\uE001|\bundefined\b|\bNaN\b/u,`${modern}/${locale}/${tab}/${sub}`);
    reports.push({modern,locale,tab,sub,text:result.text});
   }
  }
  if(process.env.ADE_TEST_REPORT)fs.writeFileSync(process.env.ADE_TEST_REPORT,JSON.stringify({reports,errors},null,2));
  assert.deepEqual(errors,[]);console.log('PASS: real gameplay scenarios and '+reports.length+' UI renders, both layouts and repeated locale changes.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e.stack);process.exitCode=1});
