<script>
import ModalWrapperChoice from "@/components/modals/ModalWrapperChoice";

export default {
  name: "TrueEscapeModal",
  components: {
    ModalWrapperChoice
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
      {{ $t("slabdrill.trueEscape.title") }}
    </template>
    <div class="c-modal-message__text">
      {{ $t("slabdrill.trueEscape.message") }}
    </div>
    <template #confirm-text>
      {{ $t("reality.escape.force") }}
    </template>
  </ModalWrapperChoice>
</template>
