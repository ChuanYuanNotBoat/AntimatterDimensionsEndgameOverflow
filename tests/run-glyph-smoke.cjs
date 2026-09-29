'use strict';
// Exercise actual equip and gameplay getters in a disposable profile. Never write a save.
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

async function main() {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => {
      if (message.text().startsWith('Glyph test phase:')) console.error(message.text());
      if (message.type() === 'error' && /Implicit conversion|Error in render|Duplicate keys/u.test(message.text())) {
        errors.push(message.text());
      }
    });
    await page.goto(process.env.AD_TEST_URL || 'http://127.0.0.1:8080/?glyphTest=1');
    await page.waitForFunction(() => window.GameStorage && window.Glyphs && window.gameLoop);
    const saveText = fs.readFileSync(path.join(__dirname, 'fixtures/local-overflow-save.txt'), 'utf8').trim();
    const result = await page.evaluate(async ({ text, filter }) => {
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
        player.reality.glyphs.active = [];
        Glyphs.refreshActive();
        Glyphs.updateRealityGlyphEffects();
        Lazy.invalidateAll();
        await new Promise(resolve => setTimeout(resolve, 200));
      };
      const failures = [];
      let phase = '';
      const snapshot = () => {
        const getters = {
          achievement: () => Achievements.power,
          achievementPower: () => Achievements.powerConv(Achievements.power),
          dimboost: () => DimBoost.power,
          AD1: () => AntimatterDimension(1).multiplier,
          ID1: () => InfinityDimension(1).multiplier,
          TD1: () => TimeDimension(1).multiplier,
          tickspeed: () => Tickspeed.perSecond,
          speed: () => getGameSpeedupFactor(),
          IPGain: () => gainedInfinityPoints(),
          EPGain: () => gainedEternityPoints(),
          AM: () => Currency.antimatter.value,
          IP: () => Currency.infinityPoints.value,
          EP: () => Currency.eternityPoints.value,
          RMGain: () => MachineHandler.uncappedRM,
          RM: () => Currency.realityMachines.value,
          amplifier: () => RealityUpgrade(1).effectValue,
          replicationGlyphPower: () => getAdjustedGlyphEffect('replicationpow'),
          achievementGlyphPower: () => getAdjustedGlyphEffect('effarigachievement'),
          infinityGlyphPower: () => getAdjustedGlyphEffect('infinitypow'),
          IPGlyphPower: () => getSecondaryGlyphEffect('infinityIP'),
          EPGlyphPower: () => getSecondaryGlyphEffect('timeEP'),
          galaxies: () => player.galaxies,
          replicantiGalaxies: () => Replicanti.galaxies.total,
          tachyonGalaxies: () => player.dilation.totalTachyonGalaxies,
          galacticGalaxies: () => GalacticPower.freeGalaxies,
          boosts: () => DimBoost.totalBoosts,
        };
        const values = {};
        for (const [key, getter] of Object.entries(getters)) {
          try {
            const value = new Decimal(getter());
            values[key] = { sign: value.sign, layer: value.layer, mag: value.mag, max: value.gte(DC.BEMAX) };
            if (![value.sign, value.layer, value.mag].every(Number.isFinite) || value.gte(DC.BEMAX)) {
              failures.push(`${phase}: ${key}: invalid or premature max`);
            }
          } catch (error) { failures.push(`${phase}: ${key}: ${error.message}`); }
        }
        return values;
      };
      const scenarios = {};
      for (const [name, type, level] of [
        ['Y-native-limit', 'reality', String(Number.MAX_VALUE)],
        ['Y-with-basic', 'reality', String(Number.MAX_VALUE)],
        ['E-screenshot', 'effarig', 'ee266.3537'],
        ['E-higher', 'effarig', 'eee1000'],
        ['R-Reality-native-limit', 'replication', String(Number.MAX_VALUE)],
        ['R-Reality-higher', 'replication', 'ee266.3537'],
        ['R-Reality-screenshot', 'replication', 'eee266.31765'],
        ['G-Reality-screenshot', 'effarig', 'eee265.52994'],
        ['I-Reality-screenshot', 'infinity', 'eee266.31765'],
        ['T-Reality-screenshot', 'time', 'eee266.31765'],
      ]) {
        if (filter && !name.startsWith(filter)) continue;
        await load();
        phase = name + ': equip';
        console.info('Glyph test phase: ' + phase);
        const glyph = GlyphGenerator.omniGlyph(type);
        glyph.level = new Decimal(level);
        glyph.rawLevel = new Decimal(level);
        glyph.strength = 8.5;
        glyph.effects = GlyphEffects.all.filter(effect => effect.id.startsWith(type))
          .reduce((mask, effect) => mask | (1 << effect.bitmaskIndex), 0);
        Glyphs.addToInventory(glyph);
        Glyphs.equip(glyph, 0);
        if (!player.reality.glyphs.active.includes(glyph)) failures.push(name + ': did not equip');
        if (name === 'Y-with-basic') {
          const basic = GlyphGenerator.omniGlyph('time');
          basic.level = new Decimal(1200); basic.rawLevel = new Decimal(1200); basic.strength = 3.5;
          Glyphs.addToInventory(basic); Glyphs.equip(basic, 1);
        }
        Lazy.invalidateAll();
        const effects = {};
        for (const effect of GlyphEffects.all.filter(effect => effect.id.startsWith(type))) {
          const value = new Decimal(getAdjustedGlyphEffect(effect.id));
          effects[effect.id] = { layer: value.layer, mag: value.mag, text: effect.formatEffect(value) };
          if (![value.sign, value.layer, value.mag].every(Number.isFinite)) failures.push(name + ': ' + effect.id);
          if (/NaN|Infinit/iu.test(effects[effect.id].text)) failures.push(name + ': invalid effect display ' + effect.id);
          if (effect.conversion) {
            const secondary = new Decimal(effect.conversion(value));
            effects[effect.id].secondary = effect.formatSecondaryEffect(secondary);
            if (![secondary.sign, secondary.layer, secondary.mag].every(Number.isFinite) ||
                /NaN|Infinit/iu.test(effects[effect.id].secondary)) failures.push(name + ': secondary ' + effect.id);
          }
        }
        const before = snapshot();
        for (let tick = 0; tick < 20; tick++) {
          gameLoop(50);
          snapshot();
        }
        const after = snapshot();
        let reset;
        if (name.includes('-Reality-')) {
          phase = name + ': Reality';
          console.info('Glyph test phase: ' + phase);
          player.reality.respec = false;
          let resets = 0;
          const observer = {};
          EventHub.logic.on(GAME_EVENT.REALITY_RESET_AFTER, () => resets++, observer);
          if (!isRealityAvailable()) throw new Error(name + ': Reality unavailable');
          autoReality();
          EventHub.logic.offAll(observer);
          await new Promise(resolve => setTimeout(resolve, 25));
          const progress = () => ui.$viewModel.modal.progressBar;
          const deadline = Date.now() + 25000;
          while (progress() && Date.now() < deadline) await new Promise(resolve => setTimeout(resolve, 25));
          if (progress()) throw new Error(name + ': glyph processing timed out');
          if (resets !== 1) failures.push(name + ': Reality did not reset');
          Lazy.invalidateAll();
          reset = { immediately: snapshot(), sacrifice: {} };
          for (const basicType of BASIC_GLYPH_TYPES) {
            const boost = new Decimal(GlyphAlteration.sacrificeBoost(basicType));
            reset.sacrifice[basicType] = { layer: boost.layer, mag: boost.mag };
            if (![boost.sign, boost.layer, boost.mag].every(Number.isFinite)) {
              failures.push(name + ': nonfinite sacrifice boost ' + basicType);
            }
          }
          for (let tick = 0; tick < 20; tick++) {
            phase = name + ': post-Reality tick ' + tick;
            if (tick === 0) console.info('Glyph test phase: ' + phase);
            gameLoop(50);
            snapshot();
          }
          reset.afterTicks = snapshot();
        }
        GameUI.update();
        await new Promise(resolve => setTimeout(resolve, 150));
        scenarios[name] = { effects, before, after, reset };
      }
      await load();
      const percent = GameDatabase.reality.dualityUpgrades.find(upgrade => upgrade.id === 21);
      const percentText = percent.formatEffect(new Decimal('ee400'));
      if (/NaN|Infinity/u.test(percentText)) failures.push('Duality upgrade percent formatting');
      Tab.reality.dual_upgrades.show();
      Modal.hideAll();
      GameUI.update();
      await new Promise(resolve => setTimeout(resolve, 150));
      GameStorage.lastBackupTimes = Object.fromEntries(Array.from({ length: 16 }, (_, i) =>
        [i, { backupTimer: 7.014006999999764e81, date: Date.now() }]));
      Modal.backupWindows.show();
      GameUI.update();
      await new Promise(resolve => setTimeout(resolve, 150));
      const keys = [...new Set([...document.querySelectorAll('*')].map(element => element.__vue__))]
        .filter(child => child?.$options.name === 'BackupEntry')
        .map(child => child.$vnode.key);
      if (!Modal.backupWindows.isOpen || !keys.length || keys.length !== new Set(keys).size) {
        failures.push('Backup window keys');
      }
      Modal.hide();
      return { scenarios, percentText, backupSlots: keys.length, failures };
    }, { text: saveText, filter: process.env.AD_GLYPH_TEST_FILTER ?? '' });
    result.failures.push(...errors);
    console.log(JSON.stringify(result, null, 2));
    if (result.failures.length) process.exitCode = 1;
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
