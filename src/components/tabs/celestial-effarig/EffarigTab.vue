<script>
import { boundedPositiveQuotient } from "@/core/finite-decimal";
import CelestialQuoteHistory from "@/components/CelestialQuoteHistory";
import EffarigRunUnlockReward from "./EffarigRunUnlockReward";
import EffarigUnlockButton from "./EffarigUnlockButton";

export default {
  name: "EffarigTab",
  components: {
    EffarigUnlockButton,
    EffarigRunUnlockReward,
    CelestialQuoteHistory,
  },
  data() {
    return {
      relicShards: new Decimal(0),
      shardRarityBoost: new Decimal(0),
      shardPower: new Decimal(1),
      shardMaxRarityIncrease: new Decimal(0),
      shardsGained: new Decimal(0),
      currentShardsRate: new Decimal(0),
      amplification: new Decimal(0),
      amplifiedShards: new Decimal(0),
      amplifiedShardsRate: new Decimal(0),
      runUnlocked: false,
      quote: "",
      isRunning: false,
      vIsFlipped: false,
      relicShardRarityAlwaysMax: false,
      hasSecondShop: false
    };
  },
  computed: {
    shopUnlocks: () => {
      let u = [
        EffarigUnlock.adjuster,
        EffarigUnlock.glyphFilter,
        EffarigUnlock.setSaves
      ];
      if (Achievement(227).isUnlocked) u.push(EffarigUnlock.maintainRS, EffarigUnlock.glyphGenerationBoost,
        EffarigUnlock.maxMomentum, EffarigUnlock.maxRarityBoost, EffarigUnlock.extendRun);
      return u;
    },
    runUnlock: () => EffarigUnlock.run,
    runUnlocks: () => {
      let r = [
        EffarigUnlock.infinity,
        EffarigUnlock.eternity,
        EffarigUnlock.reality,
      ];
      if (EffarigUnlock.extendRun.isUnlocked) r.push(EffarigUnlock.endgame);
      return r;
    },
    symbol: () => GLYPH_SYMBOLS.effarig,
    runButtonOuterClass() {
      return {
        "l-effarig-run-button": true,
        "c-effarig-run-button": true,
        "c-effarig-run-button--running": this.isRunning,
        "c-effarig-run-button--not-running": !this.isRunning,
        "c-celestial-run-button--clickable": !this.isDoomed,
        "o-pelle-disabled-pointer": this.isDoomed
      };
    },
    runButtonInnerClass() {
      return this.isRunning ? "c-effarig-run-button__inner--running" : "c-effarig-run-button__inner--not-running";
    },
    runDescription() {
      return `${this.$legacyText(GameDatabase.celestials.descriptions[1].effects())}\n
      ${this.$legacyText(GameDatabase.celestials.descriptions[1].description())}`;
    },
    showShardsRate() {
      return this.currentShardsRate;
    },
    isDoomed: () => Pelle.isDoomed || Slabdrill.isCursed,
  },
  watch: {
    isRunning() {
      this.$recompute("runDescription");
    }
  },
  methods: {
    update() {
      this.relicShards.copyFrom(Currency.relicShards.value);
      this.shardRarityBoost.copyFrom(Effarig.maxRarityBoost.div(100));
      this.shardPower.copyFrom(new Decimal(player.disablePostReality && !SlabdrillUnlocks.timeStudy181.isUnlocked
        ? 1 : Ra.unlocks.maxGlyphRarityAndShardSacrificeBoost.effectOrDefault(1)));
      this.shardMaxRarityIncrease.copyFrom(Effarig.rarityCapIncrease.div(100));
      this.shardsGained.copyFrom(Effarig.shardsGained);
      this.currentShardsRate.copyFrom(boundedPositiveQuotient(this.shardsGained, Time.thisRealityRealTime.totalMinutes));
      this.amplification.copyFrom(simulatedRealityCount(false));
      this.amplifiedShards.copyFrom(this.shardsGained.times(this.amplification.add(1)));
      this.amplifiedShardsRate.copyFrom(boundedPositiveQuotient(this.amplifiedShards, Time.thisRealityRealTime.totalMinutes));
      this.quote = Effarig.quote;
      this.runUnlocked = EffarigUnlock.run.isUnlocked;
      this.isRunning = Effarig.isRunning;
      this.vIsFlipped = V.isFlipped;
      this.relicShardRarityAlwaysMax = (Ra.unlocks.extraGlyphChoicesAndRelicShardRarityAlwaysMax.canBeApplied || EndgameMilestone.startRa.isReached) && !player.disablePostReality;
      this.hasSecondShop = Achievement(227).isUnlocked;
    },
    startRun() {
      if (this.isDoomed) return;
      Modal.celestials.show({ name: "Effarig's", number: 1 });
    },
    createCursedGlyph() {
      Glyphs.giveCursedGlyph();
    }
  }
};
</script>

<template>
  <div class="l-teresa-celestial-tab">
    <CelestialQuoteHistory celestial="effarig" />
    <div class="l-effarig-shop-and-run">
      <div class="l-effarig-shop">
        <div class="c-effarig-relics">
          {{ $t('ade.72a577765e7e40b3', { p0: $legacyText(_s(quantify("Relic Shard",relicShards,2,0))) }) }}
          <br>
          <span v-if="relicShardRarityAlwaysMax">
            The rarity of new Glyphs is being increased by +{{ $legacyText(_s(formatDecimalPercents(shardRarityBoost, 2))) }}.
          </span>
          <span v-else>
            Each new Glyph will have its rarity increased
            <br>
            by a random value between +{{ $legacyText(_s(formatPercents(0))) }} and +{{ $legacyText(_s(formatDecimalPercents(shardRarityBoost, 2))) }}.
          </span>
          <span v-if="shardPower.gt(1)">
            <LocalizedText id="ade.8b7a451ab20f2a16">
    <template #p0><br></template>
    <template #p1>{{ $legacyText(_s(formatPow(shardPower,0,2))) }}</template>
  </LocalizedText>
          </span>
          <span v-if="shardMaxRarityIncrease.gt(0)">
            <br>
            The Glyph Rarity cap is also being increased by +{{ $legacyText(_s(formatDecimalPercents(shardMaxRarityIncrease, 2))) }}.
          </span>
        </div>
        <div class="c-effarig-relic-description">
          <LocalizedText id="ade.966c58f5a9f8a8fd">
            <template #p0>{{ $legacyText(_s(quantify("Relic Shard",shardsGained,2))) }}</template>
            <template #p1>{{ $legacyText(_s(format(currentShardsRate,2))) }}</template>
            <template #p2><span v-if="amplification.gt(0)">
            <br>
            {{ $t('ade.d2cfd600a36d6045') }}
            <br>
            you will actually gain a total of
            {{ $legacyText(_s(quantify("Relic Shard", amplifiedShards, 2))) }} ({{ $legacyText(_s(format(amplifiedShardsRate, 2))) }}/min).
          </span></template>
          </LocalizedText>
        </div>
        <div class="c-effarig-relic-description">
          <br>
          {{ $t('ade.fce0f6e48755a88f') }}

        </div>
        <EffarigUnlockButton
          v-for="(unlock, i) in shopUnlocks"
          :key="i"
          :unlock="unlock"
        />
        <EffarigUnlockButton
          v-if="!runUnlocked"
          :unlock="runUnlock"
        />
        <button
          v-if="vIsFlipped"
          class="c-effarig-shop-button c-effarig-shop-button--available"
          @click="createCursedGlyph"
        >
          {{ $t('ade.906ee4e1d44b75d8') }}
        </button>
      </div>
      <div
        v-if="runUnlocked"
        class="l-effarig-run"
      >
        <div class="c-effarig-run-description">
          <span :class="{ 'o-pelle-disabled': isDoomed }">
            {{ $t('ade.1648b59b1d7b2bdd') }}
          </span>
        </div>
        <div
          :class="runButtonOuterClass"
          @click="startRun"
        >
          <div
            :class="runButtonInnerClass"
            :button-symbol="symbol"
          >
            {{ $legacyText(_s(symbol)) }}
          </div>
        </div>
        <div class="c-effarig-run-description">
          {{ $legacyText(_s(runDescription)) }}
        </div>
        <EffarigRunUnlockReward
          v-for="(runRewardUnlock, j) in runUnlocks"
          :key="j"
          :unlock="runRewardUnlock"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.c-effarig-relic-description {
  width: 46rem;
}
</style>
