<script>
import ExpandingControlBox from "@/components/ExpandingControlBox";

export default {
  name: "SlabdrillHuntFactors",
  components: { ExpandingControlBox },
  data: () => ({ factors: {}, interval: "", cores: "", stage: "", expectedDays: "", expectedClock: "00:00:00",
    hasExpectedDays: false,
    zeroChance: false }),
  computed: {
    finalProbability() {
      return `${new Decimal(this.factors.final ?? 0).times(100).toFixed(5)}%`;
    }
  },
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
      const span = TimeSpan.fromMilliseconds(milliseconds.lt(1000)
        ? milliseconds : milliseconds.div(1000).round().times(1000));
      this.hasExpectedDays = span.totalDays.gte(1);
      this.expectedDays = formatInt(span.totalDays.floor());
      const pad = value => value.toFixed(0).padStart(2, "0");
      // Beyond integer-second precision, sub-day digits cannot be recovered reliably.
      if (span.totalSeconds.gte(1e15)) this.expectedClock = "00:00:00";
      else {
        const seconds = milliseconds.lt(1000) ? span.totalSeconds.toFixed(2).padStart(5, "0") : pad(span.seconds);
        this.expectedClock = `${pad(span.hours)}:${pad(span.minutes)}:${seconds}`;
      }
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
            <tr><th>{{ $t('analysis.hunt.final') }}</th><td class="c-hunt-final-probability">{{ finalProbability }}</td></tr>
          </tbody>
        </table>
        <p>{{ $t('analysis.hunt.interval', { interval }) }}</p>
        <div class="c-hunt-expected-time">
          <span class="c-hunt-expected-time__label">{{ $t('analysis.hunt.expectedTitle') }}</span>
          <strong class="c-hunt-expected-time__value">
            {{ zeroChance ? '∞' : hasExpectedDays
              ? $t('analysis.hunt.expectedDurationDays', { days: expectedDays, clock: expectedClock }) : expectedClock }}
          </strong>
          <span class="c-hunt-expected-time__format">
            {{ $t(zeroChance ? 'analysis.hunt.expectedZeroReason' : 'analysis.hunt.clockFormat') }}
          </span>
        </div>
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
.c-hunt-final-probability { font-variant-numeric: tabular-nums; }
.c-hunt-expected-time {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
  margin: 0.8rem 0;
  padding: 0.7rem 0.5rem;
  border-top: 0.1rem solid var(--color-slabdrill--base);
  border-bottom: 0.1rem solid var(--color-slabdrill--base);
  text-align: center;
}
.c-hunt-expected-time__label { font-size: 1.15rem; font-weight: normal; }
.c-hunt-expected-time__value { font-size: 1.8rem; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
.c-hunt-expected-time__format { font-size: 1rem; font-weight: normal; opacity: 0.8; }
</style>
