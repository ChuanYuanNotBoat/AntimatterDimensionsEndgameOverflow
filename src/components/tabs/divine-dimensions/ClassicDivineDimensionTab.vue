<script>
import DivineDimensionRow from "./ClassicDivineDimensionRow";
import PrimaryButton from "@/components/PrimaryButton";

export default {
  name: "ClassicDivineDimensionTab",
  components: {
    PrimaryButton,
    DivineDimensionRow
  },
  data() {
    return {
      divineMatter: new Decimal(0),
      divineEnergy: new Decimal(0),
      matterPerSecond: new Decimal(0),
      energyPerSecond: new Decimal(0),
      incomeType: "",
      dispBoth: false,
      conversionFormula1: new Decimal(0),
      conversionFormula2: 0,
      conversionFormula3: 0,
      hardcap: new Decimal(0),
      creditsClosed: false,
      canProduceEnergy: false,
      isProducingEnergy: false,
      isAnyAutobuyerUnlocked: false,
      isFlipped: false
    };
  },
  computed: {
    changeProdDisplay() {
      return this.isProducingEnergy
        ? "Produce Divine Matter"
        : "Produce Divine Energy";
    },
    currencyProd() {
      return this.isProducingEnergy
        ? `${format(this.energyPerSecond, 2, 2)}`
        : `${format(this.matterPerSecond, 2, 0)}`;
    },
  },
  methods: {
    update() {
      this.divineMatter.copyFrom(Currency.divineMatter);
      this.divineEnergy.copyFrom(Currency.divineEnergy);
      this.matterPerSecond.copyFrom(DivineDimension(1).productionPerRealSecond);
      this.energyPerSecond.copyFrom(DivineDimensions.energyPerSecond);
      this.incomeType = player.celestials.pelle.divinity.isProducingEnergy ? "Divine Energy" : "Divine Matter";
      this.dispBoth = DivinityUpgrade.divineL2U10.isBought;
      this.conversionFormula1 = DivineDimensions.conversionFormula1;
      this.conversionFormula2 = DivineDimensions.conversionFormula2;
      this.conversionFormula3 = DivineDimensions.conversionFormula3;
      this.hardcap.copyFrom(DivineDimensions.HARDCAP);
      this.creditsClosed = GameEnd.creditsEverClosed;
      this.canProduceEnergy = DivinityUpgrade.divineL1U5.isBought;
      this.isProducingEnergy = player.celestials.pelle.divinity.isProducingEnergy;
      this.isAnyAutobuyerUnlocked = Autobuyer.divineDimension(1).isUnlocked;
      this.isFlipped = player.universes.current === 2;
    },
    maxAll() {
      DivineDimensions.buyMax();
    },
    shiftProd() {
      player.celestials.pelle.divinity.isProducingEnergy = !player.celestials.pelle.divinity.isProducingEnergy;
    },
    toggleAllAutobuyers() {
      toggleAllDivDims();
    }
  }
};
</script>

<template>
  <div class="l-divine-dim-tab">
    <div class="c-subtab-option-container">
      <PrimaryButton
        class="o-primary-btn--subtab-option"
        @click="maxAll"
      >
        {{ $t('ade.5fd68fd3aca6ea9f') }}
      </PrimaryButton>
      <PrimaryButton
        v-if="isAnyAutobuyerUnlocked"
        class="o-primary-btn--subtab-option"
        @click="toggleAllAutobuyers"
      >
        {{ $t('ade.df61aae1ac373e48') }}
      </PrimaryButton>
    </div>
    <div v-if="canProduceEnergy">
      <LocalizedText id="ade.859c3f53618d609a">
        <template #p0><span class="c-divine-dim-description__accent">{{ $legacyText(_s(format(divineEnergy, 2, 1))) }}</span></template>
      </LocalizedText>
    </div>
    <div>
      <p>
        {{ $t('ade.9f717812b3aa8e61') }}
        <span class="c-celestial-dim-description__accent">{{ $legacyText(_s(format(divineMatter, 2, 1))) }}</span>
        {{ $t('ade.08590c76298b730f') }}
        <br>
        {{ $t('ade.a6c4c6c292cd65e2') }}
        <span class="c-divine-dim-description__accent">{{ $legacyText(_s(formatX(conversionFormula1, 2, 2))) }}</span>
        {{ $t('ade.afe193dd9dce226c') }}
        <span class="c-divine-dim-description__accent">{{ $legacyText(_s(formatPow(conversionFormula2, 2, 3))) }}</span>
        to {{ $legacyText(_s(isFlipped ? "Matter" : "Antimatter")) }} Exponent while Doomed and all Machines, and a
        <span class="c-divine-dim-description__accent">{{ $legacyText(_s(formatPercents(conversionFormula3, 2, 2))) }}</span>
        reduction to Hadron and Remnants of Alpha Decay cap times.
      </p>
    </div>
    <div>{{ $t('ade.7d14632ac8e06f9a', { p0: $legacyText(_s(format(hardcap,2,0))) }) }}</div>
    <div v-if="!dispBoth">{{ $t('ade.d6f6a1aba24ec060', { p0: $legacyText(_s(currencyProd)), p1: $legacyText(_s(incomeType)) }) }}</div>
    <div v-if="dispBoth">
      <div>{{ $t('ade.b592c0a6ae2351c1', { p0: $legacyText(_s(format(matterPerSecond,2,0))) }) }}</div>
      <div>{{ $t('ade.134f7c5f1dfc60e0', { p0: $legacyText(_s(format(energyPerSecond,2,2))) }) }}</div>
    </div>
    <PrimaryButton
      v-if="canProduceEnergy && !dispBoth"
      class="o-primary-btn--subtab-option"
      @click="shiftProd"
    >
      {{ $legacyText(_s(changeProdDisplay)) }}
    </PrimaryButton>
    <div class="l-dimensions-container">
      <DivineDimensionRow
        v-for="tier in 8"
        :key="tier"
        :tier="tier"
      />
    </div>
  </div>
</template>
