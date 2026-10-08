const fs = require('node:fs');
const assert = require('node:assert/strict');
const {chromium} = require('playwright');
const fixture = fs.readFileSync('tests/fixtures/local-overflow-save.txt','utf8').trim();
const url = process.env.ADE_TEST_URL || 'http://127.0.0.1:8080/?realityTest=1';
async function initialize(page) {
  await page.goto(url,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.GameStorage&&window.GameUI);
  await page.evaluate(text=>{
    GameIntervals.stop();
    for(const i of GameIntervals.all()) {i.start=()=>{};i.restart=()=>{};}
    GameIntervals.start=()=>{};GameIntervals.restart=()=>{};
    for(const name of ['save','saveToBackup','backupOfflineSlots','tryOnlineBackups']) GameStorage[name]=()=>{};
    GameStorage.offlineEnabled=false;
    const root=GameSaveSerializer.deserialize(text);const save=root.saves?root.saves[root.current]:root;
    save.lastUpdate=Date.now();GameStorage.loadPlayerObject(save);GameIntervals.stop();Modal.hideAll();
    clearCelestialRuns();GameEnd.creditsEverClosed=false;
    Object.assign(player.celestials.slabdrill,{isCursed:false,isDestroyed:false,stage:0,goodbyeTick:31000});
    player.celestials.slabdrill.core.isActive=false;player.disablePostReality=false;
    player.options.newUI=true;ui.view.newUI=true;player.options.showAllChallenges=true;
    for(const c of Object.values(GameCache)) c.invalidate?.();
    GameUI.update();
  },fixture);
}
(async()=>{
  const browser=await chromium.launch({channel:'msedge',headless:true});
  try {
    for(const locale of ['zh-CN','en']) {
      const context=await browser.newContext({serviceWorkers:'block',viewport:{width:1280,height:900}});
      await context.addInitScript(l=>localStorage.setItem('ade.language',l),locale);
      await context.route('https://www.googletagmanager.com/**',r=>r.abort());
      const page=await context.newPage();const errors=[];
      page.on('pageerror',e=>errors.push(e.message));
      page.on('console',m=>{if(/\[i18n\] (?:format|missing):|Error in render|builder failed/u.test(m.text())) errors.push(m.text());});
      await initialize(page);
      for(const cursed of [false,true]) for(const key of ['normal','infinity','eternity']) {
        await page.evaluate(({cursed,key})=>{
          player.celestials.slabdrill.isCursed=cursed;player.disablePostReality=cursed;
          Tab.challenges[key].show(true);GameUI.update();
        },{cursed,key});
        await page.waitForTimeout(180);
        const text=await page.locator('.l-challenges-tab').innerText();
        assert.doesNotMatch(text,/Message unavailable|undefined|NaN/u);
        if(locale==='zh-CN') assert.doesNotMatch(text,/Reward:|Goal:|Completed \d|Locked|Dimensions|Tickspeed|Infinities|gain an immense|you cannot/u);
      }
      await page.evaluate(()=>{player.celestials.slabdrill.isCursed=false;player.disablePostReality=false;Modal.breakInfinity.show();GameUI.update();});
      await page.waitForTimeout(100);
      const modal=await page.locator('.c-modal-message__text').innerText();
      assert.doesNotMatch(modal,/Message unavailable/u);
      if(locale==='zh-CN') assert.doesNotMatch(modal,/Breaking|Dimensions|gain|antimatter/u);
      await page.evaluate(()=>{Modal.hideAll();Tab.reality.glyphs.show(true);GameUI.update();});
      await page.waitForTimeout(180);
      const glyphResults=await page.evaluate(async()=>{
        const all=()=>[...document.querySelectorAll('*')].map(el=>el.__vue__).filter(Boolean);
        const component=all().find(v=>v.$options.name==='GlyphComponent');
        if(!component) throw new Error('Glyph fixture has no glyph components');
        const Vue=component.$root.constructor;
        const Tooltip=Vue.extend(component.$options.components.GlyphTooltip);
        const Effect=Vue.extend(component.$options.components.GlyphTooltip.components.GlyphTooltipEffect);
        const results=[];
        for(const type of GLYPH_TYPES) for(const strength of [1,3.5,8.5]) {
          const tip=new Tooltip({parent:component,propsData:{type,strength,level:new Decimal(1000),effects:0,
            currentAction:'refine',scoreMode:0,changeWatcher:0,uncappedRefineReward:100,refineReward:1}});
          tip.$mount();await tip.$nextTick();
          results.push({id:`name:${type}:${strength}`,text:tip.$el.innerText});tip.$destroy();
        }
        const originalAdded=GlyphAlteration.isAdded;
        try {
          for(const added of [false,true]) {
            GlyphAlteration.isAdded=()=>added;
            for(const config of GlyphEffects.all) {
              const value=config.effect(new Decimal(1000),3.5);
              const effect=new Effect({parent:component,propsData:{effect:config.id,value}});
              effect.$mount();document.body.appendChild(effect.$el);await effect.$nextTick();
              results.push({id:`${config.id}:${added}`,text:effect.$el.innerText,raw:config.singleDesc,
                template:effect.effectStringTemplate,locale:effect.$locale,
                values:effect.$el.querySelectorAll('span[style]').length});
              effect.$destroy();effect.$el.remove();
            }
          }
        } finally {GlyphAlteration.isAdded=originalAdded;}
        return results;
      });
      fs.writeFileSync(`.tmp/glyph-review-${locale}.json`,JSON.stringify(glyphResults,null,2));
      for(const item of glyphResults) {
        assert.doesNotMatch(item.text,/Message unavailable|\{value\d*\}|undefined/u,item.id);
        if(locale==='zh-CN') assert.doesNotMatch(item.text,/Glyph of|Refine:|Actual value|multiplier|Multiply|Dimension|Replicanti factor|Power conversion|Dilated Time factor/u,item.id);
      }
      await page.evaluate(()=>{
        player.celestials.slabdrill.isCursed=true;player.celestials.slabdrill.core.isActive=true;
        player.celestials.slabdrill.core.chaosCores=3;player.celestials.slabdrill.stage=4;
        player.disablePostReality=true;Currency.antimatter.value=new Decimal('1e100');
        Tab.statistics.multipliers.show(true);GameUI.update();
      });
      await page.waitForSelector('.c-hunt-factors-container');
      const label=page.locator('.c-hunt-factors-container .l-expanding-control-box__button');
      await label.click();await page.waitForTimeout(650);
      const hunt=page.locator('.c-hunt-factors');
      const bounds=await hunt.boundingBox();assert.ok(bounds.width>300&&bounds.height>150,'hunt breakdown must have readable width and height');
      const chance=await page.evaluate(()=>{
        const state=JSON.stringify(player);const random=Math.random;Math.random=()=>{throw Error('hunt display used RNG');};
        try {
          const f=Slabdrill.huntChanceFactors;
          const original=Decimal.pow10(-Slabdrill.cores).times(Decimal.pow10(Slabdrill.currentStage)).times(
            player.antimatter.max(10).log10().log10().pow(3).add(1)).div(10000).times(
            SlabdrillUnlocks.dilation.isUnlocked?16:1).times(
            SlabdrillUnlocks.reality.isUnlocked?Slabdrill.slabPowers.chaosCores().times(66):1).clamp(0,1);
          return {same:f.final.eq(original)&&Slabdrill.huntChance===original.toNumber(),readOnly:state===JSON.stringify(player)};
        } finally {Math.random=random;}
      });
      assert.ok(chance.same&&chance.readOnly);
      await page.screenshot({path:`.tmp/hunt-factors-${locale}.png`,fullPage:true});
      await page.setViewportSize({width:640,height:900});await page.waitForTimeout(150);
      assert.ok((await hunt.boundingBox()).width>250,'hunt factors must remain readable in a narrow viewport');
      await label.click();await page.waitForTimeout(650);assert.ok((await hunt.boundingBox()).height<70,'hunt factors must collapse');
      await page.evaluate(()=>{player.celestials.slabdrill.core.isActive=false;player.celestials.slabdrill.isCursed=false;player.disablePostReality=false;GameUI.update();});
      await page.waitForTimeout(180);assert.equal(await page.locator('.c-hunt-factors-container').count(),0);
      for(const stage of [0,4,8]) {
        await page.evaluate(stage=>{
          player.celestials.slabdrill.isCursed=stage>0;player.celestials.slabdrill.stage=stage;
          player.disablePostReality=stage>0;player.break=true;
          Currency.antimatter.value=new Decimal('1e10000');player.records.thisInfinity.maxAM=new Decimal('1e10000');
          for(const cache of Object.values(GameCache)) cache.invalidate?.();
          for(const effect of GlyphEffects.all) {
            try { getAdjustedGlyphEffectUncached(effect.id); }
            catch(error) { throw Error(`Invalid live glyph effect ${effect.id}: ${error.message}`); }
          }
        },stage);
        await page.waitForTimeout(180);
        const mismatch=await page.evaluate(()=>{
          if(!Player.canCrunch) throw Error('IP comparison fixture must reach Infinity');
          const step=GameDatabase.multiplierTabValues.IP.traceMismatch.transformValue();
          return step ? {before:String(step.before),after:String(step.after)} : null;
        });
        assert.equal(mismatch,null,`IP replay must follow gameplay's multiplier and rounding order in stage ${stage}`);
      }
      await page.evaluate(()=>{player.celestials.slabdrill.isCursed=false;player.disablePostReality=false;});
      await page.evaluate(()=>{
        player.reality.glyphs.active=[];Glyphs.refreshActive();
        for(const cache of Object.values(GameCache)) cache.invalidate?.();
        const tab=document.querySelector('.c-stats-tab').__vue__;
        tab.selectTab(tab.availableGroups.flatMap(g=>g.options).find(o=>o.key==='AD'));GameUI.update();
      });
      for(let tick=0;tick<5;tick++) {await page.waitForTimeout(180);await page.evaluate(()=>GameUI.update());}
      const neutralGlyph=await page.evaluate(()=>{
        const panel=document.querySelector('.c-multiplier-entry-root-container').__vue__;
        const entry=panel.entries.find(e=>e.key==='AD_sourceglyph');
        return entry ? panel.shouldShowEntry(entry) : false;
      });
      assert.equal(neutralGlyph,false,'unequipped Glyphs must not leave a flickering x1 category');
      const slotSwitch=await page.evaluate(async()=>{
        const findHeader=()=>[...document.querySelectorAll('*')].map(el=>el.__vue__)
          .find(v=>v?.$options.name==='EternityButton');
        player.celestials.pelle.doomed=false;player.reality.dualityUpgradeBits|=1<<25;
        Currency.eternityPoints.value=Penteracts.nextCost;
        player.dilation.active=false;
        GameUI.update();await findHeader().$nextTick();
        if(!findHeader().penteractAffordable) throw Error('advanced fixture must offer a Penteract');
        const clone=value=>GameSaveSerializer.deserialize(GameSaveSerializer.serialize(value));
        const advanced=clone(player);const early=clone(Player.defaultStart);
        early.options.newUI=true;early.lastUpdate=Date.now();
        GameStorage.saves={0:advanced,1:early};GameStorage.currentSlot=0;
        const checks=[];
        for(const slot of [1,0,1]) {
          GameStorage.loadSlot(slot);GameIntervals.stop();GameUI.update();
          await new Promise(resolve=>setTimeout(resolve,100));
          checks.push({slot,affordable:findHeader()?.penteractAffordable??false,
            buttons:document.querySelectorAll('.c-game-header__penteract-available').length});
        }
        return checks;
      });
      assert.deepEqual(slotSwitch.map(item=>item.affordable),[false,true,false]);
      assert.deepEqual(slotSwitch.map(item=>item.buttons),[0,1,0]);
      assert.deepEqual(errors,[]);
      console.log(JSON.stringify({locale,challengeViews:6,glyphCases:glyphResults.length,huntChance:'matches gameplay',huntLayout:'passed',slotSwitch:'passed',errors}));
      await context.close();
    }
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
