<script>
import PrimaryButton from "@/components/PrimaryButton";

export default {
  name: "ClassicAntimatterDimensionsTabHeader",
  components: {
    PrimaryButton
  },
  data() {
    return {
      isSacrificeUnlocked: false,
      isSacrificeAffordable: false,
      currentSacrifice: new Decimal(0),
      currentPower: new Decimal(0),
      sacrificeBoost: new Decimal(0),
      nextPower: new Decimal(0),
      disabledCondition: "",
      isFlipped: false,
      isCursed: false
    };
  },
  computed: {
    sacrificeTargetDimension() {
      const tier = this.isCursed ? 1 : 8;
      return this.$t("ui.dimensionName", {
        ordinal: this.$t(`terms.dimension.ordinal${tier}`, {}, "ordinal"),
        dimension: this.$t(this.isFlipped ? "terms.matterDimension" : "terms.antimatterDimension")
      });
    },
    sacText() {
      return this.$t("dimensions.sacrifice.action", {
        value: Ascensions.sacA.isUnlocked ? formatPow(this.nextPower, 2, 3) : formatX(this.sacrificeBoost, 2, 2)
      });
    },
    sacrificeTooltip() {
      const power = Ascensions.sacA.isUnlocked;
      return this.$t(power ? "dimensions.sacrifice.powerTooltip" : "dimensions.sacrifice.tooltip", {
        dimension: this.sacrificeTargetDimension,
        value: power ? formatPow(this.nextPower, 2, 3) : formatX(this.sacrificeBoost, 2, 2)
      });
    },
  },
  methods: {
    update() {
      this.isCursed = Slabdrill.isCursed;
      this.isFlipped = player.universes.current === 2;
      const isSacrificeUnlocked = Sacrifice.isVisible;
      this.isSacrificeUnlocked = isSacrificeUnlocked;
      if (!isSacrificeUnlocked) return;
      this.isSacrificeAffordable = Sacrifice.canSacrifice;
      this.currentSacrifice.copyFrom(Sacrifice.totalBoost);
      this.currentPower.copyFrom(Sacrifice.totalPower);
      this.sacrificeBoost.copyFrom(Sacrifice.nextBoost);
      this.nextPower.copyFrom(Sacrifice.nextPower);
      this.disabledCondition = Sacrifice.disabledCondition;
    },
    sacrifice() {
      sacrificeBtnClick();
    },
    maxAll() {
      maxAll();
    }
  }
};
</script>

<template>
  <div class="l-antimatter-dim-tab__header">
    <PrimaryButton
      v-show="isSacrificeUnlocked"
      v-tooltip="$legacyTooltip(sacrificeTooltip)"
      :enabled="isSacrificeAffordable"
      class="o-primary-btn--sacrifice"
      @click="sacrifice"
    >
      <span v-if="isSacrificeAffordable">
        {{ $legacyText(_s(sacText)) }}
      </span>
      <span v-else>
        {{ $t('ade.5209c28e0d12bc4a', { p0: $legacyText(_s(disabledCondition)) }) }}
      </span>
    </PrimaryButton>
    <PrimaryButton
      class="o-primary-btn--buy-max"
      @click="maxAll"
    >
      {{ $t('ade.62dd22ce6ff2fe15') }}
    </PrimaryButton>
  </div>
</template>
