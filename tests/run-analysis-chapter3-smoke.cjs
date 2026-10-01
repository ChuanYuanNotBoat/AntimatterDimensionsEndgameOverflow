// Full-app checks in a disposable browser context; never uses the player's browser profile.
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

async function main() {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.stack));
    await page.goto(process.env.AD_TEST_URL || 'http://127.0.0.1:8080/?realityTest=1');
    await page.waitForFunction(() => window.GameStorage && window.GameDatabase && window.gameLoop);
    const save = fs.readFileSync(path.join(__dirname, 'fixtures/local-overflow-save.txt'), 'utf8').trim();
    const result = await page.evaluate(async text => {
      GameIntervals.stop();
      GameIntervals.start = () => {};
      GameIntervals.restart = () => {};
      for (const interval of GameIntervals.all()) {
        interval.start = () => {};
        interval.restart = () => {};
      }
      for (const key of ['save', 'saveToBackup', 'backupOfflineSlots', 'tryOnlineBackups']) GameStorage[key] = () => {};
      GameStorage.offlineEnabled = false;
      const failures = [];
      const scenarios = [];
      const check = (ok, label) => { if (!ok) failures.push(label); };
      const finite = value => value == null || [value.sign, value.layer, value.mag].every(Number.isFinite);
      const load = async () => {
        const root = GameSaveSerializer.deserialize(text);
        GameStorage.loadPlayerObject(root.saves ? root.saves[root.current] : root);
        GameIntervals.stop();
        Lazy.invalidateAll();
        await new Promise(resolve => setTimeout(resolve, 350));
      };
      const curse = () => {
        player.celestials.slabdrill.isCursed = true;
        player.celestials.slabdrill.stage = 10;
        player.celestials.slabdrill.serpentinePower = new Decimal(100);
        player.celestials.slabdrill.goodbyeTick = 360000;
        player.disablePostReality = true;
        AntimatterDimension(9).amount = new Decimal(10);
        AntimatterDimension(9).bought = new Decimal(10);
      };
      const seed = () => {
        player.antimatter = new Decimal('1e10000');
        for (let tier = 1; tier <= 8; tier++) {
          AntimatterDimension(tier).amount = new Decimal(100);
          AntimatterDimension(tier).bought = new Decimal(100);
          InfinityDimension(tier).amount = new Decimal(100);
          InfinityDimension(tier).baseAmount = new Decimal(100);
          TimeDimension(tier).amount = new Decimal(100);
          TimeDimension(tier).bought = new Decimal(100);
        }
      };
      for (const [name, configure, speed] of [
        ['Compression', () => { player.compression.active = true; }, 0.001],
        ['Transient', () => { player.universes.current = 1; }, 0.001],
        ['Tangible', () => { player.universes.current = 2; }, 0.001],
        ['Slabdrill stages', curse, null],
        ['Slabdrill Dilation', () => { curse(); player.dilation.active = true; }, null],
        ['Slabdrill core', () => { curse(); player.celestials.slabdrill.core.isActive = true; }, 1],
        ['Ephemeral Light', () => { player.disablePostReality = false;
          player.universes.ephemeralLight = new Decimal(2); }, null],
        ['Charged challenges and Eternity Upgrades', () => {
          player.disablePostReality = false;
          player.celestials.ra.pets.teresa.level = 10;
          player.eternityPoints = new Decimal('1e500');
          player.eternities = new Decimal('1e10');
          player.timestudy.theorem = new Decimal('1e8');
          for (let id = 1; id <= 6; id++) {
            player.eternityUpgrades.add(id);
            player.endgame.overcharge.charged.eternal.add(id);
          }
          player.endgame.overcharge.allowComplex = true;
          for (const id of [1, 2, 3, 12]) player.endgame.overcharge.charged.complex.add(id);
          player.records.thisEndgame.realTime = 7200000;
        }, null],
        ['Slabdrill EP softcaps', () => {
          curse();
          player.records.thisEternity.maxIP = new Decimal('1e10000000');
        }, null],
      ]) {
        await load();
        seed();
        configure();
        Lazy.invalidateAll();
        await new Promise(resolve => setTimeout(resolve, 350));
        if (speed !== null) check(getGameSpeedupFactor().eq(speed), `${name}: speed`);
        if (name === 'Tangible') {
          check(InfinityDimension(1).productionPerSecond.eq(0), 'Tangible: ID production');
          check(TimeDimension(1).productionPerSecond.eq(0), 'Tangible: TD production');
        }
        if (name === 'Transient') check(TimeDimension(1).productionPerSecond.eq(0), 'Transient: TD production');
        if (name === 'Slabdrill EP softcaps') {
          for (const threshold of [2000, 2500, 3000]) {
            const transform = GameDatabase.multiplierTabValues.EP[`slabSoftcap${threshold}`].transformValue();
            check(transform.after.lt(transform.before), `${name}: active softcap ${threshold}`);
          }
        }
        if (name === 'Ephemeral Light') {
          for (const resource of ['DT', 'gamespeed']) {
            const transform = GameDatabase.multiplierTabValues[resource].ephemeralLight.transformValue();
            check(transform.value.eq(Universes.ephemeralLightToDilation), `${resource}: raw Ephemeral Light power`);
          }
        }
        if (name.startsWith('Charged')) {
          for (const resource of ['AD', 'ID', 'TD']) {
            const transform = GameDatabase.multiplierTabValues[resource].chargedNC2.transformValue(1);
            check(transform.value.gt(1), `${resource}: active NC2 charge`);
          }
        }
        const tree = GameDatabase.multiplierTabTree;
        let checked = 0;
        for (const resource of ['AD', 'ID', 'TD', 'IP', 'EP', 'DT', 'infinities', 'gamespeed', 'replicanti', 'tickspeed']) {
          const values = GameDatabase.multiplierTabValues[resource];
          const isDimension = ['AD', 'ID', 'TD'].includes(resource);
          const keys = isDimension ? tree[`${resource}_total`][0].flatMap(key => tree[key][0])
            : tree[`${resource}_total`][0];
          check(keys.length === new Set(keys).size, `${name}/${resource}: duplicate source`);
          const tiers = isDimension ? [null, 1, ...(resource === 'AD' ? [9] : [])] : [null];
          for (const tier of tiers) {
            for (const key of keys) {
              const entry = values[key.split('_')[1]];
              if (!entry?.transformValue) continue;
              try {
                const transform = entry.transformValue(tier);
                if (!transform) continue;
                checked++;
                check(transform.type !== 'diagnostic', `${name}/${key}/${tier}: gameplay mismatch`);
                for (const field of ['before', 'after', 'value', 'finalWith', 'finalWithout']) {
                  check(finite(transform[field]), `${name}/${key}/${tier}/${field}: nonfinite`);
                }
              } catch (error) { failures.push(`${name}/${key}/${tier}: ${error.message}`); }
            }
          }
        }
        Modal.hideAll();
        Tab.statistics.multipliers.show();
        GameUI.update();
        await new Promise(resolve => setTimeout(resolve, 100));
        const tab = document.querySelector('.l-multiplier-category-btn-container')?.parentElement.__vue__;
        if (tab) {
          for (const resource of ['AD', 'ID', 'TD', 'replicanti', 'tickspeed']) {
            tab.selectTab(tab.availableGroups.flatMap(group => group.options).find(option => option.key === resource));
            GameUI.update();
            await new Promise(resolve => setTimeout(resolve, 100));
            if (resource === 'AD' && name.startsWith('Slabdrill')) {
              check(tab.dimensionOptions.some(option => option.tier === 9), `${name}: AD9 navigation`);
              tab.selectDimension(9);
              GameUI.update();
            }
          }
        }
        scenarios.push({ name, checked });
      }
      // The errors from the user's log: zero Tesseracts at active C, study 232,
      // cursed galaxy purchases, and a zero best-Infinity time during passive generation.
      await load();
      curse();
      player.celestials.enslaved.tesseracts = 0;
      check(Number.isFinite(Tesseracts.effectiveCount), 'Zero Tesseracts at active C');
      check(Galaxy.costScalingStart instanceof Decimal, 'Cursed galaxy threshold type');
      const budget = Galaxy.requirementAt(new Decimal(150)).amount;
      check(finite(Galaxy.buyableGalaxies(budget)), 'Cursed galaxy bulk inverse');
      const study232 = GameDatabase.eternity.timeStudies.normal.find(study => study.id === 232);
      check(study232.formatEffect(study232.effect()).startsWith('+'), 'TS232 formatting');
      await load();
      player.celestials.alpha.stage = 28;
      player.disablePostReality = false;
      player.records.bestInfinity.time = DC.D0;
      // Avoid an automatic prestige replacing the deliberately zero record.
      Autobuyers.tick = () => {};
      for (const diff of [0, 50]) {
        gameLoop(diff, { blackHoleSpeedup: DC.D1 });
        check(finite(Currency.infinities.value), `Passive Infinity generation at zero best time / diff ${diff}`);
        check(finite(gainedEternityPoints()), `EP reward after passive generation / diff ${diff}`);
      }
      return { scenarios, failures };
    }, save);
    result.failures.push(...errors);
    console.log(JSON.stringify(result, null, 2));
    if (result.failures.length) process.exitCode = 1;
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
