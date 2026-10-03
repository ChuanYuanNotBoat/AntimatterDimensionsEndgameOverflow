<script>
import ModalWrapperChoice from "@/components/modals/ModalWrapperChoice";

export default {
  name: "RealityWarpModal",
  components: {
    ModalWrapperChoice
  },
  data() {
    return {
      isWarping: false
    };
  },
  computed: {
    topLabel() {
      if (!this.isWarping) return `You are about to Enter Pelle's Domain`;
      return `You are about to Curse your Reality`;
    },
    message() {
      if (!this.isWarping) return `Entering Pelle's Domain will force an Endgame reset and unlock a new layer of game content.`;
      return `Cursing your Reality will force an Endgame reset and disable almost everything in the game to this point.
      You will not be able to leave the Cursed Reality.`;
    }
  },
  methods: {
    update() {
      this.isWarping = player.celestials.slabdrill.isWarping;
    },
    handleYesClick() {
      if (canStartEndgameChallenge() && !Slabdrill.isDestroyed &&
          CelestialEternityPlusUpgrade.oldStoneSlabAndSteelDrill.isBought) {
        player.celestials.slabdrill.isWarping = true;
        player.celestials.slabdrill.warpTick = 0;
      }
    },
  },
};
</script>

<template>
  <ModalWrapperChoice
    @confirm="handleYesClick"
  >
    <template #header>
      {{ topLabel }}
    </template>
    <div class="c-modal-message__text">
      {{ $legacyText(_s(message)) }}
    </div>
  </ModalWrapperChoice>
</template>
