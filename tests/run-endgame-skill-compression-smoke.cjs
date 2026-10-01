'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

async function main() {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => {
      if (message.type() === 'error' && /Error in render|Implicit conversion/u.test(message.text())) {
        errors.push(message.text());
      }
    });
    await page.goto(process.env.AD_TEST_URL || 'http://127.0.0.1:8080/?inspectSave=1');
    await page.waitForFunction(() => window.GameStorage && window.EndgameSkillPurchaseType && window.GameUI.initialized);
    const saveText = fs.readFileSync(path.join(__dirname, 'fixtures/local-overflow-save.txt'), 'utf8').trim();
    const load = async () => page.evaluate(text => {
      GameIntervals.stop();
      GameIntervals.start = () => {};
      GameIntervals.restart = () => {};
      for (const interval of GameIntervals.all()) { interval.start = () => {}; interval.restart = () => {}; }
      for (const key of ['save', 'saveToBackup', 'backupOfflineSlots', 'tryOnlineBackups']) GameStorage[key] = () => {};
      GameStorage.offlineEnabled = false;
      const root = GameSaveSerializer.deserialize(text);
      GameStorage.loadPlayerObject(root.saves ? root.saves[root.current] : root);
      GameIntervals.stop();
      Modal.hideAll();
      Lazy.invalidateAll();
    }, saveText);

    await load();
    assert.equal(await page.evaluate(() => ['gg', 'cp', 'dp']
      .every(type => EndgameSkillPurchaseType[type].amount instanceof Decimal)), true, 'legacy count conversion');
    await page.evaluate(() => {
      const huge = Decimal.fromComponents(1, 15, 2.078e266);
      player.endgames = Math.max(player.endgames, 1);
      CelestialDimension(1).amount = DC.D1;
      player.galaxies = huge;
      player.celestials.pelle.galaxyGenerator.generatedGalaxies = DC.D0;
      player.celestials.pelle.galaxyGenerator.spentGalaxies = DC.D0;
      player.endgame.celestialPoints = huge;
      player.endgame.doomedParticles = huge;
      for (const type of ['gg', 'cp', 'dp']) EndgameSkillPurchaseType[type].amount = new Decimal(1234567);
      player.endgameMasteries.skills = DC.D0;
      player.endgameMasteries.shopMinimized = false;
      Lazy.invalidateAll();
      Tab.endgame.masteries.show();
      GameUI.update();
    });
    await page.locator('.l-es-buy-max-vbox button').click();
    await page.waitForFunction(() => ['gg', 'cp', 'dp'].every(type =>
      EndgameSkillPurchaseType[type].amount.gt(Number.MAX_VALUE)));
    const purchases = await page.evaluate(() => {
      const before = Currency.endgameSkills.value;
      const finite = value => [value.sign, value.layer, value.mag].every(Number.isFinite);
      const result = {
        counts: ['gg', 'cp', 'dp'].map(type => EndgameSkillPurchaseType[type].amount.toString()),
        skills: before.toString(),
        finite: finite(before) && ['gg', 'cp', 'dp'].every(type => finite(EndgameSkillPurchaseType[type].cost)),
        repeat: EndgameSkills.buyMax(),
        unchanged: Currency.endgameSkills.value.eq(before)
      };
      const serialized = GameSaveSerializer.serialize(player);
      GameStorage.loadPlayerObject(GameSaveSerializer.deserialize(serialized));
      GameIntervals.stop();
      Lazy.invalidateAll();
      result.reloaded = Currency.endgameSkills.value.eq(before) && ['gg', 'cp', 'dp']
        .every(type => EndgameSkillPurchaseType[type].amount instanceof Decimal);
      result.achievementFinite = finite(Achievement(231).effectValue);
      return result;
    });
    assert.ok(purchases.finite && purchases.unchanged && purchases.reloaded && purchases.achievementFinite);
    assert.equal(purchases.repeat, 0);

    const exits = [];
    for (const entry of ['tab', 'header']) {
      await load();
      await page.evaluate(entryPoint => {
        if (!EndgameMastery.timeCompression.isBought) {
          player.endgameMasteries.permanentMasteries.push(EndgameMastery.timeCompression.id);
        }
        player.options.confirmations.compression = true;
        player.compression.active = true;
        player.dilation.active = false;
        player.antimatter = entryPoint === 'tab' ? DC.E1 : new Decimal('1e1000');
        player.records.totalEndgameAntimatter = player.antimatter;
        player.compression.hawkingRadiation = DC.D0;
        Lazy.invalidateAll();
        Tab.endgame.compression.show();
        GameUI.update();
      }, entry);
      if (entry === 'tab') await page.locator('.o-compression-btn').click();
      else await page.locator('.l-game-header__challenge-text button').filter({ hasText: 'Exit Compression' }).click();
      const modal = page.locator('.c-modal-message').filter({ hasText: 'You are about to exit Compression' });
      await modal.waitFor({ state: 'visible' });
      const text = await modal.innerText();
      assert.match(text, /If you exit Compression now, you will/u);
      if (entry === 'tab') assert.match(text, /not gain anything/u);
      else assert.match(text, /gain .*Hawking Radiation/u);
      await modal.locator('.c-modal__confirm-btn').click();
      await page.waitForFunction(() => !player.compression.active);
      await modal.waitFor({ state: 'hidden' });
      const reward = await page.evaluate(() => Currency.hawkingRadiation.value.toString());
      exits.push({ entry, reward });
    }
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ purchases, exits, errors }, null, 2));
  } finally {
    await browser.close();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
