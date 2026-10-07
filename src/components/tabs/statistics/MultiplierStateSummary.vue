<script>
import { multiplierStateNotes } from "@/core/secret-formula/multiplier-tab/state-audit";

export default {
  name: "MultiplierStateSummary",
  props: { resourceKey: { type: String, required: true } },
  data() {
    return { notes: [] };
  },
  methods: {
    update() {
      this.notes = multiplierStateNotes(this.resourceKey);
    }
  }
};
</script>

<template>
  <div v-if="notes.length" class="c-multiplier-state-summary">
    <b>{{ $t('analysis.state.title') }}</b>
    <p v-for="note in notes" :key="note">{{ $legacyText(_s(note)) }}</p>
  </div>
</template>

<style scoped>
.c-multiplier-state-summary {
  box-sizing: border-box;
  width: 100%;
  margin-bottom: 0.6rem;
  padding: 0.7rem;
  border: 0.1rem solid var(--color-text);
  color: var(--color-text);
  text-align: left;
  font-size: 1.12rem;
  line-height: 1.45;
}
.c-multiplier-state-summary p { margin: 0.4rem 0 0; }
</style>
