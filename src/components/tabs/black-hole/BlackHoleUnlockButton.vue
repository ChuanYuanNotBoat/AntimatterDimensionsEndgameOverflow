<script>
export default {
  name: "BlackHoleUnlockButton",
  data() {
    return {
      canBeUnlocked: false,
    };
  },
  computed: {
    classObject() {
      return {
        "c-reality-upgrade-btn--unavailable": !this.canBeUnlocked
      };
    },
  },
  methods: {
    update() {
      this.canBeUnlocked = BlackHoles.canBeUnlocked;
    },
    unlock() {
      BlackHoles.unlock();
      this.$emit("blackholeunlock");
    }
  }
};
</script>

<template>
  <button
    :class="classObject"
    class="l-reality-upgrade-btn c-reality-upgrade-btn c-reality-upgrade-btn--black-hole-unlock"
    @click="unlock"
  >
    <LocalizedText id="ade.cbfa8c10c6ad99a0">
      <template #p0><br></template>
      <template #p1>{{ $legacyText(_s(formatInt(100))) }}</template>
    </LocalizedText>
  </button>
</template>

<style scoped>

</style>
