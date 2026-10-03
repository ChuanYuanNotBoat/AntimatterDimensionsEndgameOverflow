<script>
export default {
  name: "BlackHoleStateRow",
  props: {
    blackHole: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      isUnlocked: false,
      isPermanent: false,
      isActive: false,
      isCharged: false,
      nextChange: "",
      state: "",
    };
  },
  computed: {
    description() {
      return this.blackHole.description(true);
    },
    id() {
      return this.blackHole.id;
    }
  },
  methods: {
    update() {
      const { blackHole } = this;
      this.isUnlocked = blackHole.isUnlocked;
      if (!this.isUnlocked) return;
      this.isPermanent = blackHole.isPermanent;
      this.isActive = blackHole.isActive;
      this.isCharged = blackHole.isCharged;
      this.nextChange = TimeSpan.fromSeconds(new Decimal(blackHole.timeWithPreviousActiveToNextStateChange)).toStringShort();
      this.state = blackHole.displayState;
    }
  }
};
</script>

<template>
  <h3 v-if="isUnlocked">
    {{ $t('ade.e894551e179e8eae', { p0: $legacyText(_s(description)) }) }}
    <template v-if="isPermanent">
      {{ $t('ade.16e80fe0d5ebc50c') }}
    </template>
    <template v-else-if="isActive">
      {{ $t('ade.c7a26c915b9fbe63', { p0: $legacyText(_s(nextChange)) }) }}
    </template>
    <template v-else-if="id === 2 && isCharged">
      {{ $t('ade.7fe9cc7f927d11b2', { p0: $legacyText(_s(nextChange)) }) }}
    </template>
    <template v-else>
      {{ $t('ade.6b333b36e09875a7', { p0: $legacyText(_s(nextChange)) }) }}
    </template>
  </h3>
</template>

<style scoped>

</style>
