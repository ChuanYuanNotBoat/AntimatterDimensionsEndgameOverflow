<script>
import ModalWrapperChoice from "@/components/modals/ModalWrapperChoice";

export default {
  name: "ResetRealityModal",
  components: {
    ModalWrapperChoice
  },
  data() {
    return {
      isDoomed: false,
      canReality: false,
    };
  },
  computed: {
    resetTerm() { return this.isDoomed ? "Armageddon" : "Reality"; },
  },
  methods: {
    update() {
      this.isDoomed = Pelle.isDoomed;
      this.canReality = isRealityAvailable();
    },
    handleYesClick() {
      beginProcessReality(getRealityProps(true));
      EventHub.ui.offAll(this);
    }
  },
};
</script>

<template>
  <ModalWrapperChoice
    option="resetReality"
    @confirm="handleYesClick"
  >
    <template #header>
      You are about to reset your {{ resetTerm }}
    </template>
    <div class="c-modal-message__text">
      {{ $t('ade.ea6bd19db21dd3de', { p0: $legacyText(_s(resetTerm)), p1: $legacyText(_s(resetTerm)) }) }}
      <br>
      <br>
      Are you sure you want to do this?
      <div
        v-if="canReality"
        class="c-has-rewards"
      >
        <LocalizedText id="ade.552ef35d1d9c2445">
    <template #p0><br></template>
  </LocalizedText>
      </div>
      <br>
    </div>
    <template #confirm-text>
      Reset
    </template>
  </ModalWrapperChoice>
</template>

<style scoped>
.c-has-rewards {
  font-weight: bold;
  font-size: 1.5rem;
  color: var(--color-bad);
}
</style>
