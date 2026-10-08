<script>
import ExpandingControlBox from "@/components/ExpandingControlBox";

export default {
  name: "SlabdrillHuntFactors",
  components: { ExpandingControlBox },
  data: () => ({ factors: {}, interval: "", cores: "", stage: "", expectedAmount: "", expectedUnit: "s",
    zeroChance: false }),
  methods: {
    update() {
      this.factors = Slabdrill.huntChanceFactors;
      this.cores = formatInt(Slabdrill.cores);
      this.stage = formatInt(Slabdrill.currentStage);
      this.interval = format(Slabdrill.huntInterval, 0, 2);
      // Match the Number probability used by hunt(), including underflow to zero.
      const chance = Slabdrill.huntChance;
      this.zeroChance = chance === 0;
      if (this.zeroChance) return;
      const milliseconds = new Decimal(Slabdrill.huntInterval).div(chance);
      const units = [["yr", 31557600000], ["d", 86400000], ["h", 3600000], ["min", 60000], ["s", 1000]];
      const [unit, divisor] = units.find(([, duration]) => milliseconds.gte(duration)) ?? ["ms", 1];
      this.expectedUnit = unit;
      this.expectedAmount = format(milliseconds.div(divisor), 2, 2);
    }
  },
  created() { this.update(); }
};
</script>

<template>
  <div class="c-hunt-factors-container">
    <ExpandingControlBox container-class="c-hunt-factors" :label="$t('analysis.hunt.title')">
      <template #dropdown>
        <p>{{ $t('analysis.hunt.inputs', { cores, stage }) }}</p>
        <table>
          <tbody>
            <tr><th>{{ $t('analysis.hunt.base') }}</th><td>1 / 10,000</td></tr>
            <tr><th>{{ $t('analysis.hunt.cores') }}</th><td>{{ formatX(factors.cores, 2, 2) }}</td></tr>
            <tr><th>{{ $t('analysis.hunt.stage') }}</th><td>{{ formatX(factors.stage, 2, 2) }}</td></tr>
            <tr><th>{{ $t('analysis.hunt.antimatter') }}</th><td>{{ formatX(factors.antimatter, 2, 2) }}</td></tr>
            <tr><th>{{ $t('analysis.hunt.dilation') }}</th><td>{{ formatX(factors.dilation, 2, 2) }}</td></tr>
            <tr><th>{{ $t('analysis.hunt.reality') }}</th><td>{{ formatX(factors.reality, 2, 2) }}</td></tr>
            <tr><th>{{ $t('analysis.hunt.raw') }}</th><td>{{ formatDecimalPercents(factors.raw, 2, 2) }}</td></tr>
            <tr><th>{{ $t('analysis.hunt.final') }}</th><td>{{ formatDecimalPercents(factors.final, 2, 2) }}</td></tr>
          </tbody>
        </table>
        <p>{{ $t('analysis.hunt.interval', { interval }) }}</p>
        <p class="c-hunt-expected-time">
          {{ zeroChance ? $t('analysis.hunt.expectedZero')
            : $t('analysis.hunt.expected.' + expectedUnit, { amount: expectedAmount }) }}
        </p>
        <p class="c-hunt-factors-note">{{ $t('analysis.hunt.expectedNote') }}</p>
        <p class="c-hunt-factors-note">{{ $t('analysis.hunt.note') }}</p>
      </template>
    </ExpandingControlBox>
  </div>
</template>

<style scoped>
.c-hunt-factors-container { margin: 1rem auto; width: 48rem; max-width: 100%; }
.c-hunt-factors-container ::v-deep .c-hunt-factors {
  position: relative; left: auto; transform: none; width: 100%;
  padding: 0.5rem; border: 0.2rem solid var(--color-slabdrill--base); border-radius: 0.5rem;
  color: var(--color-text); background: var(--color-text-inverted); font-weight: bold;
}
table { width: 100%; border-collapse: collapse; }
th { text-align: left; font-weight: normal; }
td { padding-left: 2rem; text-align: right; }
th, td { padding-top: 0.3rem; padding-bottom: 0.3rem; }
p { margin: 0.5rem 0; }
.c-hunt-factors-note { max-width: 42rem; font-weight: normal; font-size: 1.1rem; }
</style>
