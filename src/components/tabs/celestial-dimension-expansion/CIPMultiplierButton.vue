<script>
import PrimaryButton from "@/components/PrimaryButton";
import PrimaryToggleButton from "@/components/PrimaryToggleButton";

export default {
  name: "CIPMultiplierButton",
  components: {
    PrimaryButton,
    PrimaryToggleButton
  },
  data() {
    return {
      isAutobuyerActive: false,
      isAutoUnlocked: false,
      isAffordable: false,
      multiplier: new Decimal(),
      cost: new Decimal()
    };
  },
  computed: {
    upgrade() {
      return CelestialInfinityUpgrade.cipMult;
    },
    classObject() {
      return {
        "o-celestial-infinity-upgrade": true,
        "o-celestial-infinity-upgrade--available": this.isAffordable,
        "o-celestial-infinity-upgrade--unavailable": !this.isAffordable
      };
    },
  },
  watch: {
    isAutobuyerActive(newValue) {
      Autobuyer.cipMult.isActive = newValue;
    }
  },
  methods: {
    update() {
      const upgrade = this.upgrade;
      this.isAutoUnlocked = Autobuyer.cipMult.isUnlocked;
      this.isAutobuyerActive = Autobuyer.cipMult.isActive;
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
        <LocalizedText id="ade.e790b74cab157acc">
          <template #p0>{{ $legacyText(_s(formatX(2))) }}</template>
          <template #p1><br></template>
          <template #p2>{{ $legacyText(_s(formatX(multiplier,2,0))) }}</template>
        </LocalizedText>
      </div>
      <br>
      {{ $t('ade.9b699ddbf2778050', { p0: $legacyText(_s(quantify("Celestial Infinity Point",cost,2,0))) }) }}
    </button>
    <PrimaryButton
      class="l--spoon-btn-group__little-spoon o-primary-btn--small-spoon"
      @click="upgrade.buyMax(false)"
    >
      {{ $t('ade.7e50baa199c6f890') }}
    </PrimaryButton>
    <PrimaryToggleButton
      v-if="isAutoUnlocked"
      v-model="isAutobuyerActive"
      :label="$t('ade.655f6de81cd380fc')"
      class="l--spoon-btn-group__little-spoon o-primary-btn--small-spoon"
    />
  </div>
</template>

<style scoped>
.l-margin-top {
  margin-top: 0.55rem;
}
</style>
