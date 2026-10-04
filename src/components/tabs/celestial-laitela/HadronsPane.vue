<script>
export default {
  name: "HadronsPane",
  data() {
    return {
      totalHadrons: 0,
      lightHadrons: 0,
      darkHadrons: 0,
      exoticHadrons: 0,
      totalLightHadrons: 0,
      totalDarkHadrons: 0,
      totalExoticHadrons: 0,
      basePercentageCap: 0,
      percentageCap: 0,
      hadronTimer: new Decimal(0),
      effect1: new Decimal(1),
      effect2: new Decimal(1),
      effect3: new Decimal(0),
      effect4: new Decimal(1),
      effect5: new Decimal(1),
      hasEffect1: false,
      hasEffect2: false,
      hasEffect3: false,
      hasEffect4: false,
      hasDark: false,
      hasExotic: false,
      showWarning: false,
      isFlipped: false
    };
  },
  computed: {
    extraLightHadrons() {
      return new Decimal(this.totalLightHadrons).sub(this.lightHadrons);
    },
    extraDarkHadrons() {
      return new Decimal(this.totalDarkHadrons).sub(this.darkHadrons);
    },
    extraExoticHadrons() {
      return new Decimal(this.totalExoticHadrons).sub(this.exoticHadrons);
    },
    effect1Time() {
      return new Decimal(0.25).div(Hadrons.speedFactor).times(this.percentageCap).sub(this.hadronTimer);
    },
    effect2Time() {
      return new Decimal(0.5).div(Hadrons.speedFactor).times(this.percentageCap).sub(this.hadronTimer);
    },
    effect3Time() {
      return new Decimal(1).div(Hadrons.speedFactor).times(this.percentageCap).sub(this.hadronTimer);
    },
    effect4Time() {
      return new Decimal(2).div(Hadrons.speedFactor).times(this.percentageCap).sub(this.hadronTimer);
    },
    effect5Time() {
      return new Decimal(5).div(Hadrons.speedFactor).times(this.percentageCap).sub(this.hadronTimer);
    },
    effect1Percent() {
      let fac = this.hadronTimer.times(100).times(4).times(Hadrons.speedFactor);
      let per = fac.gte(100) ? fac.sub(100).sqrt().add(100) : fac;
      return per.div(100).min(this.basePercentageCap / 100);
    },
    effect2Percent() {
      let fac = this.hadronTimer.times(100).times(2).times(Hadrons.speedFactor);
      let per = fac.gte(100) ? fac.sub(100).sqrt().add(100) : fac;
      return per.div(100).min(this.basePercentageCap / 100);
    },
    effect3Percent() {
      let fac = this.hadronTimer.times(100).times(Hadrons.speedFactor);
      let per = fac.gte(100) ? fac.sub(100).sqrt().add(100) : fac;
      return per.div(100).min(this.basePercentageCap / 100);
    },
    effect4Percent() {
      let fac = this.hadronTimer.times(100).div(2).times(Hadrons.speedFactor);
      let per = fac.gte(100) ? fac.sub(100).sqrt().add(100) : fac;
      return per.div(100).min(this.basePercentageCap / 100);
    },
    effect5Percent() {
      let fac = this.hadronTimer.times(100).div(5).times(Hadrons.speedFactor);
      let per = fac.gte(100) ? fac.sub(100).sqrt().add(100) : fac;
      return per.div(100).min(this.basePercentageCap / 100);
    },
    effect1Text() {
      if (this.effect1Time.lte(0)) return `Effect is capped`;
      return `Time to cap: ${TimeSpan.fromHours(this.effect1Time).toStringShort()}`;
    },
    effect2Text() {
      if (this.effect2Time.lte(0)) return `Effect is capped`;
      return `Time to cap: ${TimeSpan.fromHours(this.effect2Time).toStringShort()}`;
    },
    effect3Text() {
      if (this.effect3Time.lte(0)) return `Effect is capped`;
      return `Time to cap: ${TimeSpan.fromHours(this.effect3Time).toStringShort()}`;
    },
    effect4Text() {
      if (this.effect4Time.lte(0)) return `Effect is capped`;
      return `Time to cap: ${TimeSpan.fromHours(this.effect4Time).toStringShort()}`;
    },
    effect5Text() {
      if (this.effect5Time.lte(0)) return `Effect is capped`;
      return `Time to cap: ${TimeSpan.fromHours(this.effect5Time).toStringShort()}`;
    },
    hadronTime() {
      return TimeSpan.fromHours(this.hadronTimer).toStringShort();
    },
    buttonText1() {
      if (this.hasExotic) return `Convert a Hadron and a Dark Hadron into an Exotic Hadron`;
      return `Convert a Hadron into a Dark Hadron`;
    },
    buttonText2() {
      if (this.hasExotic) return `Convert an Exotic Hadron into a Hadron and a Dark Hadron`;
      return `Convert a Dark Hadron into a Hadron`;
    },
    buttonText3() {
      if (this.hasExotic) return `Convert all Hadrons and all Dark Hadrons into Exotic Hadrons`;
      return `Convert all Hadrons into Dark Hadrons`;
    },
    buttonText4() {
      if (this.hasExotic) return `Convert all Exotic Hadrons into Hadrons and Dark Hadrons`;
      return `Convert all Dark Hadrons into Hadrons`;
    },
    extraH1Text() {
      if (SingularityMilestone.hadronEffect1Improvement.isReached) {
        return ` and ${formatPow(SingularityMilestone.hadronEffect1Improvement.effectOrDefault(1), 2, 3)}`;
      }
      return "";
    }
  },
  methods: {
    update() {
      const hadrons = player.celestials.laitela.hadrons;
      this.totalHadrons = hadrons.trueTotal;
      this.lightHadrons = hadrons.light;
      this.darkHadrons = hadrons.dark;
      this.exoticHadrons = hadrons.exotic;
      this.totalLightHadrons = hadrons.totalLight;
      this.totalDarkHadrons = hadrons.totalDark;
      this.totalExoticHadrons = hadrons.totalExotic;
      this.basePercentageCap = (100 * Accelerators.emptiness.effectValue2 + EndgameMastery(251).effectOrDefault(0)) *
        (DivinityMilestone.serpentPower.isReached ? 2 : 1);
      this.percentageCap = (Math.pow(this.basePercentageCap - 100, 2) + 100) / 100;
      this.hadronTimer.copyFrom(Hadrons.timeFactor.div(100));
      this.effect1.copyFrom(Hadrons.singularityMultiplier);
      this.effect2.copyFrom(Hadrons.darkMatterCapMultiplier);
      this.effect3.copyFrom(Hadrons.darkEnergyAscensionBoost);
      this.effect4.copyFrom(Hadrons.entropyFormulaBoost);
      this.effect5.copyFrom(Hadrons.continuumMultiplier);
      this.hasEffect1 = DualityUpgrade(15).isBought;
      this.hasEffect2 = DualityUpgrade(16).isBought;
      this.hasEffect3 = DualityUpgrade(17).isBought;
      this.hasEffect4 = DualityUpgrade(18).isBought;
      this.hasDark = DualityUpgrade(19).isBought;
      this.hasExotic = DivinityMilestone.hadronEmpowerment.isReached;
      this.showWarning = Accelerators.emptiness.effectValue2 > 1;
      this.isFlipped = player.universes.current === 2;
    },
    assignOne() {
      if (this.hasExotic) {
        if (Slabdrill.isCursed) return;
        if (this.lightHadrons <= 0) return;
        Laitela.reset();
        Endgame.resetNoReward();
        player.celestials.laitela.hadrons.light -= 1;
        player.celestials.laitela.hadrons.dark -= 1;
        player.celestials.laitela.hadrons.exotic += 1;
      } else {
        if (this.lightHadrons <= 0) return;
        Laitela.reset();
        finishProcessReality({ reset: true });
        player.celestials.laitela.hadrons.light -= 1;
        player.celestials.laitela.hadrons.dark += 1;
      }
    },
    unassignOne() {
      if (this.hasExotic) {
        if (Slabdrill.isCursed) return;
        if (this.exoticHadrons <= 0) return;
        Laitela.reset();
        Endgame.resetNoReward();
        player.celestials.laitela.hadrons.light += 1;
        player.celestials.laitela.hadrons.dark += 1;
        player.celestials.laitela.hadrons.exotic -= 1;
      } else {
        if (this.darkHadrons <= 0) return;
        Laitela.reset();
        finishProcessReality({ reset: true });
        player.celestials.laitela.hadrons.light += 1;
        player.celestials.laitela.hadrons.dark -= 1;
      }
    },
    assignAll() {
      if (this.hasExotic) {
        if (Slabdrill.isCursed) return;
        if (this.lightHadrons <= 0) return;
        Laitela.reset();
        Endgame.resetNoReward();
        player.celestials.laitela.hadrons.light = 0;
        player.celestials.laitela.hadrons.dark = 0;
        player.celestials.laitela.hadrons.exotic = player.celestials.laitela.hadrons.total;
      } else {
        if (this.lightHadrons <= 0) return;
        Laitela.reset();
        finishProcessReality({ reset: true });
        player.celestials.laitela.hadrons.light = 0;
        player.celestials.laitela.hadrons.dark = player.celestials.laitela.hadrons.total;
      }
    },
    unassignAll() {
      if (this.hasExotic) {
        if (Slabdrill.isCursed) return;
        if (this.exoticHadrons <= 0) return;
        Laitela.reset();
        Endgame.resetNoReward();
        player.celestials.laitela.hadrons.light = player.celestials.laitela.hadrons.total;
        player.celestials.laitela.hadrons.dark = player.celestials.laitela.hadrons.total;
        player.celestials.laitela.hadrons.exotic = 0;
      } else {
        if (this.darkHadrons <= 0) return;
        Laitela.reset();
        finishProcessReality({ reset: true });
        player.celestials.laitela.hadrons.light = player.celestials.laitela.hadrons.total;
        player.celestials.laitela.hadrons.dark = 0;
      }
    }
  }
};
</script>

<template>
  <div class="c-laitela-hadrons-container">
    <div class="c-laitela-hadrons-row">
      <h2>
        <LocalizedText
          id="hadrons.quantity"
          :values="{ resource: $t('terms.lightHadron', {}, totalLightHadrons === 1 ? 'text' : 'plural') }"
        >
          <template #p0>{{ formatHybridSmall(lightHadrons, 3) }}</template>
          <template #p1><span v-if="extraLightHadrons.gt(0)">(+{{ formatHybridSmall(extraLightHadrons, 3) }})</span></template>
        </LocalizedText>
      </h2>
      <h2 v-if="hasDark">
        <LocalizedText
          id="hadrons.quantity"
          :values="{ resource: $t('terms.darkHadrons', {}, totalDarkHadrons === 1 ? 'singular' : 'text') }"
        >
          <template #p0>{{ formatHybridSmall(darkHadrons, 3) }}</template>
          <template #p1><span v-if="extraDarkHadrons.gt(0)">(+{{ formatHybridSmall(extraDarkHadrons, 3) }})</span></template>
        </LocalizedText>
      </h2>
      <h2 v-if="hasExotic">
        <LocalizedText
          id="hadrons.quantity"
          :values="{ resource: $t('terms.exoticHadrons', {}, totalExoticHadrons === 1 ? 'singular' : 'text') }"
        >
          <template #p0>{{ formatHybridSmall(exoticHadrons, 3) }}</template>
          <template #p1><span v-if="extraExoticHadrons.gt(0)">(+{{ formatHybridSmall(extraExoticHadrons, 3) }})</span></template>
        </LocalizedText>
      </h2>
      <br>
      <h2>
        {{ $t('ade.35fac156dd122033', { p0: $legacyText(_s(hadronTime)) }) }}
      </h2>
    </div>
    <div
      v-if="hasEffect1"
      class="c-laitela-hadrons-row"
    >
      <div>
        {{ $t('ade.36b562db9ada5267') }}
      </div>
      <div>
        {{ $t('ade.4d497482fdec886c', { p0: $legacyText(_s(formatX(effect1,2,2))), p1: $legacyText(_s(extraH1Text)) }) }}
      </div>
      <div>
        {{ $legacyText(_s(effect1Text)) }}
      </div>
      <div>
        {{ $t('ade.bbd9c047a98edb8a', { p0: $legacyText(_s(formatDecimalPercents(effect1Percent,2,2))) }) }}
      </div>
    </div>
    <div
      v-if="hasEffect2"
      class="c-laitela-hadrons-row"
    >
      <div>
        {{ $t('ade.8cbd71862f2fbc3d') }}
      </div>
      <div>
        {{ $t('ade.b4c0c23005f2e2e6', { p0: $legacyText(_s(format(effect2,2,2))) }) }}
      </div>
      <div>
        {{ $legacyText(_s(effect2Text)) }}
      </div>
      <div>
        {{ $t('ade.bbd9c047a98edb8a', { p0: $legacyText(_s(formatDecimalPercents(effect2Percent,2,2))) }) }}
      </div>
    </div>
    <div
      v-if="hasEffect3"
      class="c-laitela-hadrons-row"
    >
      <div>
        {{ $t('ade.8fbea77427a17588') }}
      </div>
      <div>
        {{ $t('ade.eee004caba8727f5', { p0: $legacyText(_s(format(effect3,2,2))) }) }}
      </div>
      <div>
        {{ $legacyText(_s(effect3Text)) }}
      </div>
      <div>
        {{ $t('ade.bbd9c047a98edb8a', { p0: $legacyText(_s(formatDecimalPercents(effect3Percent,2,2))) }) }}
      </div>
    </div>
    <div
      v-if="hasEffect4"
      class="c-laitela-hadrons-row"
    >
      <div>
        {{ $t('ade.95a4e136ebdd7363') }}
      </div>
      <div>
        {{ $t('hadrons.entropy', { resource: $t(isFlipped ? 'terms.matter' : 'terms.antimatter', {}, 'alias1'), amount: formatX(effect4, 2, 2) }) }}
      </div>
      <div>
        {{ $legacyText(_s(effect4Text)) }}
      </div>
      <div>
        {{ $t('ade.bbd9c047a98edb8a', { p0: $legacyText(_s(formatDecimalPercents(effect4Percent,2,2))) }) }}
      </div>
    </div>
    <div
      v-if="hasDark"
      class="c-laitela-hadrons-row"
    >
      <div>
        {{ $t('ade.e0a45a6720feca07') }}
      </div>
      <div>
        {{ $t('ade.5333fa9687d6857a', { p0: $legacyText(_s(format(effect5,2,2))) }) }}
      </div>
      <div>
        {{ $legacyText(_s(effect5Text)) }}
      </div>
      <div>
        {{ $t('ade.bbd9c047a98edb8a', { p0: $legacyText(_s(formatDecimalPercents(effect5Percent,2,2))) }) }}
      </div>
    </div>
    <div
      v-if="hasDark"
      class="c-laitela-hadrons-row"
    >
      <button
        class="c-laitela-hadrons-assign"
        :class="{ 'c-laitela-hadrons-assign--available' : lightHadrons > 0 }"
        @click="assignOne"
      >
        {{ $legacyText(_s(buttonText1)) }}
      </button>
      <button
        class="c-laitela-hadrons-assign"
        :class="{ 'c-laitela-hadrons-assign--available' : (hasExotic ? exoticHadrons > 0 : darkHadrons > 0) }"
        @click="unassignOne"
      >
        {{ $legacyText(_s(buttonText2)) }}
      </button>
      <button
        class="c-laitela-hadrons-assign"
        :class="{ 'c-laitela-hadrons-assign--available' : lightHadrons > 0 }"
        @click="assignAll"
      >
        {{ $legacyText(_s(buttonText3)) }}
      </button>
      <button
        class="c-laitela-hadrons-assign"
        :class="{ 'c-laitela-hadrons-assign--available' : (hasExotic ? exoticHadrons > 0 : darkHadrons > 0) }"
        @click="unassignAll"
      >
        {{ $legacyText(_s(buttonText4)) }}
      </button>
    </div>
    <div
      v-if="showWarning"
      class="c-laitela-warning"
    >
      {{ $t('ade.6050cf2bae716d78', { p0: $legacyText(_s(formatPercents(1))) }) }}
    </div>
  </div>
</template>

<style scoped>
.c-laitela-hadrons-assign {
  margin: 0 0.3rem 1rem;
}

.c-laitela-warning {
  color: red;
}
</style>
