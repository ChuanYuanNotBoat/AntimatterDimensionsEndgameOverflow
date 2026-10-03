<script>
import DualityUpgradeButton from "./DualityUpgradeButton";

export default {
  name: "DualityUpgradesTab",
  components: {
    DualityUpgradeButton
  },
  data() {
    return {
      baseIMCap: new Decimal(),
      capIM: new Decimal(),
      scaleTime: 0,
      capStr: "",
      showingRows: 5
    };
  },
  computed: {
    upgrades: () => DualityUpgrades.all,
    lockTooltip: () => `Requirement locks only prevent manual and automated actions. Any related upgrades
      will not be disabled and may still cause requirements to be failed.`,
  },
  methods: {
    update() {
      this.baseIMCap.copyFrom(MachineHandler.baseIMHardcap);
      this.capIM.copyFrom(MachineHandler.hardcapIM);
      this.scaleTime = MachineHandler.scaleTimeForDM;
      this.capStr = formatMachines(MachineHandler.hardcapRM, MachineHandler.currentIMCap, MachineHandler.currentDMCap);
      this.showingRows = Slabdrill.isDestroyed ? 6 : 5;
    },
    id(row, column) {
      return (row - 1) * 5 + column - 1;
    }
  }
};
</script>

<template>
  <div class="l-reality-upgrade-grid">
    <div class="c-cap-text">
      <LocalizedText id="ade.345f6b460a51288a">
        <template #p0><span class="c-reality-tab__reality-machines">{{ $legacyText(_s(capStr)) }}</span></template>
      </LocalizedText>
    </div>
    <div class="c-info-text">
      <LocalizedText id="ade.a948b1d708de3d18">
        <template #p0>{{ $legacyText(_s(format(capIM))) }}</template>
        <template #p1><br></template>
        <template #p2>{{ $legacyText(_s(format(baseIMCap))) }}</template>
        <template #p3><br></template>
        <template #p4><br></template>
        <template #p5>{{ $legacyText(_s(formatInt(scaleTime))) }}</template>
        <template #p6><br></template>
        <template #p7><br></template>
        <template #p8><br></template>
        <template #p9><span :ach-tooltip="lockTooltip">
        <i class="fas fa-question-circle" />
      </span></template>
      </LocalizedText>
    </div>
    <div
      v-for="row in showingRows"
      :key="row"
      class="l-reality-upgrade-grid__row"
    >
      <DualityUpgradeButton
        v-for="column in 5"
        :key="id(row, column)"
        :upgrade="upgrades[id(row, column)]"
      />
    </div>
  </div>
</template>

<style scoped>
.c-cap-text {
  color: var(--color-text);
  font-size: 1.5rem;
}

.c-info-text {
  color: var(--color-text);
  margin: 1.5rem;
}
</style>
