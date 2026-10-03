<script>
export default {
  name: "InfinityPointsHeader",
  data() {
    return {
      infinityPoints: new Decimal(),
      isVisible: false
    };
  },
  methods: {
    update() {
      this.infinityPoints.copyFrom(Currency.infinityPoints);
      this.isVisible = PlayerProgress.infinityUnlocked();
    }
  }
};
</script>

<template>
  <div
    v-show="isVisible"
    class="c-infinity-tab__header"
  >
    <LocalizedText id="ade.cd1ff500c8f2ac78">
      <template #p0><span class="c-infinity-tab__infinity-points">{{ $legacyText(_s(format(infinityPoints, 2))) }}</span></template>
      <template #p1>{{ $legacyText(_s(pluralize("Infinity Point",infinityPoints))) }}</template>
    </LocalizedText>
  </div>
</template>

<style scoped>

</style>
