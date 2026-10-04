<script>
export default {
  name: "SlabdrillStrike",
  props: {
    getUnlock: {
      type: Function,
      required: true
    }
  },
  computed: {
    unlock() {
      return this.getUnlock();
    }
  }
};
</script>

<template>
  <div class="l-slabdrill-celestial-tab">
    <button
      v-if="unlock"
      class="o-slabdrill-milestone__reward"
    >
      <span class="o-slabdrill-milestone__default">
        <span class="l-slabdrill-header__large">𓆗</span>
      </span>
      <span class="o-slabdrill-milestone__text">
        <span class="l-slabdrill-header">{{ $t('ade.7a3a9ff6b95373aa', { p0: $legacyText(_s(unlock.requirement)), p1: $legacyText(unlock.name) }) }}</span>
        <br>
        <br>
        <span class="l-slabdrill-header">{{ $t('ade.443c9df4d959f623', { p0: $legacyText(unlock.nerfDescription()) }) }}</span>
        <br>
        <br>
        <span class="l-slabdrill-header">{{ $t('ade.0ffb9adca98f7808', { p0: $legacyText(unlock.buffDescription()) }) }}</span>
      </span>
    </button>
  </div>
</template>

<style scoped>
.l-slabdrill-celestial-tab {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.l-slabdrill-header {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--color-slabdrill--base);
  margin: 1rem;
}

.l-slabdrill-header__large {
  font-size: 20rem;
  font-weight: bold;
  color: var(--color-slabdrill--base);
  margin: 1rem;
}
</style>
