<script>
import CelestialDimensionBoostRow from "./ModernCelestialDimensionBoostRow";
import CelestialDimensionRow from "./ModernCelestialDimensionRow";
import CelestialGalaxyRow from "./ModernCelestialGalaxyRow";
import CelestialTickspeedRow from "./CelestialTickspeedRow";
import PrimaryButton from "@/components/PrimaryButton";

export default {
  name: "ModernCelestialDimensionTab",
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
      unnerfedCelestialMatter: new Decimal(0),
      dimMultiplier: new Decimal(0),
      matterPerSecond: new Decimal(0),
      incomeType: "",
      conversionExponent: 0,
      nextDimCapIncrease: 0,
      totalDimCap: new Decimal(0),
      creditsClosed: false,
      showLockedDimCostNote: true,
      softcapPow: 0,
      softcap: new Decimal(0),
      unstable: false,
      overflowMag: 0,
      overflow: new Decimal(0),
      isOverflowing: false,
      massOverflowMag: 0,
      massOverflow: new Decimal(0),
      isCorrupted: false,
      isEffectActive: false,
      collapsedInfo: false,
      anySoftcapApplicable: false,
      everSeenSoftcaps: false,
      alphaDecayRemnant: 0,
      hasRemnant: false,
      isExpanded: false,
      canCrunch: false,
      isBroken: false,
      hasInfinities: false,
      infinityPoints: new Decimal(0),
      isAnyAutobuyerUnlocked: false,
      timeToCap: new Decimal(0),
      hasEternities: false,
      eternityPoints: new Decimal(0),
    };
  },
  computed: {
    softcapCollapseDisplay() {
      return this.collapsedInfo
        ? "Show softcap information"
        : "Hide softcap information";
    },
    timeToCapText() {
      return TimeSpan.fromHours(this.timeToCap).toStringShort();
    }
  },
  methods: {
    update() {
      this.showLockedDimCostNote = !CelestialDimension(8).isUnlocked;
      this.celestialMatter.copyFrom(Currency.celestialMatter);
      this.unnerfedCelestialMatter.copyFrom(Currency.unnerfedCelestialMatter);
      this.conversionExponent = CelestialDimensions.conversionExponent;
      this.dimMultiplier.copyFrom(this.celestialMatter.pow(this.conversionExponent).max(1));
      this.matterPerSecond.copyFrom(CelestialDimension(1).productionPerSecond);
      this.incomeType = "Celestial Matter";
      this.totalDimCap.copyFrom(CelestialDimensions.totalDimCap);
      this.creditsClosed = GameEnd.creditsEverClosed;
      this.softcapPow = CelestialDimensions.softcapPow;
      this.softcap.copyFrom(CelestialDimensions.SOFTCAP);
      this.unstable = this.celestialMatter.gte(this.softcap);
      this.overflowMag = CelestialDimensions.OVERFLOW_MAG;
      this.overflow.copyFrom(CelestialDimensions.OVERFLOW);
      this.isOverflowing = this.celestialMatter.gt(this.overflow);
      this.massOverflowMag = CelestialDimensions.MASS_OVERFLOW_MAG;
      this.massOverflow.copyFrom(CelestialDimensions.MASS_OVERFLOW);
      this.isCorrupted = this.celestialMatter.gt(this.massOverflow);
      this.isEffectActive = player.endgame.celestialMatterMultiplier.isActive;
      this.collapsedInfo = player.endgame.celDimExpansion.softcapsCollapsed;
      this.anySoftcapApplicable = this.unstable || this.isOverflowing || this.isCorrupted;
      this.everSeenSoftcaps = player.records.totalCelMatter.gte(DC.E100);
      this.alphaDecayRemnant = CelestialDimensions.alphaDecayRemnant;
      this.hasRemnant = Alpha.isDestroyed;
      this.isExpanded = Achievement(221).isUnlocked;
      this.canCrunch = Currency.celestialMatter.value.gte(DC.NUMMAX) && this.isExpanded;
      this.isBroken = player.endgame.celDimExpansion.isBroken;
      this.hasInfinities = PlayerProgress.celestialInfinityUnlocked();
      this.infinityPoints.copyFrom(player.endgame.celDimExpansion.celestialInfinityPoints);
      this.isAnyAutobuyerUnlocked = Autobuyer.celestialDimension(1).isUnlocked;
      this.timeToCap.copyFrom(DC.D5.times(CelestialDimensions.alphaDecaySpeed));
      this.hasEternities = PlayerProgress.celestialEternityUnlocked();
      this.eternityPoints.copyFrom(player.endgame.celDimExpansion.celestialEternityPoints);
    },
    maxAll() {
      CelestialDimensions.buyMax();
    },
    toggleCelestialMatterMultiplier() {
      toggleCelestialMatter();
    },
    toggleAllAutobuyers() {
      toggleAllCelDims();
    },
    instabilityClassObject() {
      return {
        "c-celestial-dim-description__accent": !this.anySoftcapApplicable,
        "c-celestial-dim-description__accent-unstable": this.anySoftcapApplicable,
      };
    },
    toggleSeenSoftcaps() {
      player.endgame.celDimExpansion.softcapsCollapsed = !player.endgame.celDimExpansion.softcapsCollapsed;
    },
    celestialCrunch() {
      if (PlayerProgress.celestialInfinityUnlocked()) celestialCrunchResetRequest();
      else Modal.celestialCrunch.show();
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
    <div v-if="!canCrunch || isBroken">
      <div>
        <p>
          <span v-if="hasEternities">
            <LocalizedText id="ade.f60d34517f5e10f6">
              <template #p0><span class="c-celestial-eternity-text">{{ $legacyText(_s(format(eternityPoints, 2))) }}</span></template>
              <template #p1>{{ $legacyText(_s(pluralize("Celestial Eternity Point",eternityPoints))) }}</template>
            </LocalizedText>
          </span>
          <br>
          <span v-if="hasInfinities">
            <LocalizedText id="ade.f60d34517f5e10f6">
              <template #p0><span class="c-celestial-infinity-text">{{ $legacyText(_s(format(infinityPoints, 2))) }}</span></template>
              <template #p1>{{ $legacyText(_s(pluralize("Celestial Infinity Point",infinityPoints))) }}</template>
            </LocalizedText>
          </span>
          <br>
          {{ $t('ade.9f717812b3aa8e61') }}
          <span :class="instabilityClassObject()">{{ $legacyText(_s(format(celestialMatter, 2, 1))) }}</span>
          <span v-if="unstable"> {{ $t('ade.816bffc1f16b2797') }}</span><span v-if="isOverflowing"> {{ $t('ade.99a058861fb42e49') }}</span>
          <span v-if="isCorrupted"> {{ $t('ade.771527899b30da13') }}</span> {{ $t('ade.1970f2378734f1ed') }}
          <br>
          <span>
            {{ $t('ade.1ae19de65afe57e7') }}
            <span :class="instabilityClassObject()">{{ $legacyText(_s(formatPow(conversionExponent, 2, 3))) }}</span>
          </span>
          {{ $t('ade.78738e88cda9fee1') }}
          <span :class="instabilityClassObject()">
            {{ $legacyText(_s(formatX(dimMultiplier, 2, 1))) }}<span v-if="!isEffectActive"> (Disabled)</span>
          </span>
          {{ $t('ade.18388a22507a9dbf') }}
          <span>{{ $t('ade.0a01db022efb97a1') }}</span>
          <div v-if="everSeenSoftcaps">
            <div v-if="!collapsedInfo">
              <div v-if="unstable">
                <LocalizedText id="ade.e0ea7be801bc08e9">
                  <template #p0><i>{{ $t('ade.b313df7964697b61') }}</i></template>
                  <template #p1><span :class="instabilityClassObject()">{{ $legacyText(_s(format(unnerfedCelestialMatter, 2, 1))) }}</span></template>
                  <template #p2><br></template>
                  <template #p3><span :class="instabilityClassObject()">{{ $legacyText(_s(format(softcap, 2, 1))) }}</span></template>
                  <template #p4><br></template>
                  <template #p5><span :class="instabilityClassObject()">{{ $legacyText(_s(format(1 / softcapPow, 2, 3))) }}</span></template>
                  <template #p6><br></template>
                  <template #p7><span :class="instabilityClassObject()">{{ $legacyText(_s(format(softcapPow, 2, 3))) }}</span></template>
                </LocalizedText>
              </div>
              <div v-if="isOverflowing">
                <LocalizedText id="ade.5690b4efb8bc4fd0">
                  <template #p0><span :class="instabilityClassObject()">{{ $legacyText(_s(format(overflow, 2, 1))) }}</span></template>
                  <template #p1><i>{{ $t('ade.52f9208b2747e72e') }}</i></template>
                  <template #p2><br></template>
                  <template #p3><span :class="instabilityClassObject()">{{ $legacyText(_s(format(1 / overflowMag, 2, 3))) }}</span></template>
                  <template #p4><br></template>
                  <template #p5><span :class="instabilityClassObject()">{{ $legacyText(_s(format(overflowMag, 2, 3))) }}</span></template>
                </LocalizedText>
              </div>
              <div v-if="isCorrupted">
                <LocalizedText id="ade.5c468cbac694bd9f">
                  <template #p0><span :class="instabilityClassObject()">{{ $legacyText(_s(format(massOverflow, 2, 1))) }}</span></template>
                  <template #p1><i>{{ $t('ade.d7c2ed0c81a0c454') }}</i></template>
                  <template #p2><br></template>
                  <template #p3><span :class="instabilityClassObject()">{{ $legacyText(_s(format(1 / massOverflowMag, 2, 3))) }}</span></template>
                  <template #p4><br></template>
                  <template #p5><span :class="instabilityClassObject()">{{ $legacyText(_s(format(massOverflowMag, 2, 3))) }}</span></template>
                </LocalizedText>
              </div>
            </div>
            <PrimaryButton
              class="o-primary-btn--subtab-option"
              @click="toggleSeenSoftcaps"
            >
              {{ $legacyText(_s(softcapCollapseDisplay)) }}
            </PrimaryButton>
          </div>
        </p>
      </div>
      <div v-if="hasRemnant">
        <LocalizedText id="ade.a787f372eae57635">
          <template #p0><span class="c-celestial-dim-description__accent-unstable">{{ $legacyText(_s(format(alphaDecayRemnant, 2, 3))) }}</span></template>
          <template #p1>{{ $legacyText(_s(formatInt(1))) }}</template>
          <template #p2>{{ $legacyText(_s(timeToCapText)) }}</template>
        </LocalizedText>
      </div>
      <div>
        {{ $t('ade.ffa4319dba6c562a', { p0: $legacyText(_s(format(totalDimCap,2,2))) }) }}
      </div>
      <div>{{ $t('ade.d6f6a1aba24ec060', { p0: $legacyText(_s(format(matterPerSecond,2,0))), p1: $legacyText(_s(incomeType)) }) }}</div>
    </div>
    <div v-if="canCrunch && !isBroken">
      <br>
      <button
        :class="{
          'btn-celestial-crunch': true
        }"
        @click="celestialCrunch"
      >
        {{ $t('ade.9fbc6371e62a7fef') }}
      </button>
      <br>
      <br>
    </div>
    <CelestialTickspeedRow v-if="isExpanded"/>
    <div class="l-dimensions-container">
      <CelestialDimensionRow
        v-for="tier in 8"
        :key="tier"
        :tier="tier"
      />
    </div>
    <div
      v-if="isExpanded"
      class="resets-container"
    >
      <CelestialDimensionBoostRow v-if="isExpanded"/>
      <CelestialGalaxyRow v-if="isExpanded"/>
    </div>
    <div v-if="showLockedDimCostNote">
      {{ $t('ade.2563bc10ad33d8f9') }}
    </div>
  </div>
</template>

<style scoped>
.c-celestial-infinity-text {
  font-size: 3.5rem;
  font-weight: bold;
  background: linear-gradient(var(--color-infinity), var(--color-celestials));
  background-clip: text;

  -webkit-text-fill-color: transparent;
}

.c-celestial-eternity-text {
  font-size: 3.5rem;
  font-weight: bold;
  background: linear-gradient(var(--color-eternity), var(--color-celestials));
  background-clip: text;

  -webkit-text-fill-color: transparent;
}
</style>
