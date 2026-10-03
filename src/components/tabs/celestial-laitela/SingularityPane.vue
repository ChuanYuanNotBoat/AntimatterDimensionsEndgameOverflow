<script>
export default {
  name: "SingularityPane",
  data() {
    return {
      darkEnergy: new Decimal(),
      darkEnergyGainPerSecond: new Decimal(),
      singularities: new Decimal(),
      singularityCapIncreases: new Decimal(),
      canPerformSingularity: false,
      unlockedBulkSingularity: false,
      singularityCap: new Decimal(),
      baseTimeToSingularity: new Decimal(),
      currentTimeToSingularity: new Decimal(),
      extraTimeAfterSingularity: new Decimal(),
      singularitiesGained: new Decimal(),
      autoSingularityFactor: 0,
      perStepFactor: new Decimal(),
      isAutoEnabled: false,
      hasAutoSingularity: false,
      nextLowerStep: new Decimal(),
      willCondenseOnDecrease: false,
    };
  },
  computed: {
    isDoomed: () => Pelle.isDoomed && !PelleDestructionUpgrade.singularityMilestones.canBeApplied,
    singularityFormText() {
      const formText = this.singularitiesGained.eq(1) ? "all Dark Energy into a Singularity"
        : `all Dark Energy into ${quantify("Singularity", this.singularitiesGained, 2)}`;
      if (this.canPerformSingularity) {
        return `Condense ${formText}`;
      }
      return `Reach ${format(this.singularityCap)} Dark Energy to condense ${formText}`;
    },
    singularityWaitText() {
      let singularityTime = this.currentTimeToSingularity;
      if (this.canPerformSingularity) {
        singularityTime = singularityTime.add(this.extraTimeAfterSingularity);
        if (!this.isAutoEnabled) return "";
        return singularityTime.gt(0)
          ? `(Auto-condensing in ${TimeSpan.fromSeconds(new Decimal(singularityTime)).toStringShort()})`
          : "(Will immediately auto-condense)";
      }
      return `(Enough Dark Energy in ${TimeSpan.fromSeconds(new Decimal(singularityTime)).toStringShort()})`;
    },
    baseSingularityTime() {
      return TimeSpan.fromSeconds(new Decimal(this.baseTimeToSingularity)).toStringShort();
    },
    additionalSingularityTime() {
      return TimeSpan.fromSeconds(new Decimal(this.extraTimeAfterSingularity)).toStringShort();
    },
    manualSingularityRate() {
      const totalTime = this.baseTimeToSingularity;
      return this.formatRate(this.singularitiesGained.div(totalTime));
    },
    autoSingularityRate() {
      if (this.hasAutoSingularity && !this.isAutoEnabled) return "Auto-Singularity is OFF";
      const totalTime = this.baseTimeToSingularity.add(this.extraTimeAfterSingularity);
      return this.formatRate(this.singularitiesGained.div(totalTime));
    },
    decreaseTooltip() {
      if (this.singularityCapIncreases.eq(0)) return "You cannot decrease the cap any further!";
      const singularities = this.singularitiesGained.div(this.perStepFactor);
      return this.willCondenseOnDecrease
        ? `Decreasing the cap will immediately auto-condense for
          ${quantify("Singularity", singularities, 2)}!`
        : null;
    },
    increaseTooltip() {
      return this.singularityCapIncreases.gte(5e11)
        ? `The cap over 5e11 is more stronger. ${formatX(Decimal.pow10(new Decimal(this.singularityCapIncreases.log(10)).sub(10).floor()), 2, 2)}`
        : null;
    }
  },
  methods: {
    update() {
      const laitela = player.celestials.laitela;
      this.darkEnergy.copyFrom(Currency.darkEnergy.value);
      this.darkEnergyGainPerSecond.copyFrom(Currency.darkEnergy.productionPerSecond);
      this.singularities.copyFrom(Currency.singularities.value);
      this.singularityCapIncreases.copyFrom(laitela.singularityCapIncreases);
      this.canPerformSingularity = Singularity.capIsReached;
      this.unlockedBulkSingularity = Currency.singularities.gte(10);
      this.singularityCap.copyFrom(Singularity.cap);
      this.baseTimeToSingularity.copyFrom(Singularity.timePerCondense);
      this.currentTimeToSingularity.copyFrom(Singularity.timeUntilCap);
      this.extraTimeAfterSingularity.copyFrom(Singularity.timeDelayFromAuto);
      this.singularitiesGained.copyFrom(Singularity.singularitiesGained);
      this.autoSingularityFactor = SingularityMilestone.autoCondense.effectOrDefault(Infinity);
      this.perStepFactor.copyFrom(Singularity.gainPerCapIncrease);
      this.isAutoEnabled = player.auto.singularity.isActive && SingularityMilestone.autoCondense.canBeApplied;
      this.hasAutoSingularity = Number.isFinite(this.autoSingularityFactor);
      this.nextLowerStep.copyFrom(this.singularityCap.mul(this.autoSingularityFactor).div(10));
      this.willCondenseOnDecrease = this.isAutoEnabled && this.darkEnergy.gt(this.nextLowerStep);
    },
    doSingularity() {
      Singularity.perform();
    },
    increaseCap() {
      Singularity.increaseCap();
    },
    decreaseCap() {
      Singularity.decreaseCap();
    },
    formatRate(rate) {
      if (rate.lt(1 / 60)) return `${format(rate.mul(3600), 2, 3)} per hour`;
      if (rate.lt(1)) return `${format(rate.mul(60), 2, 3)} per minute`;
      return `${format(rate, 2, 3)} per second`;
    },
    condenseClassObject() {
      return {
        "c-laitela-singularity": true,
        "c-laitela-singularity--active": this.canPerformSingularity && !this.isDoomed,
        "o-pelle-disabled": this.isDoomed,
        "o-pelle-disabled-pointer": this.isDoomed,
      };
    }
  }
};
</script>

<template>
  <div class="c-laitela-singularity-container">
    <div>
      <h2>
        {{ $t('ade.8a4c1cc246fcf97f', { p0: $legacyText(_s(quantify("Singularity",singularities,2))) }) }}
      </h2>
      <button
        :class="condenseClassObject()"
        @click="doSingularity"
      >
        <h2>
          {{ $legacyText(_s(singularityFormText)) }}
        </h2>
        <br v-if="singularityWaitText !== ''">
        <h2>
          {{ $legacyText(_s(singularityWaitText)) }}
        </h2>
      </button>
    </div>
    <div v-if="singularities.neq(0)">
      <div class="o-laitela-matter-amount">
        {{ $t('ade.6e45033fffb25fa2', { p0: $legacyText(_s(format(darkEnergy,2,4))), p1: $legacyText(_s(format(darkEnergyGainPerSecond,2,4))) }) }}
      </div>
      <div v-if="unlockedBulkSingularity">
        <button
          class="c-laitela-singularity__cap-control"
          :class="{ 'c-laitela-singularity__cap-control--available' : singularityCapIncreases.gt(0) }"
          :ach-tooltip="$legacyText(decreaseTooltip)"
          @click="decreaseCap"
        >
          {{ $t('ade.1b34a8ba7b44941b') }}
        </button>
        <button
          class="c-laitela-singularity__cap-control"
          :class="{ 'c-laitela-singularity__cap-control--available' : true }"
          :ach-tooltip="$legacyText(increaseTooltip)"
          @click="increaseCap"
        >
          {{ $t('ade.a32c69f759e87c22') }}
        </button>
        <br>
        Each step increases the required Dark Energy by {{ $legacyText(_s(formatX(10))) }},
        <br>
        but also increases gained Singularities by {{ $legacyText(_s(formatX(perStepFactor))) }}.
      </div>
      <div v-else>
        <LocalizedText id="ade.50cc519c47259e81">
    <template #p0><br></template>
    <template #p1>{{ $legacyText(_s(format(10))) }}</template>
    <template #p2><br></template>
    <template #p3><br></template>
  </LocalizedText>
      </div>
      <br>
      Total time to <span v-if="hasAutoSingularity">{{ $t('ade.5438e492b69b7718') }}</span>condense:
      {{ $legacyText(_s(baseSingularityTime)) }}
      <span v-if="hasAutoSingularity && autoSingularityFactor !== 1">
        (+{{ $legacyText(_s(additionalSingularityTime)) }})
      </span>
      <br>
      <span v-if="hasAutoSingularity && autoSingularityFactor !== 1">{{ $t('ade.28bc2dfd0706a09a') }} </span>
      Singularity gain rate: {{ $legacyText(_s(manualSingularityRate)) }}
      <br>
      <span v-if="hasAutoSingularity && autoSingularityFactor !== 1">
        {{ $t('ade.dfcf46ec8de48021', { p0: $legacyText(_s(autoSingularityRate)) }) }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.c-laitela-singularity__cap-control {
  margin: 0 0.3rem 1rem;
}
</style>
