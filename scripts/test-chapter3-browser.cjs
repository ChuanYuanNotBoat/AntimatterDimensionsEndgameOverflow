// Optional browser regression runner. Use an existing Playwright installation;
// no browser or test dependency is added to the game. Never writes the supplied save.
const assert = require("node:assert/strict"),
      fs = require("node:fs"), path = require("node:path"), crypto = require("node:crypto");

const playwright = require(process.env.ADE_PLAYWRIGHT_MODULE ||
  (process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES ? `${process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES}/playwright` : "playwright"));
if (!process.env.ADE_TEST_SAVE) throw new Error("Set ADE_TEST_SAVE to an exported save used only in the isolated test browser.");

const targetUrl = new URL(process.env.ADE_TEST_URL || "http://127.0.0.1:40765/?inspectSave=1");
if (process.env.ADE_TEST_AUDIT !== "0") targetUrl.searchParams.set("i18nAudit", "1");
const url = targetUrl.href;
const batchAB = process.env.ADE_TEST_DOMAIN_BATCH === "AB";
(async () => {
  const browser = await playwright.chromium.launch({
    executablePath: process.env.ADE_CHROMIUM_PATH,
    args: process.env.ADE_CHROMIUM_PATH ? ["--no-sandbox", "--disable-dev-shm-usage", "--use-gl=angle", "--use-angle=swiftshader"] : [],
    ...(process.env.ADE_TEST_PROXY ? { proxy: { server: process.env.ADE_TEST_PROXY } } : {}),
    headless: true
  });

  try {
    const errors = [];
    async function preparePage(options) {
      const target = await browser.newPage({ ...options, ignoreHTTPSErrors: Boolean(process.env.ADE_TEST_PROXY) });
      target.on("pageerror", e => errors.push(e.stack));
      target.on("console", m => {
        if (/\[i18n\] (?:format|values|catalog):|\[Vue warn\].*(?:Error|Invalid)|(?:Type|Reference|Syntax)Error:/.test(m.text())) errors.push(m.text());
      });
      await target.route("**/*", route => {
        const u = new URL(route.request().url());
        return /\.webm/.test(u.pathname) ? route.fulfill({ status: 200, body: "" }) :
          u.origin === new URL(url).origin ? route.continue() : route.abort();
      });
      if (process.env.ADE_TEST_FONT_CSS) {
        const fontCssPath = process.env.ADE_TEST_FONT_CSS;
        await target.route("**/__ade_qa_fonts/*", route => route.fulfill({
          contentType: "font/woff2", body: fs.readFileSync(path.join(path.dirname(fontCssPath), "files",
            path.basename(new URL(route.request().url()).pathname)))
        }));
        await target.goto(url, { waitUntil: "domcontentloaded", timeout: 120000 });
        const css = fs.readFileSync(fontCssPath, "utf8").replaceAll("./files/", "/__ade_qa_fonts/");
        await target.addStyleTag({ content: `${css} *:not(i):not([class*=fa]) { font-family: Typewriter, 'Noto Sans SC Variable', monospace !important; }` });
        await target.evaluate(() => document.fonts.ready);
      } else await target.goto(url, { waitUntil: "domcontentloaded", timeout: 120000 });
      await target.waitForFunction(() => window.GameUI?.initialized, null, { timeout: 120000 });
      if (process.env.ADE_TEST_AUDIT !== "0") assert.equal(await target.evaluate(() => typeof window.__i18nAudit?.scan), "function", "audit bridge missing from tested build");
      return target;
    }
    const page = await preparePage({ viewport: { width: 1450, height: 1100 } });
    const save = fs.readFileSync(process.env.ADE_TEST_SAVE, "utf8").trim();
    const base = await page.evaluate(async s => {
      GameIntervals.stop();

      GameIntervals.start = () => {};

      GameIntervals.restart = () => {};

      for (const i of GameIntervals.all()) {
        i.start = () => {};

        i.restart = () => {};
      }

      GameStorage.offlineEnabled = false;
      GameStorage.loadPlayerObject(GameSaveSerializer.deserialize(s));
      Modal.hideAll();
      Quote.clearAll();
      player.hasSeenIntro = true;
      player.introFrozen = false;
      player.celestials.slabdrill.isCursed = false;
      player.celestials.slabdrill.core.isActive = false;
      player.celestials.slabdrill.isDestroyed = false;
      player.celestials.slabdrill.isGoodbye = false;
      player.celestials.slabdrill.isWarping = false;
      player.disablePostReality = false;
      player.auto.autobuyersOn = false;
      player.endgame.largeHadronCollider.void.isRunning = false;
      player.endgame.overcharge.isRunning = false;
      player.compression.active = false;
      player.universes.current = 0;
      player.options.news.enabled = false;
      player.options.hiddenTabBits = 0;
      player.options.hiddenSubtabBits.fill(0);
      player.options.confirmations.compression = false;
      player.options.confirmations.overcharge = false;
      player.options.confirmations.universes = false;
      Lazy.invalidateAll();
      GameUI.update();
      await Vue.nextTick();
      const pauseTickers = view => {
        if (view.$options.name === "NewsTicker") view.clearTimeouts();
        for (const child of view.$children) pauseTickers(child);
      };
      pauseTickers(ui);
      GameUI.update();
      await Vue.nextTick();
      const stopNews = view => {
        if (view.$options.name === "NewsTicker") view.clearTimeouts();
        view.$children.forEach(stopNews);
      };
      stopNews(ui);
      return GameSaveSerializer.serialize(player);
    }, save);

    const scenarioReports = [];
    const runtimeAudits = [];
    const reports = [];
    async function auditContext(domain, target = page) {
      await target.evaluate(domain => {
        window.__i18nAudit?.clear();
        window.__i18nAudit?.setContext({ domain });
      }, domain);
    }
    async function captureAudit(domain, details = {}, target = page) {
      const audit = await target.evaluate(() => {
        window.__i18nAudit?.scan();
        return window.__i18nAudit?.snapshot();
      });
      if (!audit) return;
      runtimeAudits.push({ domain, ...details, ...audit });
      if (process.env.ADE_TEST_REPORT) fs.writeFileSync(process.env.ADE_TEST_REPORT, JSON.stringify({ scenarioReports, runtimeAudits, reports, errors }, null, 2));
      for (const type of ["parameter-error", "text-ref-error", "catalog-error", "stale-locale-cache"]) {
        assert.equal(audit.totals[type] ?? 0, 0, `${domain}: ${type} (including bounded-overflow records)`);
      }
      const failures = audit.entries.filter(entry => ["parameter-error", "text-ref-error", "catalog-error", "stale-locale-cache"].includes(entry.type) ||
        (entry.type === "missing-key" && entry.candidate === "en"));
      assert.deepEqual(failures, [], `${domain}: runtime audit errors`);
    }
    async function scenario(name, fn) {
      const runs = [];
      for (const locale of ["en", "zh-CN"]) {
        await auditContext(name);
        await page.evaluate(async () => { Tab.options.visual.show(true); GameUI.update(); await Vue.nextTick(); });
        const beforeSwitch = await page.evaluate(() => GameSaveSerializer.serialize(player));
        await page.selectOption("#ade-language", locale);
        const afterSwitch = await page.evaluate(() => GameSaveSerializer.serialize(player));
        if (afterSwitch !== beforeSwitch) {
          const changedPaths = await page.evaluate(({ before, after }) => {
            const paths = [];
            const walk = (a, b, path) => {
              if (JSON.stringify(a) === JSON.stringify(b)) return;
              if (a && b && typeof a === "object" && typeof b === "object") {
                for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) walk(a[key], b[key], `${path}.${key}`);
              } else paths.push(path);
            };
            walk(GameSaveSerializer.deserialize(before), GameSaveSerializer.deserialize(after), "player");
            return paths;
          }, { before: beforeSwitch, after: afterSwitch });
          throw new Error(`${name}: locale changes player at ${changedPaths.join(", ")}`);
        }
        const result = await page.evaluate(({ s, fn }) => {
          const originalNow = Date.now;
          const originalRandom = Math.random;
          let seed = 123456789;
          // Test-only deterministic clock and random stream; restored even when assertions fail.
          Date.now = () => 1791072000000;
          Math.random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
          try {
            GameStorage.loadPlayerObject(GameSaveSerializer.deserialize(s));
            Modal.hideAll();
            Quote.clearAll();
            Lazy.invalidateAll();
            const check = (condition, message) => { if (!condition) throw Error(message); };
            const finite = value => value instanceof Decimal ? [value.sign, value.layer, value.mag].every(Number.isFinite) : Number.isFinite(value);
            const result = new Function("check", "finite", fn)(check, finite);
            return { result, state: GameSaveSerializer.serialize(player) };
          } finally { Date.now = originalNow; Math.random = originalRandom; }
        }, { s: base, fn: fn.toString().replace(/^.*?\{([\s\S]*)\}$/, "$1") });
        await captureAudit(name, { locale });
        runs.push(result);
      }
      assert.deepEqual(runs[1].result, runs[0].result, `${name}: locale changes operation result`);
      // Compare the entire save, including Decimal fields, Sets, automation and reset records. No ignored fields.
      assert.ok(runs[1].state === runs[0].state, `${name}: en/zh-CN serialized player differs`);
      scenarioReports.push({ name, locales: ["en", "zh-CN"], identical: true,
        stateHash: crypto.createHash("sha256").update(runs[0].state).digest("hex") });
      console.log(name, "en/zh-CN identical", JSON.stringify(runs[0].result));
    }

    if (!process.env.ADE_TEST_UI_ONLY) {
      await scenario("Compression purchase/entry/exit", () => {
        player.endgameMasteries.permanentMasteries.push(3);
        Lazy.invalidateAll();
        check(PlayerProgress.compressionUnlocked(), "fixture compression unlock");
        check(enterCompression(), "enter");
        check(!enterCompression(), "repeat enter");
        player.compression.thermalRadiation = DC.BEMAX;
        check(buyCompressionUpgrade(1, Infinity), "bulk");
        check(player.compression.rebuyables[1] === Number.MAX_SAFE_INTEGER, "safe count");
        player.records.totalEndgameAntimatter = new Decimal("1e10000");
        check(exitCompression(), "exit");
        check(!exitCompression(), "repeat exit");
        check(finite(player.compression.hawkingRadiation), "HR");
        return {
          reward: player.compression.hawkingRadiation.toString()
        };
      });
      await scenario("Universe resets and rewards", () => {
        player.celestials.pelle.divinities = new Decimal(30);
        check(enterUniverse(1), "enter");
        player.universes.highestTransientAntimatter = new Decimal("ee100");
        check(exitUniverse(1), "exit");
        check(!exitUniverse(1), "repeat exit");
        check(finite(player.universes.ephemeralLight), "light");
        check(!enterUniverse(4), "unimplemented universe");
        return {
          light: player.universes.ephemeralLight.toString()
        };
      });
      await scenario("Overcharge low and maximum rewards", () => {
        player.endgame.ascension = 9;
        player.endgame.overcharge.level = 1;
        player.endgame.overcharge.completions.bi = 0;
        check(enterOvercharge(), "enter");
        player.eternityPoints = DC.D0;
        check(getOverchargeEnergyGain() === 0, "low reward");
        check(exitOvercharge(), "exit");
        check(player.endgame.overcharge.completions.bi === 0, "no NaN");
        check(enterOvercharge(), "re-enter");
        player.eternityPoints = DC.BEMAX;
        check(exitOvercharge(), "exit max");
        check(player.endgame.overcharge.completions.bi === 9, "cap");
        check(!exitOvercharge(), "repeat exit");
        return {
          energy: 9
        };
      });
      await scenario("Core snapshot restore and cooldown", () => {
        player.celestials.slabdrill.isCursed = true;
        player.disablePostReality = true;
        player.celestials.slabdrill.stage = 5;
        player.dimensions.antimatter[8].amount = new Decimal(1234);
        player.dimensions.infinity[8].amount = new Decimal(5678);
        player.eternityChalls.eterc7 = 3;
        const am = player.antimatter.toString();
        check(Slabdrill.enterCore(), "core enter");
        check(!Slabdrill.enterCore(), "repeat core");
        player.celestials.slabdrill.core.lastFound = Date.now();
        check(!Slabdrill.hunt(), "cooldown");
        check(Slabdrill.exitCore(), "core exit");
        check(!Slabdrill.exitCore(), "repeat core exit");
        check(player.antimatter.eq(am), "restore AM");
        check(player.dimensions.antimatter[8].amount.eq(1234), "restore AD9");
        check(player.dimensions.infinity[8].amount.eq(5678), "restore ID9");
        check(player.eternityChalls.eterc7 === 3, "restore EC");
        return {
          restored: true
        };
      });
      await scenario("Star rewards and mastery effects at boundaries", () => {
        for (const amount of [DC.D0, DC.D1, new Decimal("ee100"), DC.BEMAX]) {
          for (const key of Object.keys(player.endgame.ethereal.stars)) player.endgame.ethereal.stars[key] = amount;

          player.universes.stellarAugmenters = amount;
          Lazy.invalidateAll();

          for (const star of EtherealStars.all) check(finite(star.reward), `star ${star.id} ${amount}`);
        }

        for (const value of [DC.D0, DC.D1, DC.BEMAX]) {
          player.endgame.celestialPoints = value;
          player.endgame.celDimExpansion.celestialEternityPoints = value;
          player.celestials.pelle.divinity.nebulae = value;

          for (const id of [281, 282, 283, 291, 292, 293]) check(finite(EndgameMastery(id).effectValue), `mastery ${id}`);
        }

        return {
          stars: 9,
          masteries: 6
        };
      });
      await scenario("Hadrons, collider bulk and singularity", () => {
        player.compression.totalElectromagneticWaves = DC.BEMAX;
        Hadrons.updateTotals();
        Lazy.invalidateAll();
        check(finite(player.celestials.laitela.hadrons.trueTotal), "hadrons");
        check(LHC.powerCores.buyMax(), "cores buy max");
        check(player.endgame.largeHadronCollider.powerCores === Number.MAX_SAFE_INTEGER, "core count");
        check(!LHC.powerCores.buyMax(), "capped");
        player.celestials.laitela.singularityCapIncreases = new Decimal("1e12");
        Singularity.increaseCap();
        check(player.celestials.laitela.singularityCapIncreases.gt("1e12"), "increase");
        Singularity.decreaseCap();
        check(finite(Singularity.cap), "cap");
        check(finite(Singularity.singularitiesGained), "gain");
        return {
          finite: true
        };
      });
      await scenario("Charged upgrades use the live energy budget", () => {
      for (const [upgrades, key, budget] of [[BreakInfinityUpgrade.all, "infinite", "bi"],
        [EternityUpgrade.all, "eternal", "eter"]]) {
        const candidates = upgrades.filter(upgrade => upgrade.isBought && upgrade.hasChargeEffect);
        check(candidates.length >= 2, "fixture charged upgrades");
        player.endgame.overcharge.charged[key].clear();
        player.endgame.overcharge.completions[budget] = 1;
        player.endgame.overcharge.chargesLeft[key] = 99;
        check(candidates[0].charge(), "first charge");
        check(!candidates[1].charge(), "stale budget");
        check(player.endgame.overcharge.charged[key].size === 1, "single charge budget");
      }
      return { budgetChecked: true };
    });
    await scenario("Save roundtrip and real game ticks", () => {
        for (const mode of [0, 1, 2, 3, 4]) {
          player.compression.active = mode === 1;
          player.universes.current = mode === 2 ? 1 : mode === 3 ? 2 : 0;
          player.endgame.overcharge.isRunning = mode === 4;
          gameLoop(100, {
            realDiff: 100
          });
        }

        const s = GameSaveSerializer.serialize(player);
        GameStorage.loadPlayerObject(GameSaveSerializer.deserialize(s));
        check(GameStorage.checkPlayerObject(player) === "", "save valid");
        gameLoop(86400000, {
          realDiff: 86400000
        });
        check(GameStorage.checkPlayerObject(player) === "", "offline tick valid");
        return {
          roundtrip: true
        };
      });
      await scenario("Dimension purchases, Replicanti and autobuyer toggles", () => {
        player.auto.disableContinuum = true;
        player.infinityPoints = new Decimal("1e1000");
        for (const dimension of InfinityDimensions.all) {
          dimension.amount = DC.D0;
          dimension.baseAmount = DC.D0;
          dimension.cost = new Decimal(1e8);
          dimension.isUnlocked = true;
          check(dimension.buySingle() === true, "single dimension purchase");
          dimension.buyMax(false);
          check(finite(dimension.amount) && dimension.amount.gt(10), "bulk dimension purchase");
        }
        for (const buyer of [Autobuyer.bigCrunch, Autobuyer.eternity, Autobuyer.reality]) {
          const original = buyer.isActive;
          buyer.toggle();
          check(buyer.isActive !== original, "toggle");
        }
        player.replicanti.chance = new Decimal(0.01);
        player.replicanti.chanceCost = new Decimal(1);
        player.eterc8repl = 100;
        const upgrade = ReplicantiUpgrade.chance;
        const chance = upgrade.value;
        upgrade.purchase();
        check(upgrade.value.gt(chance), "replicanti chance purchase");
        check(finite(player.replicanti.amount), "replicanti amount");
        return { purchased: true };
      });
      if (batchAB) {
        await scenario("Dimension autobuyer identities and modes", () => {
          const groups = [Autobuyer.antimatterDimension, Autobuyer.infinityDimension, Autobuyer.timeDimension];
          const names = groups.map(group => group.groupName);
          for (const group of groups) group.isActive = !group.isActive;
          const modes = [];
          for (let tier = 1; tier <= 8; tier++) {
            const buyer = Autobuyer.antimatterDimension(tier);
            buyer.toggleMode(); buyer.toggle();
            check(buyer.tier === tier, "canonical dimension tier");
            modes.push(buyer.mode);
          }
          check(Autobuyer.bigCrunch.name === "Infinity", "canonical Infinity name");
          check(Autobuyer.eternity.name === "Eternity", "canonical Eternity name");
          return { names, modes };
        });
        await scenario("Tangible Universe reset, production and rewards", () => {
          player.celestials.pelle.divinities = new Decimal(40);
          check(enterUniverse(2), "enter Tangible");
          check(player.universes.current === 2, "canonical universe id");
          gameLoop(1000, { realDiff: 1000 });
          check(finite(player.universes.molecularMass), "molecular mass production");
          player.universes.highestTangibleMatter = new Decimal("ee100");
          check(exitUniverse(2), "exit Tangible");
          check(player.universes.current === 0, "exit universe id");
          return { reward: player.universes.stellarAugmenters.toString() };
        });
        await scenario("Slabdrill stage and unlock identities", () => {
          player.celestials.slabdrill.isCursed = true;
          player.celestials.slabdrill.stage = 0;
          const ids = SlabdrillUnlocks.all.map(unlock => unlock.id);
          for (let stage = 0; stage < Slabdrill.layerReqs.length; stage++) {
            check(Slabdrill.currentStage === stage, "canonical stage");
            check(typeof Slabdrill.nextLayer === "string", "canonical condition");
            Slabdrill.advanceLayer();
          }
          return { ids, stage: Slabdrill.currentStage };
        });
      }
      await scenario("Automator canonical compilation and execution", () => {
        const script = "auto infinity off\nauto eternity off\npause 0.1 seconds\nstop";
        check(!hasCompilationErrors(script), "compile canonical commands");
        const compiled = AutomatorScript.create("Locale fixture", script);
        check(compiled.commands.length === 4, "command count");
        const first = compiled.commands[0].run({});
        const second = compiled.commands[1].run({});
        check(!Autobuyer.bigCrunch.isActive && !Autobuyer.eternity.isActive, "execute canonical auto commands");
        return { commands: compiled.commands.length, first, second };
      });
    } // Reuse the original save for text checks; changing language must preserve canonical state.
    if (process.env.ADE_TEST_GAMEPLAY_ONLY) {
      if (process.env.ADE_TEST_REPORT) fs.writeFileSync(process.env.ADE_TEST_REPORT, JSON.stringify({ scenarioReports, runtimeAudits, errors }, null, 2));
      assert.deepEqual(errors, []);
      console.log(`PASS: ${scenarioReports.length} gameplay scenarios with identical complete saves in en/zh-CN.`);
      return;
    }


    await page.evaluate(s => {
      GameStorage.loadPlayerObject(GameSaveSerializer.deserialize(s));
      Modal.hideAll();
      Quote.clearAll();
    }, base);
    if (!process.env.ADE_TEST_FIXTURES_ONLY) for (const modern of [true, false]) for (const locale of ["zh-CN", "en", "zh-CN"]) {
      await page.evaluate(async ({
        modern,
        locale
      }) => {
        player.options.newUI = modern;
        ui.view.newUI = modern;
        Tab.options.visual.show(true);
        GameUI.update();
        await Vue.nextTick();
      }, {
        modern,
        locale
      });
      const before = await page.evaluate(() => GameSaveSerializer.serialize(player));
      await page.selectOption("#ade-language", locale);
      await page.waitForFunction(l => document.documentElement.lang === l, locale);
      assert.equal(await page.evaluate(() => GameSaveSerializer.serialize(player)), before, "language changes save");
      const tabs = await page.evaluate(() => Object.values(Tab).filter(t => t?.subtabs).flatMap(t => t.subtabs.filter(s => s.isUnlocked).map(s => [t.key, s.key])));

      for (const [tab, sub] of tabs) {
        if (batchAB && !(["dimensions", "infinity", "endgame", "universes"].includes(tab) ||
          tab === "automation" && sub === "autobuyers" || tab === "challenges" && sub === "infinity" ||
          tab === "celestials" && sub === "slabdrill")) continue;
        await auditContext(`${tab}/${sub}`);
        const result = await page.evaluate(async ({
          tab,
          sub
        }) => {
          Modal.hideAll();
          Quote.clearAll();
          Tab[tab][sub].show(true);
          GameUI.update();
          await Vue.nextTick();
          return {
            text: document.body.innerText,
            components: ui.$children.map(c => c.$options.name)
          };
        }, {
          tab,
          sub
        });
        if (process.env.ADE_TEST_REPORT) fs.writeFileSync(process.env.ADE_TEST_REPORT, JSON.stringify({
          reports,
          errors,
          current: {
            modern,
            locale,
            tab,
            sub,
            text: result.text
          }
        }, null, 2));
        assert.doesNotMatch(result.text, /\{p\d+\}|\[\[terms\.|\uE000|\uE001|\bundefined\b|\bNaN\b/u, `${modern}/${locale}/${tab}/${sub}`);

        if (batchAB && locale === "zh-CN") {
          if (tab === "infinity") assert.doesNotMatch(result.text, /of your best IP\/min|Galaxies are stronger based on Teresa/u, `${tab}/${sub}`);
          if (tab === "dimensions") assert.doesNotMatch(result.text, /购买 [^\n]*times|维度献祭已禁用 [^\n]*multiplier|买到 [^\n]*Cost/u, `${tab}/${sub}`);
          if (tab === "endgame") assert.doesNotMatch(result.text, /Generate .*Perk Point per minute|[0-9] Endgames|Endgames every|Condense Ethereal Power for .*Gray Stars|Total Hadrons|\(Capped:/u, `${tab}/${sub}`);
        }
        if (locale === "zh-CN" && tab === "automation" && sub === "autobuyers") {
          assert.doesNotMatch(result.text, /Current Setting|Dynamic amount|Dimension Autobuyers can have|Activates every X seconds|Bulk Singularity Time|now automatically and continuously/u);
          assert.ok(result.text.includes("当前设置"));
        }
        if (locale === "zh-CN" && tab === "infinity" && sub === "replicanti") {
          assert.doesNotMatch(result.text, /on all Infinity Dimensions|from a Dilation Upgrade|to Dark Energy from|to Space Theorems from|Auto Galaxy|Max Replicanti Galaxies/u);
        }
        if (locale === "zh-CN" && tab === "celestials" && sub === "effarig") {
          assert.ok(result.text.includes("所有维度的倍率"));
          assert.equal((result.text.match(/更多不同的符文效果/g) || []).length, 1);
          assert.ok(!result.text.includes("gained. More distinct"));
          assert.ok(!result.text.includes("且aretickspeed"));
        }

        if (locale === "zh-CN" && tab === "dimensions" && sub === "antimatter") {
            assert.ok(result.text.includes("第一反物质维度"));
            assert.ok(result.text.includes("第三反物质维度"));
            assert.ok(!result.text.includes("第第一"));
            assert.ok(!result.text.includes("distant星系"));
            assert.ok(!result.text.includes("反物质 D"));
            assert.ok(result.text.includes("反物质星系"));
            assert.match(result.text, /需要：[\s\S]*第八反物质维度/u);
          }
          reports.push({
          modern,
          locale,
          tab,
          sub,
          text: result.text
        });
        await captureAudit(`${tab}/${sub}`, { modern, locale });
      }
    }

    if (process.env.ADE_TEST_REPORT) fs.writeFileSync(process.env.ADE_TEST_REPORT, JSON.stringify({
      reports,
      errors
    }, null, 2));
    // Reproduce the specific split-sentence bugs with production components and real DOM.
    // Fixtures change display data only; glyph/save identities and mechanics remain the real game objects.
    let screenshotChecks = 0;
    const localeFixtureOutputs = new Map();
    for (const modern of [true, false]) for (const locale of ["en", "zh-CN", "en"]) {
      await page.evaluate(async modern => {
        player.options.newUI = modern;
        ui.view.newUI = modern;
        Tab.options.visual.show(true);
        GameUI.update();
        await Vue.nextTick();
      }, modern);
      await page.selectOption("#ade-language", locale);
      await auditContext("display-fixtures");
      const result = await page.evaluate(async ({ batchAB }) => {
        const layout = player.options.newUI ? "Modern" : "Classic";
        const timeTab = player.options.newUI ? "NewTimeDimensionsTab" : "ClassicTimeDimensionsTab";
        const find = (name, root = ui) => root.$options.name === name ? root :
          root.$children.map(child => find(name, child)).find(Boolean);
        const definitions = {};
        for (const [tab, sub, names] of [
          ["automation", "autobuyers", ["MultipleAutobuyersBox", "RealityAutobuyerBox", "TickspeedAutobuyerBox", "CelestialTickspeedAutobuyerBox"]],
          ["infinity", "replicanti", ["ReplicantiTab", "ReplicantiGalaxyButton"]],
          ["reality", "glyphs", ["GlyphsTab"]],
          ["celestials", "laitela", ["HadronsPane"]],
          ["endgame", "compression", ["TimeCompressionTab", "CompressionButton"]],
          ["universes", "transient", ["TransientUniverseTab"]],
          ["celestials", "slabdrill", ["SlabdrillTab"]],
          ...(batchAB ? [
            ["dimensions", "infinity", [`${layout}InfinityDimensionsTab`, `${layout}InfinityDimensionRow`]],
            ["dimensions", "divine", [`${layout}DivineDimensionTab`]],
            ["dimensions", "time", [timeTab]],
            ["dimensions", "antimatter", ["TickspeedRow", `${layout}DimensionBoostRow`, `${layout}AntimatterDimensionRow`]],
            ["infinity", "upgrades", ["InfinityUpgradesTab"]],
            ["challenges", "infinity", ["InfinityChallengesTab"]],
            ["endgame", "upgrades", ["EndgameUpgradesTab"]],
            ["endgame", "expansion-packs", ["ExpansionPacksContainer"]],
            ["universes", "tangible", ["TangibleUniverseTab"]],
            ["endgame", "collider", ["LargeHadronColliderTab"]],
            ["universes", "tangible", ["TangibleUniverseTab"]]
          ] : [])
        ]) {
          // The neutral gameplay fixture closes the Slabdrill run. Open its real tab
          // temporarily for display fixtures, without replacing the production component.
          const wasCursed = player.celestials.slabdrill.isCursed;
          if (sub === "slabdrill") player.celestials.slabdrill.isCursed = true;
          try {
            Tab[tab][sub].show(true);
            GameUI.update();
            await Vue.nextTick();
            for (const name of names) {
              const view = find(name);
              if (!view) throw Error(`Missing fixture component ${name}`);
              definitions[name] = view.constructor.options;
            }
          } finally {
            player.celestials.slabdrill.isCursed = wasCursed;
          }
        }
        for (const name of ["CurrentGlyphEffects", "SacrificedGlyphs", "GlyphSetName"]) {
          definitions[name] = definitions.GlyphsTab.components[name] ||
            (name === "GlyphSetName" ? definitions.GlyphsTab.components.CurrentGlyphEffects.components.GlyphSetName : undefined);
        }
        definitions.CelestialEternityButton = find("CelestialEternityButton").constructor.options;
        definitions.CelestialCrunchButton = find("CelestialCrunchButton").constructor.options;
        if (batchAB) {
          definitions.EnterUniverseModal = Modal.enterUniverse._component;
          definitions.ExitCompressionModal = Modal.exitCompression._component;
          definitions.HotkeysModal = Modal.hotkeys._component;
          definitions.SlabdrillStrike = definitions.SlabdrillTab.components.SlabdrillStrike;
        }
        const captures = [];
        async function capture(name, data, propsData = {}, label = name) {
          if (batchAB && ["RealityAutobuyerBox", "SacrificedGlyphs", "CurrentGlyphEffects", "GlyphSetName"].includes(name)) return;
          let view;
          const modal = name === "EnterUniverseModal" ? Modal.enterUniverse :
            name === "ExitCompressionModal" ? Modal.exitCompression : name === "HotkeysModal" ? Modal.hotkeys : null;
          const wasCompression = player.compression.active;
          if (modal) {
            Modal.hideAll();
            if (name === "ExitCompressionModal") player.compression.active = true;
            modal.show(propsData); GameUI.update(); await Vue.nextTick(); view = find(name);
            if (!view) throw Error(`Missing actual modal ${name}`);
          } else {
            view = new (Vue.extend(definitions[name]))({ propsData });
            view.$mount(); document.body.appendChild(view.$el); await Vue.nextTick();
          }
          EventHub.ui.offAll(view);
          Object.assign(view, data);
          await Vue.nextTick();
          if (typeof view.$el.innerText !== "string") throw Error(`Missing DOM for ${label} (${name})`);
          window.__i18nAudit?.inspect(view.$el.innerText, { component: name });
          captures.push({ label, state: { hasEffarig: view.hasEffarig, hasReality: view.hasReality }, text: view.$el.innerText.replace(/\s+/gu, " ").trim(),
            attributes: [...view.$el.querySelectorAll("[title], [data-original-title]")].map(el => el.getAttribute("title") || el.getAttribute("data-original-title")),
            paragraphs: name === "TimeCompressionTab" ? [...view.$el.querySelectorAll(".l-compression-tab > span")]
              .map(el => el.innerText).join(" ") : undefined,
            highlights: [...view.$el.querySelectorAll(".c-replicanti-description__accent")].map(el => el.textContent) });
          if (modal) { Modal.hideAll(); player.compression.active = wasCompression; }
          else { view.$destroy(); view.$el.remove(); }
        }
        for (const [type, flipped] of [[Autobuyer.antimatterDimension, false], [Autobuyer.antimatterDimension, true],
          [Autobuyer.infinityDimension, false], [Autobuyer.timeDimension, false]]) {
          await capture("MultipleAutobuyersBox", { continuumActive: true, infinityContinuumUnlocked: true,
            timeContinuumUnlocked: true, isFlipped: flipped }, { type }, `continuum-${type.groupName}-${flipped}`);
        }
        for (let mode = 0; mode <= 5; mode++) await capture("RealityAutobuyerBox", {
          mode, hasAlternateInputs: mode > AUTO_REALITY_MODE.BOTH, isOverCap: true
        }, {}, `reality-mode-${mode}`);
        for (const name of ["TickspeedAutobuyerBox", "CelestialTickspeedAutobuyerBox"]) await capture(name, {});
        for (const pow of [false, true]) {
          await capture("ReplicantiTab", { isUnlocked: true, hasTDMult: true, hasDTMult: true,
            hasIPMult: true, hasDEMult: true, hasSTMult: true, hasPow: pow, hasTDPow: pow,
            hasDTPow: pow, hasIPPow: pow, hasDEPow: pow, hasSTPow: pow,
            mult: new Decimal(123), multTD: new Decimal(234), multDT: new Decimal(345),
            multIP: new Decimal(456), multDE: new Decimal(567), multST: new Decimal(678),
            pow: 1.5, powTD: 1.6, powDT: 1.7, powIP: 1.8, powDE: 1.9, powST: 2,
            hasRaisedCap: true, replicantiCap: new Decimal("1e500"), effarigInfinityBonusRG: 12
          }, {}, `replicanti-powers-${pow}`);
        }
        for (const active of [true, false]) for (const enabled of [true, false]) await capture("ReplicantiGalaxyButton",
          { isAutoUnlocked: true, isAutoActive: active, isAutoEnabled: enabled }, {}, `replicanti-auto-${active}-${enabled}`);
        await capture("SacrificedGlyphs", { hasAlteration: true, hideAlteration: false, maxSacrifice: new Decimal("1e100") });
        for (const count of [0, 1, 2]) for (const both of [true, false]) await capture("CurrentGlyphEffects", {
          hasEffarig: true, hasReality: both, maxSpecialGlyphs: count
        }, {}, `glyph-limit-${count}-${both}`);
        await capture("GlyphSetName", { slotCount: 5 }, { glyphSet: ["reality", "effarig", "time", "infinity", "infinity"]
          .map((type, id) => ({ type, id, effects: type === "effarig" ? (1 << 20) | (1 << 21) : 0, level: new Decimal(100), strength: new Decimal(1) })) });
        for (const rate of [true, false]) {
          await capture("CelestialEternityButton", { isVisible: true, type: 1, showCEPRate: rate,
            headerTextColored: false, gainedCEP: new Decimal(123) }, {}, `celestial-eternity-${rate}`);
          await capture("CelestialCrunchButton", { isVisible: true, canCrunch: true, showCIPRate: rate,
            headerTextColored: false, gainedCIP: new Decimal(456) }, {}, `celestial-crunch-${rate}`);
        }
        await capture("HadronsPane", { lightHadrons: 10, totalLightHadrons: 14, darkHadrons: 20, totalDarkHadrons: 25,
          exoticHadrons: 30, totalExoticHadrons: 36, hasDark: true, hasExotic: true });
        await capture("TimeCompressionTab", { hawkingRadiation: new Decimal(123), thermalRadiation: new Decimal(456),
          thermalRadiationIncome: new Decimal(7), waveThreshold: new Decimal(789), baseWaves: new Decimal(3), totalWaves: new Decimal(4) });
        for (const state of [{ isUnlocked: false }, { isUnlocked: true, isRunning: false },
          { isUnlocked: true, isRunning: true, canInfinity: true, hasGain: true },
          { isUnlocked: true, isRunning: true, canInfinity: true, hasGain: false },
          { isUnlocked: true, isRunning: true, canInfinity: false }]) {
          await capture("CompressionButton", { ...state, hawkingRadiationGain: new Decimal(123), requiredForGain: new Decimal(456),
            infinityGoal: new Decimal(789) }, {}, `compression-${JSON.stringify(state)}`);
        }
        await capture("TransientUniverseTab", { ephemeralLight: new Decimal(123), highestAntimatter: new Decimal(456),
          relativisticParticles: new Decimal(789), particlesPerSecond: new Decimal(12), particleBoost: new Decimal(0.25) });
        for (const active of [false, true]) await capture("SlabdrillTab", { isCursed: true, isCoreActive: active,
          power: new Decimal(123), powerPerSecond: new Decimal(456), powerCap: new Decimal(789) }, {}, `slab-core-${active}`);
        if (batchAB) {
          for (const ec9 of [false, true]) for (const flipped of [false, true]) {
            await capture(`${layout}InfinityDimensionsTab`, { infinityPower: new Decimal(123), dimMultiplier: new Decimal(456),
              conversionRate: 7, isEC9Running: ec9, isFlipped: flipped }, {}, `domain-infinity-${ec9}-${flipped}`);
          }
          for (const flipped of [false, true]) await capture(`${layout}DivineDimensionTab`, { divineMatter: new Decimal(123),
            conversionFormula1: new Decimal(2), conversionFormula2: new Decimal(3), conversionFormula3: 0.25,
            isFlipped: flipped }, {}, `domain-divine-${flipped}`);
          await capture(timeTab, { hasCap: true }, {}, "domain-time-cap");
          await capture("TickspeedRow", { isTransient: true, isVisible: true, isContinuumActive: false, isEC9: false }, {}, "domain-transient-tickspeed");
          await capture("InfinityChallengesTab", { isFlipped: false }, {}, "domain-infinity-goals");
          await capture("InfinityUpgradesTab", { chargeUnlocked: true, chargesUsed: 1, totalCharges: 3,
            eternityUnlocked: true, bottomRowUnlocked: true, isSoftcapApplicable: true, isUncapped: false,
            ipMultSoftCap: new Decimal(123), ipMultHardCap: new Decimal(456) }, {}, "domain-infinity-upgrades");
          await capture("EndgameUpgradesTab", {}, {}, "domain-endgame-locks");
          for (const mode of [0, 1]) for (const flipped of [false, true]) await capture("LargeHadronColliderTab", {
            hasAccelerator: true, hasC: true, c: 1, milestonesReached: 5, canSeeEntropy1: true, canSeeEntropy2: true,
            highestAntimatter: new Decimal(123), nullified: true, voidMode: mode, isFlipped: flipped
          }, {}, `domain-collider-${mode}-${flipped}`);
          for (const [number, name] of [[1, "Transient"], [2, "Tangible"]]) await capture("EnterUniverseModal", {}, { number, name }, `domain-universe-${number}`);
          for (const gain of [0, 123]) await capture("ExitCompressionModal", { hawkingRadiationGain: new Decimal(gain) }, {}, `domain-compression-exit-${gain}`);
          await capture("HotkeysModal", {}, {}, "domain-hotkeys");
          for (const [running, gain] of [[false, 0], [true, 0], [true, 123]]) await capture("TangibleUniverseTab", {
            isRunning: running, pendingAugmenters: new Decimal(gain), highestMatter: new Decimal(456),
            molecularMass: new Decimal(123), massPerSecond: new Decimal(7), massBoost: new Decimal(2),
            stellarAugmenters: new Decimal(89), formula: new Decimal(0.25)
          }, {}, `domain-tangible-${running}-${gain}`);
          for (const pack of ExpansionPack.all) await capture("ExpansionPacksContainer", { isUnlocked: true }, { pack }, `domain-expansion-${pack.id}`);
          for (const unlock of SlabdrillUnlocks.all) await capture("SlabdrillStrike", {}, { getUnlock: () => unlock }, `domain-strike-${unlock.id}`);
          for (let tier = 1; tier <= 9; tier++) await capture(`${layout}DimensionBoostRow`, { requirement: { tier, amount: new Decimal(123) } }, {}, `domain-boost-${tier}`);
        }
        return captures;
      }, { batchAB });
      if (process.env.ADE_TEST_REPORT) fs.writeFileSync(process.env.ADE_TEST_REPORT, JSON.stringify({ reports, errors, fixtures: result }, null, 2));
      await captureAudit("display-fixtures", { modern, locale, fixtures: result });
      for (const row of result) {
        const cacheKey = `${modern}/${locale}/${row.label}`;
        const earlier = localeFixtureOutputs.get(cacheKey);
        if (earlier !== undefined && earlier !== row.text) {
          await page.evaluate(({ locale, component }) => window.__i18nAudit?.record({ type: "stale-locale-cache", locale,
            component, reason: "paused-fixture-roundtrip" }), { locale, component: row.label });
          await captureAudit("display-fixtures", { modern, locale });
          assert.fail(`Paused locale roundtrip differs: ${cacheKey}`);
        }
        localeFixtureOutputs.set(cacheKey, row.text);
        assert.doesNotMatch(row.text, /\{p\d+\}|\[\[terms\.|\uE000|\uE001|\bundefined\b|\bNaN\b|\$\{/u, row.label);
        if (row.label.startsWith("replicanti-powers")) assert.equal(row.highlights.length, row.label.endsWith("true") ? 13 : 7);
        if (locale === "zh-CN") {
          // Compression's child upgrades still contain known English fallbacks. Keep their
          // full output in the audit; these new assertions cover the reviewed paragraphs.
          if (!row.label.startsWith("domain-") && !row.label.startsWith("slab-core")) assert.doesNotMatch(row.paragraphs ?? row.text, /now automatically|Current Setting|Target |Dynamic amount|multiplier| power on|on all|from Glyphs|from an Alpha|extra Replicanti|Auto Galaxy|when their Glyph|All effects from|You cannot have|Celestial Eternity for|Celestial Crunch for|Celestial .*of Infinity/u, row.label);
          if (row.label.startsWith("domain-")) {
            assert.doesNotMatch(row.text, /维度维度|第第一|\{p\d+\}|\[\[terms/u, row.label);
            if (row.label.startsWith("domain-infinity-")) assert.doesNotMatch(row.text, /Dimensions\.|Compression Upgrade/u, row.label);
            if (row.label.startsWith("domain-divine")) assert.doesNotMatch(row.text, /Exponent while|reduction to Hadron/u, row.label);
            if (row.label.startsWith("domain-expansion")) { assert.match(row.text, /[\u3400-\u9fff]/u); assert.doesNotMatch(row.text, /Unlock |Keep |Start |Automatically|Black Hole|Endgame|Canister|Reality Machine|Celestial Galaxies/u, row.label); if (row.label === "domain-expansion-vPack") { assert.match(row.text, /解锁薇的现实/u); assert.doesNotMatch(row.text, /自动完成薇的现实/u); } }
            if (row.label.startsWith("domain-tangible")) { assert.doesNotMatch(row.text, /Tangible|Molecular Mass|Stellar Augmenters|You have|Gray Star/u); assert.match(row.text, /超质量体.*星流增幅体|星流增幅体.*超质量体/u); }
            if (row.label === "domain-time-cap") assert.doesNotMatch(row.text, /Any 8th Time/u);
            if (row.label === "domain-transient-tickspeed") assert.match(row.text, /流幻宇宙/u);
            if (row.label === "domain-hotkeys") { assert.equal((row.text.match(/因技术限制/g) || []).length, 1); assert.doesNotMatch(row.text, /will not buy a single|may instead|will still work/u); }
            if (row.label === "domain-endgame-locks") { assert.match(row.text, /权限会永久保留/u); assert.doesNotMatch(row.text, /to make the game prevent/u); }
            if (row.label.startsWith("domain-strike")) assert.doesNotMatch(row.text, /Serpentine Power|multiplier|raised to|recreate|Infinity。|Eternity。|Reality。|None|。。/u, row.label);
            if (row.label.startsWith("domain-collider")) { assert.match(row.text, /里程碑.*均衡器/u); assert.doesNotMatch(row.text, /Equalizer|This shift|Your highest|Entering The Void|will generate Null Particles/u, row.label); }
            if (row.label.startsWith("domain-compression-exit")) { assert.match(row.text, /退出压缩/u); assert.doesNotMatch(row.text, /If you exit|not gain|Hawking Radiation|激能确认|Exit/u); assert.match(row.text, row.label.endsWith("-0") ? /不会获得任何奖励/u : /霍金辐射/u); }
            if (row.label === "domain-universe-1") assert.doesNotMatch(row.text, /Inside the Transient|Begin|刹那宇宙/u);
            if (row.label === "domain-universe-2") { assert.doesNotMatch(row.text, /Tangible宇宙|Reach .*Antimatter/u); assert.match(row.text, /物质以获得/u); }
          }
          if (row.label.startsWith("continuum")) {
            assert.equal((row.text.match(/连续统将取代/g) || []).length, 1);
            assert.doesNotMatch(row.text, /[A-Za-z]/u);
          }
          if (row.label === "SacrificedGlyphs") assert.equal((row.text.match(/某个效果将得到提升/g) || []).length, 1);
          if (row.label === "GlyphSetName") assert.equal(row.text, "现实 元神 刹那 无限");
          if (row.label === "HadronsPane") {
            for (const quantity of ["10(+4) 个强子", "20(+5) 个暗强子", "30(+6) 个奇迹强子"]) assert.ok(row.text.includes(quantity));
          }
          if (row.label.startsWith("celestial-eternity")) assert.ok(row.text.includes("天界永恒点数"));
          if (row.label.startsWith("celestial-crunch")) assert.ok(row.text.includes("天界无限点数"));
          if (row.label.startsWith("glyph-limit")) assert.ok(row.text.includes("你不能"));
          if (row.label === "TimeCompressionTab" || row.label.startsWith("compression-")) {
            assert.doesNotMatch(row.text, /Next:|Triple the amount|Gain a multiplier to .*Dimensions|Dimensions based on/u, row.label);
            assert.doesNotMatch(row.paragraphs ?? row.text, /You have|Thermal Radiation|Hawking Radiation|Disable Compression|Reach |Compress time|Next |Electromagnetic Waves act/u, row.label);
            assert.doesNotMatch(row.text, /维度维度/u, row.label);
          }
          if (row.label === "TransientUniverseTab") {
            assert.doesNotMatch(row.text, /Ephemeral Light|Relativistic Particles|Your highest|while inside|reset on exiting/u);
            assert.match(row.text, /削弱 25/u);
            assert.doesNotMatch(row.text, /削弱至/u);
          }
          if (row.label.startsWith("slab-core")) {
            assert.match(row.text, row.label.endsWith("true") ? /离开诅咒核心/u : /进入诅咒核心/u);
            assert.doesNotMatch(row.text, /You have|Enter the Cursed Core|Exit the Cursed Core|Serpentine Power|Power halves/u);
          }
        } else {
          if (row.label === "GlyphSetName") assert.equal(row.text, "Real Meta Transient Infinity");
          if (row.label.startsWith("continuum")) assert.equal((row.text.match(/now automatically/g) || []).length, 1);
          if (row.label.startsWith("glyph-limit-1")) assert.match(row.text, /Glyph equipped/u);
        }
        reports.push({ modern, locale, fixture: row.label, text: row.text });
        screenshotChecks++;
      }
    }
    const mobile = await preparePage({ viewport: { width: 390, height: 844 }, isMobile: true, deviceScaleFactor: 1 });
    await mobile.evaluate(s => {
      GameIntervals.stop();
      GameIntervals.start = () => {};
      GameIntervals.restart = () => {};
      for (const interval of GameIntervals.all()) {
        interval.start = () => {};
        interval.restart = () => {};
      }
      GameStorage.offlineEnabled = false;
      GameStorage.loadPlayerObject(GameSaveSerializer.deserialize(s));
      Modal.hideAll();
      Quote.clearAll();
    }, base);
    for (const modern of [true, false]) {
      await mobile.evaluate(async mode => {
        Modal.hideAll();
        Quote.clearAll();
        player.options.newUI = mode;
        ui.view.newUI = mode;
        Tab.options.visual.show(true);
        GameUI.update();
        await Vue.nextTick();
      }, modern);
      await mobile.selectOption("#ade-language", "zh-CN");
      for (const [tab, sub] of (batchAB ? [["dimensions", "infinity"], ["dimensions", "divine"], ["endgame", "upgrades"], ["endgame", "collider"], ["automation", "autobuyers"], ["universes", "transient"]] : [["dimensions", "antimatter"], ["celestials", "effarig"], ["endgame", "ascension"], ["automation", "autobuyers"], ["infinity", "replicanti"], ["reality", "glyphs"]])) {
        await auditContext(`${tab}/${sub}`, mobile);
        const body = await mobile.evaluate(async keys => {
          Modal.hideAll();
          Quote.clearAll();
          Tab[keys[0]][keys[1]].show(true);
          GameUI.update();
          await Vue.nextTick();
          return document.body.innerText;
        }, [tab, sub]);
        await captureAudit(`${tab}/${sub}`, { modern, locale: "zh-CN", mobile: true }, mobile);
        assert.doesNotMatch(body, /\{p\d+\}|\uE000|\bundefined\b|\bNaN\b|第第一/u);
        if (tab === "dimensions") {
          const overflow = await mobile.evaluate(() => [...document.querySelectorAll(".l-dimension-single-row")].filter(row => row.getBoundingClientRect().height > 0).flatMap(row => {
            const bounds = row.getBoundingClientRect();
            return [...row.querySelectorAll(".c-dim-row__large, .c-dim-row__small")].filter(text => text.getBoundingClientRect().bottom > bounds.bottom + 1).map(text => text.textContent.trim());
          }));
          assert.deepEqual(overflow, [], `mobile dimension row overflow: ${modern}/${sub}`);
        }
        if (process.env.ADE_TEST_SCREENSHOT_DIR) {
          await mobile.screenshot({ path: `${process.env.ADE_TEST_SCREENSHOT_DIR}/${modern ? "modern" : "classic"}-${sub}.png`, fullPage: true });
        }
      }
    }
    await mobile.close();
    if (process.env.ADE_TEST_REPORT) fs.writeFileSync(process.env.ADE_TEST_REPORT, JSON.stringify({ scenarioReports, runtimeAudits, reports, errors }, null, 2));
    assert.deepEqual(errors, []);
    console.log(`PASS: ${process.env.ADE_TEST_UI_ONLY ? "UI checks" : `${scenarioReports.length} en/zh-CN identical gameplay scenarios`} and ${reports.length} UI renders, both layouts, repeated locale changes, and 12 mobile renders; ${screenshotChecks} screenshot-specific DOM checks.`);
  } finally {
    await browser.close();
  }
})().catch(e => {
  console.error(e.stack);
  process.exitCode = 1;
});
