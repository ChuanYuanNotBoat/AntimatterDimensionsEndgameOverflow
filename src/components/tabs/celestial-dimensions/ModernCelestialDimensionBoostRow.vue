<script>
export default {
  name: "ModernCelestialDimensionBoostRow",
  data() {
    return {
      requirement: {
        amount: new Decimal(0)
      },
      isBuyable: false,
      purchasedBoosts: new Decimal(0),
      lockText: null,
      unlockedByBoost: null,
      creditsClosed: false,
      requirementText: null,
    };
  },
  computed: {
    isDoomed: () => Pelle.isDoomed,
    boostCountText() {
      if (this.requirementText) return this.requirementText;
      const parts = [this.purchasedBoosts];
      const sum = parts.map(formatDimboostParts).join(" + ");
      return sum;
    },
    classObject() {
      return {
        "o-primary-btn o-primary-btn--new o-primary-btn--dimension-reset": true,
        "o-primary-btn--disabled": !this.isBuyable,
        "o-pelle-disabled-pointer": this.creditsClosed
      };
    }
  },
  methods: {
    update() {
      const requirement = CelestialDimBoost.requirement;
      this.requirement.amount.copyFrom(requirement.amount);
      this.isBuyable = requirement.isSatisfied && CelestialDimBoost.canBeBought;
      this.purchasedBoosts.copyFrom(CelestialDimBoost.purchasedBoosts);
      this.lockText = CelestialDimBoost.lockText;
      this.unlockedByBoost = CelestialDimBoost.unlockedByBoost;
      this.creditsClosed = GameEnd.creditsEverClosed;
      if (this.isDoomed) this.requirementText = formatHybridLarge(this.purchasedBoosts, 3);
    },
    celestialDimensionBoost(bulk) {
      if (!CelestialDimBoost.requirement.isSatisfied || !CelestialDimBoost.canBeBought) return;
      manualRequestCelestialDimensionBoost(bulk);
    }
  }
};
</script>

<template>
  <div class="reset-container dimboost">
    <h4>{{ $t('ade.d7b562a2444e1eec', { p0: $legacyText(_s(boostCountText)) }) }}</h4>
    <span>{{ $t('ade.93182c08bbf707cb', { p0: $legacyText(_s(formatHybridLarge(requirement.amount,3))) }) }}</span>
    <button
      :class="classObject"
      @click.exact="celestialDimensionBoost(true)"
      @click.shift.exact="celestialDimensionBoost(false)"
    >
      {{ $legacyText(_s(unlockedByBoost)) }}
    </button>
  </div>
</template>
