<script>
import AutobuyerBox from "./AutobuyerBox";
import AutobuyerInput from "./AutobuyerInput";

export default {
  name: "CelestialDimensionBoostAutobuyerBox",
  components: {
    AutobuyerBox,
    AutobuyerInput
  },
  props: {
    isModal: {
      type: Boolean,
      required: false,
      default: false
    }
  },
  data() {
    return {
      limitCelDimBoosts: false,
      limitUntilCelGalaxies: false,
      isBuyMaxUnlocked: false
    };
  },
  computed: {
    autobuyer: () => Autobuyer.celestialDimboost
  },
  watch: {
    limitCelDimBoosts(newValue) {
      this.autobuyer.limitCelDimBoosts = newValue;
    },
    limitUntilCelGalaxies(newValue) {
      this.autobuyer.limitUntilCelGalaxies = newValue;
    }
  },
  methods: {
    update() {
      const autobuyer = this.autobuyer;
      this.isBuyMaxUnlocked = autobuyer.isBuyMaxUnlocked;
      this.limitCelDimBoosts = autobuyer.limitCelDimBoosts;
      this.limitUntilCelGalaxies = autobuyer.limitUntilCelGalaxies;
    }
  }
};
</script>

<template>
  <AutobuyerBox
    :autobuyer="autobuyer"
    :is-modal="isModal"
    :show-interval="!isBuyMaxUnlocked"
    name="Automatic Celestial Dimension Boosts"
  >
    <template
      v-if="isBuyMaxUnlocked"
      #intervalSlot
    >
      <div
        class="c-autobuyer-box__small-text"
      >
        <br>
        {{ $t('autobuyers.activateEvery') }}
      </div>
      <AutobuyerInput
        :autobuyer="autobuyer"
        type="float"
        property="buyMaxInterval"
      />
    </template>
    <template
      v-if="!isBuyMaxUnlocked"
      #checkboxSlot
    >
      <label
        class="o-autobuyer-toggle-checkbox c-autobuyer-box__small-text l-top-margin o-clickable"
      >
        <input
          v-model="limitCelDimBoosts"
          type="checkbox"
          class="o-clickable"
        >
        {{ $t('autobuyers.limitResource', { resource: $t('terms.celestialDimensionBoost', {}, 'plural') }) }}
      </label>
      <AutobuyerInput
        :autobuyer="autobuyer"
        type="int"
        property="maxCelDimBoosts"
      />
    </template>
    <template #toggleSlot>
      <label
        class="o-autobuyer-toggle-checkbox c-autobuyer-box__small-text l-autobuyer-text-area o-clickable"
      >
        <input
          v-model="limitUntilCelGalaxies"
          type="checkbox"
          class="o-clickable"
        >
        <span v-if="isBuyMaxUnlocked">
          {{ $t('autobuyers.celestialBoostWait') }}
        </span>
        <span v-else>
          {{ $t('autobuyers.celestialBoostIgnoreLimit') }}
        </span>
      </label>
      <AutobuyerInput
        :autobuyer="autobuyer"
        type="int"
        property="celGalaxies"
      />
    </template>
  </AutobuyerBox>
</template>

<style scoped>
.l-top-margin {
  margin-top: 0.82rem;
}

.l-dimboost-text-area {
  height: 3rem;
}

.o-clickable {
  cursor: pointer;
}
</style>
