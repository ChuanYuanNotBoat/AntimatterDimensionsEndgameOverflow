<script>
import CelestialDimensionBoostRow from "./ClassicCelestialDimensionBoostRow";
import CelestialDimensionRow from "./ClassicCelestialDimensionRow";
import CelestialGalaxyRow from "./ClassicCelestialGalaxyRow";
import CelestialTickspeedRow from "./CelestialTickspeedRow";
import PrimaryButton from "@/components/PrimaryButton";

export default {
  name: "ClassicCelestialDimensionTab",
  components: {
    PrimaryButton,
    CelestialDimensionBoostRow,
    CelestialDimensionRow,
    CelestialGalaxyRow,
    CelestialTickspeedRow
  },
  data() {
    return {
      celestialMatter: new Decimal(0),
      dimMultiplier: new Decimal(0),
      matterPerSecond: new Decimal(0),
      incomeType: "",
      conversionExponent: 0,
      nextDimCapIncrease: 0,
      totalDimCap: new Decimal(0),
      creditsClosed: false,
      showLockedDimCostNote: true,
      isEffectActive: false,
      isExpanded: false,
      isAnyAutobuyerUnlocked: false,
    };
  },
  methods: {
    update() {
      this.showLockedDimCostNote = !CelestialDimension(8).isUnlocked;
      this.celestialMatter.copyFrom(Currency.celestialMatter);
      this.conversionExponent = CelestialDimensions.conversionExponent;
      this.dimMultiplier.copyFrom(this.celestialMatter.pow(this.conversionExponent).max(1));
      this.matterPerSecond.copyFrom(CelestialDimension(1).productionPerSecond);
      this.incomeType = "Celestial Matter";
      this.totalDimCap.copyFrom(CelestialDimensions.totalDimCap);
      this.creditsClosed = GameEnd.creditsEverClosed;
      this.isEffectActive = player.endgame.celestialMatterMultiplier.isActive;
      this.isExpanded = Achievement(221).isUnlocked;
      this.isAnyAutobuyerUnlocked = Autobuyer.celestialDimension(1).isUnlocked;
    },
    maxAll() {
      CelestialDimensions.buyMax();
    },
    toggleCelestialMatterMultiplier() {
      toggleCelestialMatter();
    },
    toggleAllAutobuyers() {
      toggleAllCelDims();
    }
  }
};
</script>

<template>
  <div class="l-celestial-dim-tab">
    <div class="c-subtab-option-container">
      <PrimaryButton
        class="o-primary-btn--subtab-option"
        @click="maxAll"
      >
        {{ $t('ade.5fd68fd3aca6ea9f') }}
      </PrimaryButton>
      <PrimaryButton
        class="o-primary-btn--subtab-option"
        @click="toggleCelestialMatterMultiplier"
      >
        {{ $t('ade.1d488751b0b3fd49') }}
      </PrimaryButton>
      <PrimaryButton
        v-if="isAnyAutobuyerUnlocked"
        class="o-primary-btn--subtab-option"
        @click="toggleAllAutobuyers"
      >
        {{ $t('ade.df61aae1ac373e48') }}
      </PrimaryButton>
    </div>
    <div>
      <p>
        <LocalizedText id="ade.9cf6f0fffcfca55c">
          <template #p0><span class="c-celestial-dim-description__accent">{{ $legacyText(_s(format(celestialMatter, 2, 1))) }}</span></template>
          <template #p1><span v-if="!isEffectActive"> {{ $t('ade.9fd26eab7df63cd3') }}</span></template>
          <template #p2><br></template>
          <template #p3><span>
          {{ $t('ade.3b32181c27401525') }}
          <span class="c-celestial-dim-description__accent">{{ $legacyText(_s(formatPow(conversionExponent, 2, 3))) }}</span>
        </span></template>
          <template #p4><span class="c-celestial-dim-description__accent">{{ $legacyText(_s(formatX(dimMultiplier, 2, 1))) }}</span></template>
          <template #p5><span>{{ $t('ade.0a01db022efb97a1') }}</span></template>
        </LocalizedText>
      </p>
    </div>
    <div>
      {{ $t('ade.d5e3aa3576a44d7f', { p0: $legacyText(_s(format(totalDimCap,2,2))) }) }}
    </div>
    <div>{{ $t('ade.d6f6a1aba24ec060', { p0: $legacyText(_s(format(matterPerSecond,2,0))), p1: $legacyText(_s(incomeType)) }) }}</div>
    <CelestialTickspeedRow v-if="isExpanded"/>
    <div class="l-dimensions-container">
      <CelestialDimensionRow
        v-for="tier in 8"
        :key="tier"
        :tier="tier"
      />
      <CelestialDimensionBoostRow v-if="isExpanded"/>
      <CelestialGalaxyRow v-if="isExpanded"/>
    </div>
    <div v-if="showLockedDimCostNote">
      {{ $t('ade.2563bc10ad33d8f9') }}
    </div>
  </div>
</template>
