'use strict';
// Run against a local development server. Every scenario uses a disposable
// browser context and disables saves/backups. An optional damaged-save path is
// read locally; the save is never printed, committed, or sent to a remote server.
const fs = require('node:fs');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { chromium } = require('playwright');
const fixture = fs.readFileSync('tests/fixtures/local-overflow-save.txt', 'utf8').trim();
const baseline = execFileSync('git', ['show', '85e3ea44c:src/core/machines.js'], { encoding: 'utf8' });
const legacyDimensions = Object.fromEntries(['celestial', 'divine'].map(type => [type,
  execFileSync('git', ['show', `85e3ea44c:src/core/dimensions/${type}-dimension.js`], { encoding: 'utf8' })]));
const finiteSource = fs.readFileSync('src/core/finite-decimal.js', 'utf8').replace(/^export /gm, '');
const url = process.env.ADE_TEST_URL || 'http://127.0.0.1:8080/?realityTest=1';

async function initialize(page, save) {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.GameStorage && window.Tab && window.GameUI);
  await page.evaluate(text => {
    GameIntervals.stop();
    for (const interval of GameIntervals.all()) { interval.start = () => {}; interval.restart = () => {}; }
    GameIntervals.start = () => {};
    GameIntervals.restart = () => {};
    for (const method of ['save', 'saveToBackup', 'backupOfflineSlots', 'tryOnlineBackups']) GameStorage[method] = () => {};
    GameStorage.offlineEnabled = false;
    GameStorage.ignoreBackupTimer = true;
    if (text) {
      const root = GameSaveSerializer.deserialize(text);
      const save = root.saves ? root.saves[root.current] : root;
      save.lastUpdate = Date.now();
      GameStorage.loadPlayerObject(save);
    }
    GameIntervals.stop();
    Modal.hideAll();
  }, save);
}

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    for (const locale of ['zh-CN', 'en']) {
      const context = await browser.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 900 } });
      await context.addInitScript(language => localStorage.setItem('ade.language', language), locale);
      await context.route('https://www.googletagmanager.com/**', route => route.abort());
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('console', message => {
        if (/builder failed|\[i18n\] missing:.*analysis\.expansion|Error in render|ReferenceError/u.test(message.text())) {
          errors.push(message.text());
        }
      });
      await initialize(page);
      const locked = await page.evaluate(() => Object.fromEntries(['CD','DD','machines','realities','endgames']
        .map(key => [key, GameDatabase.multiplierTabValues[key].total.isActive()])));
      assert.ok(Object.values(locked).every(value => value === false), 'new pages hidden in a fresh save');
      await initialize(page, fixture);
      const preparation = await page.evaluate(() => {
        clearCelestialRuns();
        GameEnd.creditsEverClosed = false;
        Object.assign(player.celestials.slabdrill, { isCursed: false, isDestroyed: false, isWarping: false,
          isGoodbye: false, hasBoughtNinthDimension: false });
        player.celestials.slabdrill.core.isActive = false;
        player.disablePostReality = false;
        player.endgames = Math.max(player.endgames, 1);
        Currency.divinities.value = new Decimal(100);
        Currency.imaginaryMachines.value = MachineHandler.hardcapIM;
        player.options.newUI = true;
        ui.view.newUI = true;
        for (const dimension of CelestialDimensions.all.slice(0, 8)) {
          dimension.isUnlocked = true; dimension.amount = new Decimal(10); dimension.baseAmount = new Decimal(3);
        }
        for (const dimension of DivineDimensions.all.slice(0, 8)) {
          dimension.amount = new Decimal(10); dimension.baseAmount = new Decimal(3);
        }
        for (const cache of Object.values(GameCache)) cache.invalidate?.();
        return { divine: DivinityMilestone.divineDimensions.isReached, dual: MachineHandler.isDMUnlocked };
      });
      assert.ok(preparation.divine && preparation.dual);
      const formulas = await page.evaluate(({ baseline, legacyDimensions, finiteSource }) => {
        const { boundedPositivePower, boundedPositiveProduct, boundedPositiveSum } = new Function('Decimal', 'DC',
          finiteSource + '\nreturn { boundedPositivePower, boundedPositiveProduct, boundedPositiveSum };')(Decimal, DC);
        const oldMachines = new Function('boundedPositivePower', 'boundedPositiveProduct', 'boundedPositiveSum',
          baseline.replace(/^import[^;]+;\s*/gm, '').replace(/^export /gm, '') + '\nreturn MachineHandler;')
          (boundedPositivePower, boundedPositiveProduct, boundedPositiveSum);
        const methodBody = (source, name) => {
          const start = source.indexOf(`get ${name}() {`) + `get ${name}() {`.length;
          let depth = 1; let end = start;
          while (depth && end < source.length) {
            if (source[end] === '{') depth++;
            if (source[end] === '}') depth--;
            end++;
          }
          return source.slice(start, end - 1);
        };
        const oldDD = new Function('boundedPositivePower', 'boundedPositiveProduct',
          `return function() {${methodBody(legacyDimensions.divine, 'multiplier')}};`)
          (boundedPositivePower, boundedPositiveProduct);
        const cdHelpers = legacyDimensions.celestial.slice(legacyDimensions.celestial.indexOf('// CD multipliers'),
          legacyDimensions.celestial.indexOf('export function toggleCelestialMatter')).replace(/^export /gm, '');
        const oldCD = new Function('boundedPositivePower', 'boundedPositiveProduct',
          cdHelpers + `\nreturn function() {${methodBody(legacyDimensions.celestial, 'multiplier')}};`)
          (boundedPositivePower, boundedPositiveProduct);
        const finite = value => [value.sign, value.layer, value.mag].every(Number.isFinite);
        const results = [];
        for (const disabled of [false, true]) for (const cursed of [false, true]) {
          player.disablePostReality = disabled;
          player.celestials.slabdrill.isCursed = cursed;
          player.celestials.slabdrill.stage = cursed ? 6 : 0;
          player.celestials.slabdrill.serpentinePower = new Decimal(10);
          for (const cache of Object.values(GameCache)) cache.invalidate?.();
          for (const key of ['uncappedRM','uncappedIM','uncappedDM','currentIMCap','projectedIMCap','currentDMCap','projectedDMCap']) {
            const expected = oldMachines[key]; const actual = MachineHandler[key];
            if (!finite(actual)) throw new Error(`${key} became non-finite`);
            if (finite(expected) && !actual.eq_tolerance(expected, 1e-10)) throw new Error(`${key} differs from gameplay baseline`);
          }
          for (let tier = 1; tier <= 8; tier++) {
            for (const [resource, dimension, legacy, evaluator] of [
              ['CD', CelestialDimension(tier), oldCD, celestialDimensionMultiplier],
              ['DD', DivineDimension(tier), oldDD, divineDimensionMultiplier]]) {
              const expected = legacy.call(dimension); const actual = dimension.multiplier;
              if (!actual.eq_tolerance(expected, 1e-10)) throw new Error(`${resource}${tier} differs from gameplay baseline`);
              const observed = evaluator(tier, { steps: {}, skip: new Set() });
              if (!observed.eq_tolerance(actual, 1e-10)) throw new Error(`${resource}${tier} observer differs`);
            }
          }
          results.push({ disabled, cursed, pass: true });
        }
        player.disablePostReality = false;
        player.celestials.slabdrill.isCursed = false;
        for (const cache of Object.values(GameCache)) cache.invalidate?.();
        return results;
      }, { baseline, legacyDimensions, finiteSource });
      assert.equal(formulas.length, 4);
      const rmBefore = await page.evaluate(() => String(Currency.realityMachines.value));
      await page.evaluate(() => { Currency.realityMachines.value = MachineHandler.hardcapRM.div(2); });
      await page.waitForTimeout(160);
      const roomLimit = await page.evaluate(() => {
        const before = Currency.realityMachines.value;
        const gain = MachineHandler.gainedRealityMachines.times(simulatedRealityCount(false).add(1));
        const expected = Decimal.min(before.add(gain), MachineHandler.hardcapRM).sub(before).max(0);
        return GameDatabase.multiplierTabValues.RM.total.multValue().eq_tolerance(expected, 1e-10);
      });
      assert.ok(roomLimit, 'RM headline must respect the remaining capacity');
      await page.evaluate(value => { Currency.realityMachines.value = new Decimal(value); }, rmBefore);
      await page.waitForTimeout(160);
      for (const id of [12,13,14,15,16]) {
        await page.evaluate(id => {
          const component = document.querySelector('.c-stats-tab')?.__vue__;
          if (component) component.selectTab(component.availableGroups.flatMap(group => group.options).find(option => option.id === id));
          else player.options.multiplierTab.currTab = id;
          Tab.statistics.multipliers.show(true);
          GameUI.update();
        }, id);
        await page.waitForSelector('.c-stats-tab');
        await page.waitForFunction(id => document.querySelector('.c-stats-tab').__vue__.currentID === id, id);
        if (id === 14) {
          for (const type of ['RM','IM','DM']) {
            const name = await page.evaluate(type => document.querySelector('.c-stats-tab').__vue__
              .machineOptions.find(option => option.key === type).name, type);
            await page.getByRole('button', { name, exact: true }).click();
            await page.waitForTimeout(250);
            const text = await page.locator('.c-stats-tab').innerText();
            assert.doesNotMatch(text, /Message unavailable|NaN|undefined/u);
            if (type !== 'RM') {
              assert.match(text, locale === 'zh-CN' ? /当前.*有效容量/u : /Current effective.*cap/u);
              assert.match(text, locale === 'zh-CN' ? /预计容量/u : /Projected.*cap/u);
              assert.equal(await page.locator('.c-multiplier-entry-root-container').count(), 2);
            }
          }
        }
        for (const mode of ['multiplier','exponent','all']) {
          await page.evaluate(mode => { document.querySelector('.c-stats-tab').__vue__.selectValueMode(mode); GameUI.update(); }, mode);
          await page.waitForTimeout(180);
          assert.doesNotMatch(await page.locator('.c-stats-tab').innerText(), /Message unavailable|NaN|undefined/u);
        }
        if (id === 12 || id === 13) {
          await page.locator('.c-dimension-inline-select').selectOption('1');
          await page.waitForTimeout(180);
          assert.equal(await page.evaluate(() => player.options.multiplierTab.currTab), id);
        }
        const toggles = page.getByRole('button', { name: locale === 'zh-CN' ? '直接' : 'Direct', exact: true });
        const count = await toggles.count();
        for (let index = 0; index < count; index++) await toggles.first().click();
        const children = page.locator('.c-multiplier-entry-root-container .c-inline-expander--children').first();
        if (await children.count()) await children.click();
        const detail = page.locator('.c-multiplier-entry-root-container .c-inline-expander--details').first();
        if (await detail.count()) await detail.click();
        await page.waitForTimeout(250);
        assert.doesNotMatch(await page.locator('.c-stats-tab').innerText(), /Message unavailable|NaN|undefined/u);
        if (locale === 'zh-CN') await page.screenshot({ path: `.tmp/analysis-${id}-zh.png`, fullPage: true });
      }
      const readOnly = await page.evaluate(() => {
        const before = JSON.stringify(player);
        const originalRandom = Math.random;
        Math.random = () => { throw new Error('analysis consumed RNG'); };
        try {
          for (const key of ['realities','endgames','RM','IM','DM']) {
            const data = GameDatabase.multiplierTabValues[key];
            data.total.multValue();
            for (const [name, entry] of Object.entries(data)) if (name !== 'total') {
              const transform = entry.transformValue?.();
              if (transform?.finalWithout !== undefined) void transform.finalWithout;
            }
          }
        } finally { Math.random = originalRandom; }
        return before === JSON.stringify(player);
      });
      assert.ok(readOnly, 'analysis must not change player state or consume RNG');
      const purchases = await page.evaluate(() => {
        clearCelestialRuns();
        GameEnd.creditsEverClosed = false;
        Object.assign(player.celestials.slabdrill, { isCursed: true, isDestroyed: false, stage: 6, goodbyeTick: 31000 });
        player.celestials.slabdrill.core.isActive = false;
        player.disablePostReality = true;
        player.challenge.normal.current = 4;
        player.challenge.infinity.current = 0;
        player.auto.disableContinuum = false;
        const wasActive = Laitela.continuumActive;
        Laitela.setContinuum(false);
        const results = [];
        for (const [method, action] of [['one', () => buyOneDimension(1)], ['ten', () => buyManyDimension(1)],
          ['bulk', () => buyMaxDimension(1, 1)], ['autobuyer', () => Autobuyer.antimatterDimension(1).tick()]]) {
          const dimension = AntimatterDimension(1);
          dimension.bought = DC.D0; dimension.amount = new Decimal(10);
          Currency.antimatter.value = new Decimal('1e90');
          for (const cache of Object.values(GameCache)) cache.invalidate?.();
          action();
          if (!dimension.bought.gt(0)) throw new Error(`${method} did not buy a dimension`);
          if (!Currency.antimatter.value.eq(Currency.antimatter.startingValue)) {
            throw new Error(`${method} did not apply the cursed C4 reset`);
          }
          results.push(method);
        }
        return { wasActive, disabled: !Laitela.continuumActive, methods: results };
      });
      assert.ok(purchases.wasActive && purchases.disabled);
      assert.equal(purchases.methods.length, 4);
      assert.deepEqual(errors, []);
      console.log(JSON.stringify({ locale, baselineFormulaCases: formulas.length, analysisPages: 5,
        internalMachines: 3, unlocks: 'passed', readOnly, cursedC4Purchases: purchases.methods, errors }));
      await context.close();
    }
    if (process.env.ADE_BAD_SAVE_PATH) {
      const context = await browser.newContext({ serviceWorkers: 'block' });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await initialize(page, fs.readFileSync(process.env.ADE_BAD_SAVE_PATH, 'utf8').trim());
      const result = await page.evaluate(() => {
        const before = [player.celestials.slabdrill.stage, player.celestials.slabdrill.hasBoughtNinthDimension];
        const finite = value => [value.sign, value.layer, value.mag].every(Number.isFinite);
        if (player.disablePostReality || player.celestials.slabdrill.isCursed || player.celestials.slabdrill.isWarping) {
          throw new Error('damaged exit flags survived loading');
        }
        GameEnd.creditsEverClosed = false;
        for (let tick = 0; tick < 8; tick++) gameLoop(50);
        return { progress: before, speed: finite(Tickspeed.perSecond), alphaSpeed: finite(Alpha.totalSpeedBoost) };
      });
      assert.deepEqual(result.progress, [11, true]);
      assert.ok(result.speed && result.alphaSpeed);
      assert.deepEqual(errors, []);
      console.log(JSON.stringify({ damagedSave: 'passed', ticks: 8, errors }));
      await context.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
