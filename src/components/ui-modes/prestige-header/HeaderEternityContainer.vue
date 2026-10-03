<script>
import CelestialEternityButton from "./CelestialEternityButton";
import EternityButton from "./EternityButton";
import UnlockInfinityDimButton from "./UnlockInfinityDimButton";

export default {
  name: "HeaderEternityContainer",
  components: {
    CelestialEternityButton,
    EternityButton,
    UnlockInfinityDimButton,
  },
  data() {
    return {
      showContainer: false,
      showEP: false,
      showNextEP: false,
      eternityPoints: new Decimal(0),
      nextEP: new Decimal(0),
      isPenteractUnlocked: false,
      penteractCost: new Decimal(0),
      penteractText: "",
      hasCelestial: false,
      celEternityPoints: new Decimal(0),
    };
  },
  methods: {
    update() {
      this.showContainer = player.break || PlayerProgress.eternityUnlocked();
      this.showEP = PlayerProgress.eternityUnlocked();
      this.eternityPoints.copyFrom(Currency.eternityPoints.value.floor());
      this.showNextEP = Player.canEternity && player.records.thisReality.maxEP.lt(100) &&
        gainedEternityPoints().lt(100);
      if (this.showNextEP) this.nextEP.copyFrom(requiredIPForEP(gainedEternityPoints().floor().toNumber() + 1));
      this.isPenteractUnlocked = DualityUpgrade(25).isBought && !player.disablePostReality;
      this.penteractCost = Penteracts.nextCost;
      this.penteractText = this.penteractProgress();
      this.hasCelestial = (PlayerProgress.celestialEternityUnlocked() ||
        player.endgame.celDimExpansion.celestialInfinityPoints.gte(DC.NUMMAX)) && !Slabdrill.isCursed;
      this.celEternityPoints.copyFrom(Currency.celestialEternityPoints.value.floor());
    },
    penteractProgress() {
      const progress = this.eternityPoints.add(1).log10().div(this.penteractCost.log10()).toNumber();
      if (progress > 1) return `<b>(${formatPercents(1)})</b>`;
      return `(${formatPercents(progress, 2, 2)})`;
    },
  },
};
</script>

<template>
  <div>
    <div
      v-if="showContainer"
      class="c-prestige-button-container"
    >
      <div
        v-if="showEP"
        class="c-eternity-points"
      >
        {{ $t('ade.9f717812b3aa8e61') }}
        <span class="c-game-header__ep-amount">{{ $legacyText(_s(format(eternityPoints, 2))) }}</span>
        {{ $t('ade.2d6767bdc396d538', { p0: $legacyText(_s(pluralize("Eternity Point",eternityPoints))) }) }}
        <span v-if="showNextEP">{{ $t('ade.5eda44793a27ec52', { p0: $legacyText(_s(format(nextEP,1))) }) }}</span>
        <span
          v-if="isPenteractUnlocked"
          v-html="$legacyHtml(penteractText)"
        />
      </div>
      <UnlockInfinityDimButton />
      <EternityButton />
    </div>
    <div
      v-if="showContainer && hasCelestial"
      class="c-prestige-button-container"
    >
      <div class="c-eternity-points">
        <LocalizedText id="ade.cd1ff500c8f2ac78">
          <template #p0><span class="c-game-header__cep-amount">{{ $legacyText(_s(format(celEternityPoints, 2))) }}</span></template>
          <template #p1>{{ $legacyText(_s(pluralize("Celestial Eternity Point",celEternityPoints))) }}</template>
        </LocalizedText>
      </div>
      <CelestialEternityButton />
    </div>
  </div>
</template>

<style scoped>
.c-eternity-points {
  font-size: 1.2rem;
  padding-bottom: 0.5rem;
}
</style>
