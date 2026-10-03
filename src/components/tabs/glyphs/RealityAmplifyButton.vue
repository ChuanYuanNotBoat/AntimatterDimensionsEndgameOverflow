<script>
export default {
  name: "RealityAmplifyButton",
  data: () => ({
    isDoomed: false,
    isVisible: false,
    isDisabled: false,
    isActive: false,
    ratio: 1,
    canAmplify: false,
  }),
  computed: {
    tooltip() {
      if (this.isDoomed) return "You cannot amplify a Doomed Reality";
      if (this.isDisabled) return "You cannot amplify Celestial Realities";
      if (!this.canAmplify) {
        return "Store more real time or complete the Reality faster to amplify";
      }
      return null;
    },
    buttonClass() {
      return {
        "l-reality-amplify-button": true,
        "l-reality-amplify-button--clickable": !this.isDoomed && this.canAmplify,
        "o-enslaved-mechanic-button--storing-time": this.isActive,
      };
    }
  },
  methods: {
    update() {
      this.isDoomed = Pelle.isDoomed;
      this.isVisible = Enslaved.isUnlocked;
      this.isDisabled = isInCelestialReality();
      this.isActive = Enslaved.boostReality;
      this.ratio = Enslaved.realityBoostRatio;
      this.canAmplify = Enslaved.canAmplify;
    },
    toggleActive() {
      if (!this.canAmplify) return;
      Enslaved.boostReality = !Enslaved.boostReality;
    }
  }
};
</script>

<template>
  <button
    v-if="isVisible"
    :class="buttonClass"
    :ach-tooltip="$legacyText(tooltip)"
    @click="toggleActive"
  >
    <div v-if="isDoomed">
      {{ $t('ade.daa4ec4baa9c5e83') }}
    </div>
    <div v-else-if="canAmplify">
      <LocalizedText id="ade.e1126e64a70afaa6">
    <template #p0><span v-if="isActive">{{ $t('ade.4316d79b99843de0') }}</span>
<span v-else>{{ $t('ade.864564e4113a1a02') }}</span></template>
    <template #p1><br></template>
    <template #p2>{{ $legacyText(_s(formatInt(ratio))) }}</template>
  </LocalizedText>
    </div>
    <div v-else>
      {{ $t('ade.fade8e78315d2c14') }}
    </div>
  </button>
</template>

<style scoped>

</style>
