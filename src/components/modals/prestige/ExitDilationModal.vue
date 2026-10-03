<script>
import FullScreenAnimationHandler from "@/core/full-screen-animation-handler";

import ModalWrapperChoice from "@/components/modals/ModalWrapperChoice";

export default {
  name: "ExitDilationModal",
  components: {
    ModalWrapperChoice
  },
  data() {
    return {
      tachyonGain: new Decimal(0),
      isDoomed: false
    };
  },
  computed: {
    gainText() {
      if (this.tachyonGain.lte(0)) return `not gain anything`;
      return `gain ${quantify("Tachyon Particle", this.tachyonGain, 2, 1)}`;
    },
    isInEC() {
      return Player.anyChallenge instanceof EternityChallengeState;
    },
    confirmText() {
      return this.isDoomed ? "Okay" : "Exit";
    }
  },
  methods: {
    update() {
      // We force-close the modal if dilation is inactive because there are a few edge cases which allow it to be
      // opened while switching between dilated/regular. The only thing this results in is an incorrect TP gain value
      if (!player.dilation.active) this.emitClose();
      this.tachyonGain.copyFrom(getTachyonGain(true));
      this.isDoomed = Pelle.isDoomed && !PelleStrikes.dilation.isDestroyed();
    },
    handleYesClick() {
      if (!player.dilation.active) return;
      const playAnimation = player.options.animations.dilation && !FullScreenAnimationHandler.isDisplaying;
      if (playAnimation) {
        animateAndUndilate();
      } else {
        eternity(false, false, { switchingDilation: true });
      }
    },
  },
};
</script>

<template>
  <ModalWrapperChoice
    option="dilation"
    @confirm="handleYesClick"
  >
    <template #header>
      <span v-if="isDoomed">
        You cannot exit Dilation while Doomed
      </span>
      <span v-else>
        You are about to exit Dilation
      </span>
    </template>
    <div class="c-modal-message__text">
      <span v-if="isDoomed">
        {{ $t('ade.48bc5a1157e6c755', { p0: $legacyText(_s(gainText)) }) }}
      </span>
      <span v-else>
        {{ $t('ade.df24695bb7c5abc8', { p0: $legacyText(_s(gainText)) }) }}
      </span>
      <div v-if="isInEC">
        {{ $t('ade.c123506602b9e371') }}
      </div>
      <br>
      {{ $t('ade.a4d500e55df8919f') }}
    </div>
    <template #confirm-text>
      {{ confirmText }}
    </template>
  </ModalWrapperChoice>
</template>
