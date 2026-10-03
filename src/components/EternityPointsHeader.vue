<script>
export default {
  name: "EternityPointsHeader",
  data() {
    return {
      eternityPoints: new Decimal()
    };
  },
  methods: {
    update() {
      this.eternityPoints.copyFrom(Currency.eternityPoints.value.floor());
    }
  }
};
</script>

<template>
  <div class="c-eternity-tab__header">
    <LocalizedText id="ade.cd1ff500c8f2ac78">
      <template #p0><span class="c-eternity-tab__eternity-points">{{ $legacyText(_s(format(eternityPoints, 2))) }}</span></template>
      <template #p1>{{ $legacyText(_s(pluralize("Eternity Point",eternityPoints))) }}</template>
    </LocalizedText>
  </div>
</template>

<style scoped>

</style>
