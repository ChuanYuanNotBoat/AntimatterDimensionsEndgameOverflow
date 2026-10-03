<script>
import ModalWrapperChoice from "@/components/modals/ModalWrapperChoice";

export default {
  name: "ExitChallengeModal",
  components: {
    ModalWrapperChoice
  },
  props: {
    challengeName: {
      type: String,
      required: true,
    },
    normalName: {
      type: String,
      required: true,
    },
    hasHigherLayers: {
      type: Boolean,
      required: true,
    },
    exitFn: {
      type: Function,
      required: true,
    }
  },
  computed: {
    isCelestial() {
      return this.challengeName.match("Reality");
    },
    isRestarting() {
      return this.isCelestial ? player.options.retryCelestial : player.options.retryChallenge;
    }
  },
  methods: {
    handleYesClick() {
      this.exitFn();
      EventHub.ui.offAll(this);
    }
  },
};
</script>

<template>
  <ModalWrapperChoice
    option="exitChallenge"
    @confirm="handleYesClick"
  >
    <template #header>
      You are about to {{ isRestarting ? "restart" : "exit" }} {{ challengeName }}
    </template>

    <div class="c-modal-message__text">
      <span v-if="isRestarting">
        {{ $t('ade.844e063c122338c3', { p0: $legacyText(_s(challengeName)) }) }}
      </span>
      <span v-else>
        {{ $t('ade.766be5e6bc7a1642', { p0: $legacyText(_s(normalName)) }) }}
      </span>
      <span v-if="hasHigherLayers">
        {{ $t('ade.903fefd81c40e492') }}
      </span>
    </div>
    <template #confirm-text>
      {{ isRestarting ? "Restart" : "Exit" }}
    </template>
  </ModalWrapperChoice>
</template>
