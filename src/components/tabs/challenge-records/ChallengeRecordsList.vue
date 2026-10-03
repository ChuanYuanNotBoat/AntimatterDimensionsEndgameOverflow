<script>
export default {
  name: "ChallengeRecordsList",
  props: {
    name: {
      type: String,
      required: true
    },
    start: {
      type: Number,
      required: true
    },
    times: {
      type: Array,
      required: true
    }
  },
  computed: {
    timeSum() {
      return this.times.decimalSum();
    },
    completedAllChallenges() {
      return this.timeSum.lt(DC.BEMAX);
    }
  },
  methods: {
    timeDisplayShort,
    completionString(time) {
      return time.lt(DC.BEMAX)
        ? `record time: ${timeDisplayShort(time)}`
        : "has not yet been completed";
    }
  }
};
</script>

<template>
  <div>
    <br>
    <div
      v-for="(time, i) in times"
      :key="i"
    >
      <span>{{ $legacyText(_s(name)) }} {{ $legacyText(_s(start + i)) }} {{ $legacyText(_s(completionString(time))) }}</span>
    </div>
    <br>
    <div v-if="completedAllChallenges">
      {{ $t('ade.a0242fe7b9069789', { p0: $legacyText(_s(name)), p1: $legacyText(_s(timeDisplayShort(timeSum))) }) }}
    </div>
    <div v-else>
      {{ $t('ade.91dc6177fc117c24', { p0: $legacyText(_s(name)) }) }}
    </div>
  </div>
</template>
