<script>
export default {
  name: "CompressionButton",
  data() {
    return {
      isUnlocked: false,
      isRunning: false,
      hasGain: false,
      requiredForGain: new Decimal(),
      canInfinity: false,
      infinityGoal: new Decimal(),
      hawkingRadiationGain: new Decimal(),
      creditsClosed: false,
      gainSpaces: 0
    };
  },
  methods: {
    update() {
      this.isUnlocked = PlayerProgress.compressionUnlocked();
      this.isRunning = player.compression.active;
      if (!this.isRunning) return;
      this.canInfinity = Player.canCrunch;
      // This lets this.hasGain be true even before infinity.
      this.hasGain = getHawkingRadiationGain(false).gt(0);
      if (this.canInfinity && this.hasGain) {
        this.hawkingRadiationGain.copyFrom(getHawkingRadiationGain(true));
      } else if (this.canInfinity) {
        this.requiredForGain.copyFrom(getHawkingRadiationReq());
      } else {
        this.infinityGoal.copyFrom(Player.infinityGoal);
      }
      this.creditsClosed = GameEnd.creditsEverClosed;
      this.gainSpaces = this.hawkingRadiationGain.lt(1) ? 3 : (this.hawkingRadiationGain.lt(10) ? 2 : 1);
    },
    compress() {
      if (this.creditsClosed) return;
      startCompressionRequest();
    }
  }
};
</script>

<template>
  <button
    class="o-compression-btn"
    :class="isUnlocked ? 'o-compression-btn--unlocked' : 'o-compression-btn--locked'"
    @click="compress()"
  >
    <span v-if="!isUnlocked">{{ $t('ade.de04861c6cf362b5') }}</span>
    <span v-else-if="!isRunning">{{ $t('ade.da34047c54c86b96') }}</span>
    <span v-else-if="canInfinity && hasGain">
      <LocalizedText id="compression.exitGain">
        <template #p0><br></template>
        <template #p1>{{ $legacyText(quantify("Hawking Radiation", hawkingRadiationGain, 2, gainSpaces)) }}</template>
      </LocalizedText>
    </span>
    <span v-else-if="canInfinity">
      <LocalizedText id="compression.exitNeed">
        <template #p0><br></template>
        <template #p1>{{ format(requiredForGain, 2, 1) }}</template>
      </LocalizedText>
    </span>
    <span v-else>
      <LocalizedText id="compression.exitBeforeInfinity">
        <template #p0><br></template>
        <template #p1>{{ $legacyText(quantify("Antimatter", infinityGoal, 1, 0)) }}</template>
      </LocalizedText>
    </span>
  </button>
</template>

<style scoped>

</style>
