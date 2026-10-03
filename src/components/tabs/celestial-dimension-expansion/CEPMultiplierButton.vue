<script>
import PrimaryButton from "@/components/PrimaryButton";
import PrimaryToggleButton from "@/components/PrimaryToggleButton";

export default {
  name: "CEPMultiplierButton",
  components: {
    PrimaryButton,
    PrimaryToggleButton
  },
  data() {
    return {
      isAffordable: false,
      multiplier: new Decimal(),
      cost: new Decimal()
    };
  },
  computed: {
    upgrade() {
      return CelestialEternityUpgrade.cepMult;
    },
    classObject() {
      return {
        "o-celestial-eternity-upgrade": true,
        "o-celestial-eternity-upgrade--available": this.isAffordable,
        "o-celestial-eternity-upgrade--unavailable": !this.isAffordable
      };
    },
  },
  methods: {
    update() {
      const upgrade = this.upgrade;
      this.multiplier.copyFrom(upgrade.effectValue);
      this.cost.copyFrom(upgrade.cost);
      this.isAffordable = upgrade.isAffordable;
    },
    purchaseUpgrade() {
      this.upgrade.purchase();
    }
  }
};
</script>

<template>
  <div class="l-spoon-btn-group l-margin-top">
    <button
      :class="classObject"
      @click="purchaseUpgrade"
    >
      <div>
        <LocalizedText id="ade.535a057e35ca8e39">
          <template #p0>{{ $legacyText(_s(formatX(5))) }}</template>
          <template #p1><br></template>
          <template #p2>{{ $legacyText(_s(formatX(multiplier,2,0))) }}</template>
        </LocalizedText>
      </div>
      <br>
      {{ $t('ade.9b699ddbf2778050', { p0: $legacyText(_s(quantify("Celestial Eternity Point",cost,2,0))) }) }}
    </button>
    <PrimaryButton
      class="l--spoon-btn-group__little-spoon o-primary-btn--small-spoon"
      @click="upgrade.buyMax(false)"
    >
      {{ $t('ade.dd990301628a7aec') }}
    </PrimaryButton>
  </div>
</template>

<style scoped>
.l-margin-top {
  margin-top: 0.55rem;
}
</style>
