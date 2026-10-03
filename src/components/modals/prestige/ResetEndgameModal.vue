<script>
import ModalWrapperChoice from "@/components/modals/ModalWrapperChoice";

export default {
  name: "ResetEndgameModal",
  components: {
    ModalWrapperChoice
  },
  props: {
    endgameState: {
      type: String,
      required: true,
    },
    suggestion: {
      type: String,
      required: true,
    }
  },
  data() {
    return {
      isDoomed: false,
      canEndgame: false,
    };
  },
  computed: {
    resetTerm() { return "Endgame"; },
  },
  methods: {
    update() {
      this.isDoomed = Pelle.isDoomed;
      this.canEndgame = isEndgameAvailable();
    },
    handleYesClick() {
      Endgame.resetNoReward();
      EventHub.ui.offAll(this);
    }
  },
};
</script>

<template>
  <ModalWrapperChoice
    option="resetEndgame"
    @confirm="handleYesClick"
  >
    <template #header>
      You are about to reset your {{ resetTerm }}
    </template>
    <div class="c-modal-message__text">
      <LocalizedText id="ade.b6e25f9c7e8763d2">
        <template #p0>{{ $legacyText(_s(resetTerm)) }}</template>
        <template #p1>{{ $legacyText(_s(resetTerm)) }}</template>
        <template #p2><br></template>
        <template #p3><br></template>
        <template #p4><br></template>
        <template #p5>{{ $legacyText(_s(endgameState)) }}</template>
        <template #p6>{{ $legacyText(_s(suggestion)) }}</template>
        <template #p7><br></template>
      </LocalizedText>
    </div>
    <template #confirm-text>
      Reset
    </template>
  </ModalWrapperChoice>
</template>

<style scoped>

</style>
