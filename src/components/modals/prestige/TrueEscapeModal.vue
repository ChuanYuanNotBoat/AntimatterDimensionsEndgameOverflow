<script>
import ModalWrapperChoice from "@/components/modals/ModalWrapperChoice";

export default {
  name: "TrueEscapeModal",
  components: {
    ModalWrapperChoice
  },
  computed: {
    message() {
      return `In the midst of the chaos, you broke free of Slabdrill's grip. You can now truly escape.`;
    },
    entranceLabel() {
      return `SLABDRILL'S REALITY IS COLLAPSING`;
    }
  },
  methods: {
    handleYesClick() {
      if (!Slabdrill.isCursed || Slabdrill.coreActive || Slabdrill.currentStage < Slabdrill.layerReqs.length) return;
      const escapingPlayer = player;
      runRealityAnimation();
      setTimeout(() => { if (player === escapingPlayer) Slabdrill.warpToPelleDomain(); }, 3000);
      setTimeout(() => { if (player === escapingPlayer && Slabdrill.isDestroyed) Slabdrill.quotes.ending.show(); }, 10000);
      setTimeout(() => { if (player === escapingPlayer && Slabdrill.isDestroyed) Elemental.quotes.celPlus.show(); }, 11000);
    },
  },
};
</script>

<template>
  <ModalWrapperChoice
    @confirm="handleYesClick"
  >
    <template #header>
      {{ entranceLabel }}
    </template>
    <div class="c-modal-message__text">
      {{ $legacyText(_s(message)) }}
    </div>
    <template #confirm-text>
      ESCAPE
    </template>
  </ModalWrapperChoice>
</template>
