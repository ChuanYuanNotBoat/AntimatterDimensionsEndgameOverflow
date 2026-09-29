'use strict';
// Use the complete local app and a disposable browser profile. No save writes.
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

async function main() {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 960 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(process.env.AD_TEST_URL || 'http://127.0.0.1:8080/?realityTest=1');
    await page.waitForFunction(() => window.GameStorage && window.GameDatabase && window.gameLoop);
    const saveText = fs.readFileSync(path.join(__dirname, 'fixtures/local-overflow-save.txt'), 'utf8').trim();
    const result = await page.evaluate(async text => {
      GameIntervals.stop();
      GameIntervals.start = () => {};
      GameIntervals.restart = () => {};
      for (const interval of GameIntervals.all()) { interval.start = () => {}; interval.restart = () => {}; }
      for (const key of ['save', 'saveToBackup', 'backupOfflineSlots', 'tryOnlineBackups']) GameStorage[key] = () => {};
      GameStorage.offlineEnabled = false;
      const load = async () => {
        const root = GameSaveSerializer.deserialize(text);
        GameStorage.loadPlayerObject(root.saves ? root.saves[root.current] : root);
        GameIntervals.stop();
        Lazy.invalidateAll();
        await new Promise(resolve => setTimeout(resolve, 250));
      };
      const failures = [];
      const check = (ok, message) => { if (!ok) failures.push(message); };
      const finite = value => value == null || [value.sign, value.layer, value.mag].every(Number.isFinite);
      await load();
      const sources = {};
      for (const resource of ['AD', 'ID', 'TD', 'IP', 'EP', 'tickspeed', 'gamespeed', 'DT', 'TP',
        'infinities', 'eternities', 'replicanti']) {
        const tree = GameDatabase.multiplierTabTree;
        const values = GameDatabase.multiplierTabValues[resource];
        const groups = tree[`${resource}_total`];
        const keys = new Set([...(groups?.[0] ?? []), ...(['AD', 'ID', 'TD'].includes(resource)
          ? groups[2].flatMap(key => [key, ...tree[key][0]]) : [])]);
        sources[resource] = keys.size;
        for (const key of keys) {
          const [, prop] = key.split('_');
          const entry = values[prop];
          if (!entry?.transformValue || !(typeof entry.isActive === 'function' ? entry.isActive() : entry.isActive)) continue;
          for (const mode of ['all', 'multiplier', 'exponent']) {
            try {
              let t = entry.transformValue();
              if (t?.forMode) t = t.forMode(mode);
              if (!t) continue;
              if (/traceMismatch/u.test(key) && t.type === 'diagnostic') failures.push(key + ': gameplay mismatch');
              for (const field of ['before', 'after', 'value', 'finalWith', 'finalWithout']) {
                check(finite(t[field]), `${key}/${mode}/${field} nonfinite`);
              }
            } catch (error) { failures.push(`${key}/${mode}: ${error.message}`); }
          }
        }
        if (['AD', 'ID', 'TD'].includes(resource)) {
          const categories = groups[2].flatMap(key => tree[key][0]);
          check(categories.length === new Set(categories).size, `${resource}: duplicate category source`);
          check(groups[0].every(key => groups[2].includes(key)), `${resource}: missing category source`);
          check(!groups[0].some(key => /commonEffects|tierEffects|preDilationPowers|postDilationPowers/u.test(key)),
            `${resource}: coarse formula grouping`);
        }
      }
      // A neutral equipped-glyph default is not an active source.
      const glyphDefaults = [];
      player.reality.glyphs.active = [];
      Glyphs.refreshActive();
      Lazy.invalidateAll();
      await new Promise(resolve => setTimeout(resolve, 250));
      const galaxySources = [];
      for (const [key, entry] of Object.entries(GameDatabase.multiplierTabValues.galaxies)) {
        if (!entry.transformValue) continue;
        const transform = entry.transformValue();
        if (transform?.alwaysShow) galaxySources.push(key);
      }
      check(galaxySources.length >= 3, 'Small galaxy sources are missing from the fixture breakdown');
      for (const resource of ['AD', 'ID', 'TD']) {
        for (const key of GameDatabase.multiplierTabTree[`${resource}_total`][2].flatMap(k => GameDatabase.multiplierTabTree[k][0])) {
          if (!/glyphPower|glyphInfinityPower|glyphTimePower|effarigGlyphPower|glyphEffarigPower|cursedGlyphPower/u.test(key)) continue;
          const t = GameDatabase.multiplierTabValues[resource][key.split('_')[1]].transformValue();
          if (t?.value) { glyphDefaults.push(key); check(Decimal.eq(t.value, 1), `${key}: unequipped glyph effect`); }
        }
      }
      Tab.statistics.multipliers.show();
      GameUI.update();
      await new Promise(resolve => setTimeout(resolve, 250));
      const tab = document.querySelector('.l-multiplier-category-btn-container')?.parentElement.__vue__;
      check(!!tab, 'Analysis component did not mount');
      const layouts = [];
      if (tab) {
        for (const resource of ['AD', 'ID', 'TD', 'IP', 'EP', 'tickspeed', 'gamespeed', 'DT', 'TP',
          'infinities', 'eternities', 'replicanti']) {
          const option = tab.availableGroups.flatMap(g => g.options).find(o => o.key === resource);
          if (!option) continue;
          tab.selectTab(option);
          for (const mode of ['all', 'multiplier', 'exponent']) {
            tab.selectValueMode(mode);
            GameUI.update();
            await new Promise(resolve => setTimeout(resolve, 100));
            const panel = document.querySelector('.c-multiplier-entry-root-container')?.__vue__;
            if (!panel) { failures.push(resource + '/' + mode + ': missing panel'); continue; }
            panel.update(true);
            check(panel.canShowFinalImpact, resource + '/' + mode + ': algorithm toggle missing');
            if (resource === 'tickspeed' && mode === 'multiplier') {
              check(panel.entries.some(e => /galaxies$/u.test(e.key) && panel.shouldShowEntry(e)),
                'tickspeed/multiplier: galaxy source missing');
            }
            for (const final of [false, true]) {
              panel.orderedFinalImpact = final;
              panel.update(true);
              check([...panel.orderedPathPercentList, ...panel.orderedPathNerfPercentList,
                ...panel.percentList].every(Number.isFinite), resource + '/' + mode + ': invalid bar');
              check(!panel.$el.innerText.includes('NaN'), resource + '/' + mode + ': NaN text');
              check(panel.entries.filter(e => panel.shouldShowEntry(e)).every(e =>
                !/glyph/i.test(e.key) || e.data.isVisible), resource + '/' + mode + ': neutral glyph');
            }
            layouts.push(resource + '/' + mode);
          }
          if (['AD', 'ID', 'TD'].includes(resource)) {
            tab.selectDimension(1);
            for (const mode of ['all', 'multiplier', 'exponent']) {
              tab.selectValueMode(mode); GameUI.update();
              await new Promise(resolve => setTimeout(resolve, 100));
              const panel = document.querySelector('.c-multiplier-entry-root-container')?.__vue__;
              check(panel?.canShowFinalImpact, resource + '1/' + mode + ': algorithm toggle missing');
              panel.orderedFinalImpact = true; panel.update(true);
              check([...panel.percentList, ...panel.orderedPathPercentList].every(Number.isFinite),
                resource + '1/' + mode + ': invalid bar');
              layouts.push(resource + '1/' + mode);
            }
            tab.selectDimension(0);
          }
        }
        const ad = tab.availableGroups.flatMap(g => g.options).find(o => o.key === 'AD');
        tab.selectTab(ad); tab.selectValueMode('all'); GameUI.update();
        await new Promise(resolve => setTimeout(resolve, 150));
      }
      const celestials = {};
      for (const name of ['Teresa', 'Effarig', 'V', 'Laitela']) {
        await load();
        window[name].initializeRun();
        Lazy.invalidateAll();
        const before = gainedInfinityPoints();
        const ep = gainedEternityPoints();
        const speed = getGameSpeedupFactor();
        check(finite(before) && finite(ep) && finite(speed), `${name}: nonfinite entry state`);
        check(before.lt(DC.BEMAX) && ep.lt(DC.BEMAX) && speed.lt(DC.BEMAX), `${name}: erroneous max at entry`);
        for (let tick = 0; tick < 10; tick++) gameLoop(50);
        check(Currency.antimatter.value.lt(DC.BEMAX) && Currency.infinityPoints.value.lt(DC.BEMAX) &&
          Currency.eternityPoints.value.lt(DC.BEMAX), `${name}: erroneous max after ticks`);
        celestials[name] = { finite: finite(before) && finite(ep) && finite(speed), belowMax: before.lt(DC.BEMAX) };
      }
      await load();
      Modal.hideAll();
      Tab.statistics.multipliers.show(); GameUI.update();
      await new Promise(resolve => setTimeout(resolve, 250));
      const reviewTab = document.querySelector('.l-multiplier-category-btn-container')?.parentElement.__vue__;
      if (reviewTab) {
        reviewTab.selectTab(reviewTab.availableGroups.flatMap(g => g.options).find(o => o.key === 'AD'));
        reviewTab.selectValueMode('all'); GameUI.update();
        await new Promise(resolve => setTimeout(resolve, 150));
      }
      return { sources, layouts, galaxySources, glyphDefaults: glyphDefaults.length, celestials, failures };
    }, saveText);
    result.failures.push(...errors);
    console.log(JSON.stringify(result, null, 2));
    await page.evaluate(() => { Modal.hideAll(); Tab.statistics.multipliers.show(); GameUI.update(); });
    await page.waitForSelector('.c-multiplier-entry-root-container');
    await page.locator('.c-stats-tab').first()
      .screenshot({ path: path.join(__dirname, 'fixtures/analysis-review.png') });
    if (result.failures.length) process.exitCode = 1;
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
