<script>
import wordShift from "@/core/word-shift";

import PrimaryButton from "@/components/PrimaryButton";
import PrimaryToggleButton from "@/components/PrimaryToggleButton";

export default {
  name: "HypercubesTab",
  components: {
    PrimaryButton,
    PrimaryToggleButton,
  },
  data() {
    return {
      creditsClosed: false,
      nextInfinityDimCapIncrease: new Decimal(0),
      tesseractCost: new Decimal(0),
      totalInfinityDimCap: new Decimal(0),
      canBuyTesseract: false,
      boughtTesseracts: 0,
      extraTesseracts: 0,
      tesseractMult: 0,
      isTesseractAutoUnlocked: false,
      isTesseractAutoActive: false,
      tesseractMultText: "",
      additiveTesseractString: "",
      multiplicativeTesseractString: "",
      tesseractStringArray: [],
      penteractsUnlocked: false,
      nextFreeTickspeedReduction: new Decimal(0),
      penteractCost: new Decimal(0),
      totalFreeTickspeedReduction: new Decimal(0),
      canBuyPenteract: false,
      boughtPenteracts: 0,
      extraPenteracts: 0,
      isPenteractAutoUnlocked: false,
      isPenteractAutoActive: false,
      hexeractsUnlocked: false,
      nextDarkMatterSoftcapReduction: new Decimal(0),
      hexeractCost: new Decimal(0),
      totalDarkMatterSoftcapReduction: new Decimal(0),
      canBuyHexeract: false,
      boughtHexeracts: 0,
      extraHexeracts: 0,
      isHexeractAutoUnlocked: false,
      isHexeractAutoActive: false,
      hepteractsUnlocked: false,
      nextCelestialDimSoftcapReduction: new Decimal(0),
      hepteractCost: new Decimal(0),
      totalCelestialDimSoftcapReduction: new Decimal(0),
      canBuyHepteract: false,
      boughtHepteracts: 0,
      extraHepteracts: 0,
      isHepteractAutoUnlocked: false,
      isHepteractAutoActive: false,
      octeractsUnlocked: false,
      nextTotalCubeBoost: 0,
      octeractCost: new Decimal(0),
      totalCubeBoost: new Decimal(0),
      canBuyOcteract: false,
      boughtOcteracts: 0,
      extraOcteracts: 0,
      isOcteractAutoUnlocked: false,
      isOcteractAutoActive: false,
      time: 0,
    };
  },
  computed: {
    tesseractCountString() {
      if (LHC.hadronC >= 1) return this.multiplicativeTesseractString;
      if (LHC.hadronC >= 0.5) return `${wordShift.wordCycle(this.tesseractStringArray, true)}`;
      return this.additiveTesseractString;
    },
    tesseractAutobuyer() {
      return Autobuyer.tesseract;
    },
    tesseractAutobuyerTextDisplay() {
      const auto = this.isTesseractAutoActive;
      return `Auto Tesseract ${auto ? "ON" : "OFF"}`;
    },
    penteractCountString() {
      const extra = this.extraPenteracts > 0 ? ` + ${format(this.extraPenteracts, 2, 2)}` : "";
      return `${formatHybridSmall(this.boughtPenteracts, 3)}${extra}`;
    },
    hexeractCountString() {
      const extra = this.extraHexeracts > 0 ? ` + ${format(this.extraHexeracts, 2, 2)}` : "";
      return `${formatHybridSmall(this.boughtHexeracts, 3)}${extra}`;
    },
    hepteractCountString() {
      const extra = this.extraHepteracts > 0 ? ` + ${format(this.extraHepteracts, 2, 2)}` : "";
      return `${formatHybridSmall(this.boughtHepteracts, 3)}${extra}`;
    },
    octeractCountString() {
      const extra = this.extraOcteracts > 0 ? ` + ${format(this.extraOcteracts, 2, 2)}` : "";
      return `${formatHybridSmall(this.boughtOcteracts, 3)}${extra}`;
    },
    penteractLockString() {
      if (this.penteractsUnlocked) return `Buy a Penteract (${this.penteractCountString})`;
      else return `Purchase Duality Upgrade 25 to unlock Penteracts`;
    },
    hexeractLockString() {
      if (this.hexeractsUnlocked) return `Buy a Hexeract (${this.hexeractCountString})`;
      else return `Hadronize Lai'tela ${formatInt(40)} times to unlock Hexeracts`;
    },
    hepteractLockString() {
      if (this.hepteractsUnlocked) return `Buy a Hepteract (${this.hepteractCountString})`;
      else return `Perform a Celestial Eternity to unlock Hepteracts`;
    },
  },
  methods: {
    update() {
      this.creditsClosed = GameEnd.creditsEverClosed;
      this.nextInfinityDimCapIncrease.copyFrom(Tesseracts.nextTesseractIncrease);
      this.tesseractCost.copyFrom(Tesseracts.nextCost);
      this.totalInfinityDimCap.copyFrom(InfinityDimensions.totalDimCap);
      this.canBuyTesseract = Tesseracts.canBuyTesseract;
      this.boughtTesseracts = Tesseracts.bought;
      this.extraTesseracts = Tesseracts.extra;
      this.tesseractMult = Tesseracts.totalMult;
      const tesseractAuto = Autobuyer.tesseract;
      this.isTesseractAutoUnlocked = tesseractAuto.isUnlocked;
      this.isTesseractAutoActive = tesseractAuto.isActive;
      this.tesseractMultText = this.tesseractMult !== 1 ? ` × ${format(this.tesseractMult, 2, 2)}` : "";
      this.additiveTesseractString = `${formatHybridSmall(this.boughtTesseracts, 3)}${this.tesseractMultText}${this.extraTesseracts > 0
        ? ` + ${format(this.extraTesseracts, 2, 2)}${this.tesseractMultText}` : ""}`;
      this.multiplicativeTesseractString = `${formatHybridSmall(this.boughtTesseracts, 3)}${this.extraTesseracts > 0
        ? ` × ${format(this.extraTesseracts, 2, 2)}${this.tesseractMultText}` : ""}`;
      this.tesseractStringArray = [this.multiplicativeTesseractString, this.additiveTesseractString];
      this.penteractsUnlocked = DualityUpgrade(25).isBought;
      this.nextFreeTickspeedReduction.copyFrom(Penteracts.eachPenteractReduction.sub(1));
      this.penteractCost.copyFrom(Penteracts.nextCost);
      this.totalFreeTickspeedReduction.copyFrom(Penteracts.softcapReduction());
      this.canBuyPenteract = Penteracts.canBuyPenteract;
      this.boughtPenteracts = Penteracts.bought;
      this.extraPenteracts = Penteracts.extra;
      this.isPenteractAutoUnlocked = false;
      this.isPenteractAutoActive = false;
      this.hexeractsUnlocked = player.celestials.laitela.hadronizes >= 40;
      this.nextDarkMatterSoftcapReduction.copyFrom(Hexeracts.eachHexeractReduction.sub(1));
      this.hexeractCost.copyFrom(Hexeracts.nextCost);
      this.totalDarkMatterSoftcapReduction.copyFrom(Hexeracts.softcapReduction());
      this.canBuyHexeract = Hexeracts.canBuyHexeract;
      this.boughtHexeracts = Hexeracts.bought;
      this.extraHexeracts = Hexeracts.extra;
      this.isHexeractAutoUnlocked = false;
      this.isHexeractAutoActive = false;
      this.hepteractsUnlocked = PlayerProgress.celestialEternityUnlocked();
      this.nextCelestialDimSoftcapReduction.copyFrom(Hepteracts.eachHepteractReduction.sub(1));
      this.hepteractCost.copyFrom(Hepteracts.nextCost);
      this.totalCelestialDimSoftcapReduction.copyFrom(Hepteracts.softcapReduction());
      this.canBuyHepteract = Hepteracts.canBuyHepteract;
      this.boughtHepteracts = Hepteracts.bought;
      this.extraHepteracts = Hepteracts.extra;
      this.isHepteractAutoUnlocked = false;
      this.isHepteractAutoActive = false;
      this.octeractsUnlocked = false;
      this.nextTotalCubeBoost = Octeracts.eachOcteractBoost - 1;
      this.octeractCost.copyFrom(Octeracts.nextCost);
      this.totalCubeBoost.copyFrom(Octeracts.cubeBoost());
      this.canBuyOcteract = Octeracts.canBuyOcteract;
      this.boughtOcteracts = Octeracts.bought;
      this.extraOcteracts = Octeracts.extra;
      this.isOcteractAutoUnlocked = false;
      this.isOcteractAutoActive = false;
      this.time = Date.now();
    },
    buyTesseract() {
      Tesseracts.buyTesseract();
    },
    buyPenteract() {
      Penteracts.buyPenteract();
    },
    buyHexeract() {
      Hexeracts.buyHexeract();
    },
    buyHepteract() {
      Hepteracts.buyHepteract();
    },
    buyOcteract() {
      Octeracts.buyOcteract();
    },
    handleTesseractAutoToggle(value) {
      Autobuyer.tesseract.isActive = value;
      this.update();
    },
    octeractLockString() {
      if (this.octeractsUnlocked) return `Buy a Octeract (${this.octeractCountString})`;
      //somewhat ugly method to make it continuously update
      else return this.time >= 0 ? `Reach ${wordShift.randomCrossWords("Expanse Transfer")} to unlock Octeracts` : `Reach ${wordShift.randomCrossWords("Expanse Transfer")} to unlock Octeracts`;
    },
    octeractResourceString() {
      if (false) return `Expansial Fragments`;
      else return this.time >= 0 ? `${wordShift.randomCrossWords("Expansial Fragments")}` : `${wordShift.randomCrossWords("Expansial Fragments")}`;
    },
  }
};
</script>

<template>
  <div class="l-hypercubes-tab">
    Penteracts cannot be purchased while Doomed.
    <div class="l-hypercubes-container">
      <div class="l-hypercubes-btn">
        <button
          class="c-infinity-dim-tab__tesseract-button l-hypercubes-button"
          :class="{
            'c-infinity-dim-tab__tesseract-button--disabled': !canBuyTesseract,
            'o-pelle-disabled-pointer': creditsClosed
          }"
          @click="buyTesseract"
        >
          <p>
            {{ $t('ade.bf9553f8ec47314b', { p0: $legacyText(_s(tesseractCountString)) }) }}
          </p>
          <p>{{ $t('ade.05c5371dbbe26d3e', { p0: $legacyText(_s(format(nextInfinityDimCapIncrease,2))) }) }}</p>
          <p><b>{{ $t('ade.4e555efd48a9dbc5', { p0: $legacyText(_s(format(tesseractCost))) }) }}</b></p>
          <p>{{ $t('ade.96bb78a5e16b1913', { p0: $legacyText(_s(format(totalInfinityDimCap,2))) }) }}</p>
        </button>
        <br>
        <PrimaryToggleButton
          v-if="isTesseractAutoUnlocked"
          :value="isTesseractAutoActive"
          :on="$legacyText(tesseractAutobuyerTextDisplay)"
          :off="$legacyText(tesseractAutobuyerTextDisplay)"
          class="l--spoon-btn-group__little-spoon o-primary-btn--tesseract-toggle"
          @input="handleTesseractAutoToggle"
        />
      </div>
      <div class="l-hypercubes-btn">
        <button
          class="c-penteract-button l-hypercubes-button"
          :class="{
            'c-penteract-button--disabled': !canBuyPenteract,
            'o-pelle-disabled-pointer': creditsClosed
          }"
          @click="buyPenteract"
        >
          <p>
            {{ $legacyText(_s(penteractLockString)) }}
          </p>
          <p>{{ $t('ade.547a94730a6d9aad', { p0: $legacyText(_s(formatDecimalPercents(nextFreeTickspeedReduction,2,2))) }) }}</p>
          <p><b>{{ $t('ade.76c056749f43fe3e', { p0: $legacyText(_s(format(penteractCost))) }) }}</b></p>
          <p>{{ $t('ade.ef92386b4ca00826', { p0: $legacyText(_s(formatPow(totalFreeTickspeedReduction,2,4))) }) }}</p>
        </button>
      </div>
      <div class="l-hypercubes-btn">
        <button
          class="c-hexeract-button l-hypercubes-button"
          :class="{
            'c-hexeract-button--disabled': !canBuyHexeract,
            'o-pelle-disabled-pointer': creditsClosed
          }"
          @click="buyHexeract"
        >
          <p>
            {{ $legacyText(_s(hexeractLockString)) }}
          </p>
          <p>{{ $t('ade.6f5d9e4339c39d48', { p0: $legacyText(_s(formatDecimalPercents(nextDarkMatterSoftcapReduction,2,2))) }) }}</p>
          <p><b>{{ $t('ade.38218b664d4e0ef9', { p0: $legacyText(_s(format(hexeractCost))) }) }}</b></p>
          <p>{{ $t('ade.e41b3d54f199e1e4', { p0: $legacyText(_s(formatPow(totalDarkMatterSoftcapReduction,2,4))) }) }}</p>
        </button>
      </div>
    </div>
    <div class="l-hypercubes-container">
      <div class="l-hypercubes-btn">
        <button
          class="c-hepteract-button l-hypercubes-button"
          :class="{
            'c-hepteract-button--disabled': !canBuyHepteract,
            'o-pelle-disabled-pointer': creditsClosed
          }"
          @click="buyHepteract"
        >
          <p>
            {{ $legacyText(_s(hepteractLockString)) }}
          </p>
          <p>{{ $t('ade.0c29dc553caee349', { p0: $legacyText(_s(formatDecimalPercents(nextCelestialDimSoftcapReduction,2,2))) }) }}</p>
          <p><b>{{ $t('ade.c739c5d78ddfb126', { p0: $legacyText(_s(format(hepteractCost))) }) }}</b></p>
          <p>{{ $t('ade.8163c7b6bee32496', { p0: $legacyText(_s(formatPow(totalCelestialDimSoftcapReduction,2,4))) }) }}</p>
        </button>
      </div>
      <div class="l-hypercubes-btn">
        <button
          class="c-octeract-button l-hypercubes-button"
          :class="{
            'c-octeract-button--disabled': !canBuyOcteract,
            'o-pelle-disabled-pointer': creditsClosed
          }"
          @click="buyOcteract"
        >
          <p>
            {{ $legacyText(_s(octeractLockString())) }}
          </p>
          <p>{{ $t('ade.f8793a6733bdb71c', { p0: $legacyText(_s(formatPercents(nextTotalCubeBoost,2,2))) }) }}</p>
          <p><b>{{ $t('ade.cb92c4fb073b5667', { p0: $legacyText(_s(format(octeractCost))), p1: $legacyText(_s(octeractResourceString())) }) }}</b></p>
          <p>{{ $t('ade.4c0ee24c92919ab0', { p0: $legacyText(_s(formatX(totalCubeBoost,2,2))) }) }}</p>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.l-hypercubes-tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: var(--color-text);
}

.l-hypercubes-container {
  display: flex;
  flex-direction: row;
  align-items: center;
  color: var(--color-text);
}

.l-hypercubes-btn {
  margin-top: 1rem;
  margin-bottom: 1rem;
  padding: 1rem;
  height: 20rem;
}

.l-hypercubes-button {
  width: 35rem;
  height: 15rem;
}
</style>
