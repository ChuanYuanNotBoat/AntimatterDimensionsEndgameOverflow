<script>
import InfinityDimensionRow from "./ClassicInfinityDimensionRow";
import PrimaryButton from "@/components/PrimaryButton";

export default {
  name: "ClassicInfinityDimensionsTab",
  components: {
    PrimaryButton,
    InfinityDimensionRow
  },
  data() {
    return {
      infinityPower: new Decimal(0),
      dimMultiplier: new Decimal(0),
      powerPerSecond: new Decimal(0),
      incomeType: "",
      isEC8Running: false,
      EC8PurchasesLeft: 0,
      isEC9Running: false,
      isEnslavedRunning: false,
      isAnyAutobuyerUnlocked: false,
      conversionRate: 0,
      nextDimCapIncrease: new Decimal(0),
      tesseractCost: new Decimal(0),
      totalDimCap: new Decimal(0),
      canBuyTesseract: false,
      enslavedCompleted: false,
      boughtTesseracts: 0,
      extraTesseracts: 0,
      creditsClosed: false,
      showLockedDimCostNote: true,
      isFlipped: false
    };
  },
  computed: {
    tesseractCountString() {
      const extra = this.extraTesseracts > 0 ? ` + ${format(this.extraTesseracts, 2, 2)}` : "";
      return `${formatHybridSmall(this.boughtTesseracts, 3)}${extra}`;
    },
  },
  methods: {
    update() {
      this.showLockedDimCostNote = !InfinityDimension(8).isUnlocked;
      this.isEC9Running = EternityChallenge(9).isRunning;
      this.infinityPower.copyFrom(Currency.infinityPower);
      this.conversionRate = InfinityDimensions.powerConversionRate;
      if (this.isEC9Running) {
        this.dimMultiplier.copyFrom(Decimal.pow(Decimal.max(this.infinityPower.add(1).log2(), 1), 4).max(1));
      } else {
        this.dimMultiplier.copyFrom(this.infinityPower.pow(this.conversionRate).max(1));
      }
      this.powerPerSecond.copyFrom(InfinityDimension(1).productionPerRealSecond);
      this.incomeType = EternityChallenge(7).isRunning ? "Seventh Dimensions" : "Infinity Power";
      this.isEC8Running = EternityChallenge(8).isRunning;
      if (this.isEC8Running) {
        this.EC8PurchasesLeft = player.eterc8ids;
      }
      this.isEnslavedRunning = Enslaved.isRunning;
      this.isAnyAutobuyerUnlocked = Autobuyer.infinityDimension(1).isUnlocked;
      this.nextDimCapIncrease.copyFrom(Tesseracts.nextTesseractIncrease);
      this.tesseractCost.copyFrom(Tesseracts.nextCost);
      this.totalDimCap.copyFrom(InfinityDimensions.totalDimCap);
      this.canBuyTesseract = Tesseracts.canBuyTesseract;
      this.enslavedCompleted = Enslaved.isCompleted && !player.disablePostReality;
      this.boughtTesseracts = Tesseracts.bought;
      this.extraTesseracts = Tesseracts.extra;
      this.creditsClosed = GameEnd.creditsEverClosed;
      this.isFlipped = player.universes.current === 2;
    },
    maxAll() {
      InfinityDimensions.buyMax();
    },
    toggleAllAutobuyers() {
      toggleAllInfDims();
    },
    buyTesseract() {
      Tesseracts.buyTesseract();
    }
  }
};
</script>

<template>
  <div class="l-infinity-dim-tab">
    <div class="c-subtab-option-container">
      <PrimaryButton
        v-if="!isEC8Running"
        class="o-primary-btn--subtab-option"
        @click="maxAll"
      >
        {{ $t('ade.4df159d13ecdd149') }}
      </PrimaryButton>
      <PrimaryButton
        v-if="isAnyAutobuyerUnlocked && !isEC8Running"
        class="o-primary-btn--subtab-option"
        @click="toggleAllAutobuyers"
      >
        {{ $t('ade.4b652887fb44f382') }}
      </PrimaryButton>
    </div>
    <div>
      <p>
        <LocalizedText id="ade.f1f98b07bee9d666">
          <template #p0><span class="c-infinity-dim-description__accent">{{ $legacyText(_s(format(infinityPower, 2, 1))) }}</span></template>
          <template #p1><br></template>
          <template #p2><span v-if="!isEC9Running">
          {{ $t('ade.3b32181c27401525') }}
          <span class="c-infinity-dim-description__accent">{{ $legacyText(_s(formatPow(conversionRate, 2, 3))) }}</span>
        </span>
<span v-else>
          {{ $t('ade.c49489009c660834') }}
        </span></template>
          <template #p3><span class="c-infinity-dim-description__accent">{{ $legacyText(_s(formatX(dimMultiplier, 2, 1))) }}</span></template>
          <template #p4><span v-if="!isEC9Running">{{ $legacyText(_s(isFlipped ? "Matter" : "Antimatter")) }} Dimensions.</span>
<span v-else>Time Dimensions due to Eternity Challenge 9.</span></template>
        </LocalizedText>

      </p>
    </div>
    <div
      v-if="enslavedCompleted"
      class="l-infinity-dim-tab__enslaved-reward-container"
    >
      <button
        class="c-infinity-dim-tab__tesseract-button"
        :class="{
          'c-infinity-dim-tab__tesseract-button--disabled': !canBuyTesseract,
          'o-pelle-disabled-pointer': creditsClosed
        }"
        @click="buyTesseract"
      >
        <p>
          {{ $t('ade.bf9553f8ec47314b', { p0: $legacyText(_s(tesseractCountString)) }) }}
        </p>
        <p>{{ $t('ade.05c5371dbbe26d3e', { p0: $legacyText(_s(format(nextDimCapIncrease,2))) }) }}</p>
        <p><b>{{ $t('ade.b6422de7cef264f6', { p0: $legacyText(_s(format(tesseractCost))) }) }}</b></p>
      </button>
    </div>
    <div v-if="isEnslavedRunning">
      {{ $t('ade.69ece4c5c95dc4a0') }}
    </div>
    <div v-else>
      {{ $t('ade.9d7ca3a2a69a9e9a', { p0: $legacyText(_s(format(totalDimCap,2))) }) }}
    </div>
    <div>{{ $t('ade.217b3418d2644884', { p0: $legacyText(_s(format(powerPerSecond,2,0))), p1: $legacyText(_s(incomeType)) }) }}</div>
    <b
      v-if="isEC8Running"
      class="l-infinity-dim-tab__ec8-purchases"
    >
      {{ $t('ade.875da51e48016c03', { p0: $legacyText(_s(quantifyInt("purchase",EC8PurchasesLeft))) }) }}
    </b>
    <div class="l-dimensions-container">
      <InfinityDimensionRow
        v-for="tier in 8"
        :key="tier"
        :tier="tier"
      />
    </div>
    <div v-if="showLockedDimCostNote">
      {{ $t('ade.1be3f49bbe5e362c') }}
    </div>
  </div>
</template>
