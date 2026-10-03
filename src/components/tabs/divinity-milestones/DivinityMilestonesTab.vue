<script>
import DivinityMilestoneButton from "./DivinityMilestoneButton";

export default {
  name: "DivinityMilestonesTab",
  components: {
    DivinityMilestoneButton
  },
  data() {
    return {
      divinityCount: new Decimal(0),
      showNewFeature: false
    };
  },
  computed: {
    milestones() {
      return Object.values(GameDatabase.celestials.divinityMilestones)
        .sort((a, b) => a.divinities - b.divinities)
        .map(config => new DivinityMilestoneState(config));
    },
    rows() {
      return Math.ceil(this.milestones.length);
    }
  },
  methods: {
    update() {
      this.divinityCount = Currency.divinities.value.floor();
      this.showNewFeature = this.divinityCount.gte(10) && this.divinityCount.lt(13);
    },
    getMilestone(row, column) {
      return () => this.milestones[(row - 1) + column - 1];
    }
  }
};
</script>

<template>
  <div class="l-divinity-milestone-grid">
    <div class="o-divinity-amount">{{ $t('ade.ae5c9b4f89fb6342', { p0: $legacyText(_s(quantify("Divinity",divinityCount,3))) }) }}</div>
    <div
      v-for="row in rows"
      :key="row"
      class="l-divinity-milestone-grid__row"
    >
      <DivinityMilestoneButton
        v-for="column in 1"
        :key="row + column"
        :get-milestone="getMilestone(row, column)"
        class="l-divinity-milestone-grid__cell"
      />
    </div>
    <div v-if="showNewFeature">
      <span class="o-divinity-amount">{{ $t('ade.df67139800597fd0', { p0: $legacyText(_s(formatInt(13))) }) }}</span>
    </div>
  </div>
</template>

<style scoped>
.o-divinity-amount {
  color: var(--color-pelle--base);
}
</style>
