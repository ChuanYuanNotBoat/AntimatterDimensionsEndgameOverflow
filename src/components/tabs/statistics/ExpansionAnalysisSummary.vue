<script>
import { CelestialDimensionAnalysis, DivineDimensionAnalysis } from "@/core/secret-formula/multiplier-tab/expansion-dimensions";
import { realityCountEstimate } from "@/core/secret-formula/multiplier-tab/expansion-rewards";

export default {
  name: "ExpansionAnalysisSummary",
  props: {
    resourceKey: { type: String, required: true },
    dimensionTier: { type: Number, default: 0 }
  },
  data() {
    return { state: {} };
  },
  methods: {
    update() {
      const resource = this.resourceKey;
      const state = {};
      if (resource === "CD" || resource === "DD") {
        const analysis = resource === "CD" ? CelestialDimensionAnalysis : DivineDimensionAnalysis;
        state.tiers = formatInt(analysis.activeTiers().length);
        state.tier = formatInt(this.dimensionTier);
      } else if (resource === "RM") {
        state.cap = format(MachineHandler.hardcapRM, 2, 2);
        state.single = format(MachineHandler.gainedRealityMachines, 2, 2);
        state.batch = format(simulatedRealityCount(false).add(1), 2, 2);
        state.available = isRealityAvailable();
        state.full = Currency.realityMachines.gte(MachineHandler.hardcapRM);
        state.passive = InfinityUpgrade.ipGen.isCharged && !Pelle.isDoomed
          ? format(MachineHandler.gainedRealityMachines.timesEffectsOf(InfinityUpgrade.ipGen.chargedEffect), 2, 2)
          : null;
      } else if (resource === "IM" || resource === "DM") {
        const imaginary = resource === "IM";
        const recorded = imaginary ? player.reality.iMCap : player.reality.jMCap;
        const projected = imaginary ? MachineHandler.baseIMCap : MachineHandler.baseDMCap;
        state.recorded = format(recorded, 2, 2);
        state.cap = format(imaginary ? MachineHandler.hardcapIM : MachineHandler.hardcapDM, 2, 2);
        state.projected = format(projected, 2, 2);
        state.peakDiffers = !Decimal.eq(recorded, projected);
      } else if (resource === "realities") {
        const estimate = realityCountEstimate();
        state.expected = format(estimate.expected, 2, 2);
        state.minimum = format(estimate.minimum, 2, 2);
        state.maximum = format(estimate.maximum, 2, 2);
        state.probability = formatPercents(estimate.probability, 2, 2);
        state.available = isRealityAvailable();
      } else if (resource === "endgames") {
        state.available = isEndgameAvailable();
      }
      this.state = state;
    }
  }
};
</script>

<template>
  <div class="c-expansion-analysis-summary">
    <template v-if="resourceKey === 'CD' || resourceKey === 'DD'">
      <p>{{ $t(dimensionTier ? 'analysis.expansion.tierNote' : 'analysis.expansion.overallNote', state) }}</p>
      <p>{{ $t('analysis.expansion.purchaseNote') }}</p>
    </template>
    <template v-else-if="resourceKey === 'RM'">
      <p>{{ $t('analysis.expansion.rmSummary', state) }}</p>
      <p v-if="state.passive !== null">{{ $t('analysis.expansion.rmPassive', state) }}</p>
      <p v-if="state.full">{{ $t('analysis.expansion.rmFull') }}</p>
      <p v-if="!state.available">{{ $t('analysis.expansion.realityUnavailable') }}</p>
    </template>
    <template v-else-if="resourceKey === 'IM' || resourceKey === 'DM'">
      <p>{{ $t('analysis.expansion.capacitySummary', state) }}</p>
      <p>{{ $t('analysis.expansion.capacityNote') }}</p>
      <p v-if="state.peakDiffers">{{ $t('analysis.expansion.peakNote') }}</p>
      <p>{{ $t('analysis.expansion.exponentNote') }}</p>
    </template>
    <template v-else-if="resourceKey === 'realities'">
      <p>{{ $t('analysis.expansion.realityEstimate', state) }}</p>
      <p>{{ $t('analysis.expansion.randomNote') }}</p>
      <p v-if="!state.available">{{ $t('analysis.expansion.realityUnavailable') }}</p>
    </template>
    <template v-else-if="resourceKey === 'endgames'">
      <p>{{ $t('analysis.expansion.endgameNote') }}</p>
      <p v-if="!state.available">{{ $t('analysis.expansion.endgameUnavailable') }}</p>
    </template>
  </div>
</template>

<style scoped>
.c-expansion-analysis-summary {
  width: 100%;
  margin-bottom: 1rem;
  padding: 0.6rem;
  border: 0.1rem solid var(--color-text);
  text-align: left;
  font-size: 1.15rem;
  line-height: 1.5;
}
.c-expansion-analysis-summary p { margin: 0.3rem 0; }
</style>
