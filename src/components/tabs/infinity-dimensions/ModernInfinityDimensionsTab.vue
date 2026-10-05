<script>
import wordShift from "@/core/word-shift";

import InfinityDimensionRow from "./ModernInfinityDimensionRow";
import PrimaryButton from "@/components/PrimaryButton";
import PrimaryToggleButton from "@/components/PrimaryToggleButton";

export default {
  name: "ModernInfinityDimensionsTab",
  components: {
    PrimaryButton,
    PrimaryToggleButton,
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
      tesseractMult: 0,
      creditsClosed: false,
      showLockedDimCostNote: true,
      isEndgameUnlocked: false,
      infinityDimCompressionMagnitude: 0,
      infinityDimOverflow: 0,
      infinityDimStart: new Decimal(0),
      infinityDimCompressionMagnitude2: 0,
      infinityDimOverflow2: 0,
      infinityDimStart2: new Decimal(0),
      hasSecond: false,
      freeTesseractSoftcap: 0,
      freeTesseractHardcap: 0,
      isAutoUnlocked: false,
      isAutoActive: false,
      isAlphaDestroyed: false,
      tesseractMultText: "",
      additiveTesseractString: "",
      multiplicativeTesseractString: "",
      tesseractStringArray: [],
      isFlipped: false
    };
  },
  computed: {
    tesseractCountString() {
      if (LHC.hadronC >= 1) return this.multiplicativeTesseractString;
      if (LHC.hadronC >= 0.5) return `${wordShift.wordCycle(this.tesseractStringArray, true)}`;
      return this.additiveTesseractString;
    },
    autobuyer() {
      return Autobuyer.tesseract;
    },
    autobuyerTextDisplay() {
      const auto = this.isAutoActive;
      return `Auto Tesseract ${auto ? "ON" : "OFF"}`;
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
      this.powerPerSecond.copyFrom(InfinityDimension(1).productionPerSecond);
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
      this.tesseractMult = Tesseracts.totalMult;
      this.creditsClosed = GameEnd.creditsEverClosed;
      this.isEndgameUnlocked = PlayerProgress.endgameUnlocked();
      this.infinityDimCompressionMagnitude = InfinityDimensions.compressionMagnitude;
      this.infinityDimOverflow = 1 / this.infinityDimCompressionMagnitude;
      this.infinityDimStart = InfinityDimensions.OVERFLOW;
      this.infinityDimCompressionMagnitude2 = InfinityDimensions.compressionMag2;
      this.infinityDimOverflow2 = 1 / this.infinityDimCompressionMagnitude2;
      this.infinityDimStart2 = InfinityDimensions.OVERFLOW_SQUARED;
      this.hasSecond = Currency.infinityPower.gte(DC.ENUMMAX);
      this.freeTesseractSoftcap = Tesseracts.freeSoftcapStart;
      this.freeTesseractHardcap = this.freeTesseractSoftcap * 2;
      const auto = Autobuyer.tesseract;
      this.isAutoUnlocked = auto.isUnlocked;
      this.isAutoActive = auto.isActive;
      this.isAlphaDestroyed = Alpha.isDestroyed;
      this.tesseractMultText = this.tesseractMult !== 1 ? ` × ${format(this.tesseractMult, 2, 2)}` : "";
      this.additiveTesseractString = `${formatHybridSmall(this.boughtTesseracts, 3)}${this.tesseractMultText}${this.extraTesseracts > 0
        ? ` + ${format(this.extraTesseracts, 2, 2)}${this.tesseractMultText}` : ""}`;
      this.multiplicativeTesseractString = `${formatHybridSmall(this.boughtTesseracts, 3)}${this.extraTesseracts > 0
        ? ` × ${format(this.extraTesseracts, 2, 2)}${this.tesseractMultText}` : ""}`;
      this.tesseractStringArray = [this.multiplicativeTesseractString, this.additiveTesseractString];
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
    },
    handleAutoToggle(value) {
      Autobuyer.tesseract.isActive = value;
      this.update();
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
        <LocalizedText id="dimensions.infinity.power">
          <template #p0><span class="c-infinity-dim-description__accent">{{ format(infinityPower, 2, 1) }}</span></template>
          <template #p1><br></template>
          <template #p2>
            <LocalizedText v-if="!isEC9Running" id="dimensions.infinity.conversion">
              <template #p0><span class="c-infinity-dim-description__accent">{{ formatPow(conversionRate, 2, 3) }}</span></template>
            </LocalizedText>
            <span v-else>{{ $t('ade.c49489009c660834') }}</span>
          </template>
          <template #p3><span class="c-infinity-dim-description__accent">{{ formatX(dimMultiplier, 2, 1) }}</span></template>
          <template #p4>{{ isEC9Running ? $t('dimensions.infinity.ec9Target') : $t(isFlipped ? 'terms.matterDimension' : 'terms.antimatterDimension', {}, 'plural') }}</template>
        </LocalizedText>
      </p>
    </div>
    <div>
      <p>
        <span v-if="isEndgameUnlocked">
          <LocalizedText id="ade.1dfafd31cd3e4d19">
            <template #p0><span class="c-infinity-dim-compression-description__accent">{{ $legacyText(_s(format(infinityDimCompressionMagnitude, 2, 3))) }}</span></template>
            <template #p1><span class="c-infinity-dim-compression-description__accent">{{ $legacyText(_s(format(infinityDimOverflow, 2, 3))) }}</span></template>
            <template #p2><span>{{ $legacyText(_s(formatPostBreak(infinityDimStart, 2, 1))) }}</span></template>
          </LocalizedText>
        </span>
      </p>
    </div>
    <div>
      <p>
        <span v-if="hasSecond">
          <LocalizedText id="ade.828c58b87141fa8d">
            <template #p0><span class="c-infinity-dim-compression-description__accent">{{ $legacyText(_s(format(infinityDimCompressionMagnitude2, 2, 3))) }}</span></template>
            <template #p1><span class="c-infinity-dim-compression-description__accent">{{ $legacyText(_s(format(infinityDimOverflow2, 2, 3))) }}</span></template>
            <template #p2><span>{{ $legacyText(_s(formatPostBreak(infinityDimStart2, 2, 1))) }}</span></template>
          </LocalizedText>
        </span>
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
        <p>{{ $t('ade.91a7f0be67445b5e', { p0: $legacyText(_s(format(nextDimCapIncrease,2))) }) }}</p>
        <p><b>{{ $t('ade.b6422de7cef264f6', { p0: $legacyText(_s(format(tesseractCost))) }) }}</b></p>
      </button>
      <br>
      <PrimaryToggleButton
        v-if="isAutoUnlocked"
        :value="isAutoActive"
        :on="$legacyText(autobuyerTextDisplay)"
        :off="$legacyText(autobuyerTextDisplay)"
        class="l--spoon-btn-group__little-spoon o-primary-btn--tesseract-toggle"
        @input="handleAutoToggle"
      />
    </div>
    <div>
      {{ $t('ade.2792dc9a8effa3f0', { p0: $legacyText(_s(format(freeTesseractSoftcap,2,2))) }) }}
      <div v-if="!isAlphaDestroyed">
        <br>
        {{ $t('dimensions.infinity.tesseractLimit', { soft: format(freeTesseractSoftcap, 2, 2), hard: format(freeTesseractHardcap, 2, 2) }) }}
      </div>
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
