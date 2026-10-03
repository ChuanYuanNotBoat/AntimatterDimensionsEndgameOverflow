<script>
import ModalWrapperChoice from "@/components/modals/ModalWrapperChoice";
import PrimaryButton from "@/components/PrimaryButton";

export default {
  name: "SpeedrunModeModal",
  components: {
    PrimaryButton,
    ModalWrapperChoice,
  },
  data() {
    return {
      onInfoPage: true,
      name: "",
      confirmPhrase: "",
    };
  },
  computed: {
    willStartRun() {
      return this.confirmPhrase === "Gotta Go Fast!";
    },
  },
  methods: {
    nextPage() {
      this.onInfoPage = false;
    },
    startRun() {
      if (!this.willStartRun) return;
      this.emitClose();
      Speedrun.prepareSave(Speedrun.generateName(this.name));
    },
  },
};
</script>

<template>
  <ModalWrapperChoice
    :show-cancel="!onInfoPage && !willStartRun"
    :show-confirm="!onInfoPage && willStartRun"
    confirm-class="o-primary-btn--width-medium c-modal-hard-reset-btn c-modal__confirm-btn"
    @confirm="startRun"
  >
    <template #header>
      Entering Speedrun Mode
    </template>
    <div
      v-if="onInfoPage"
      class="c-modal-message__text"
    >
      {{ $t('ade.a6b4eb3f6fe581bc') }}
      <br>
      <br>
      {{ $t('ade.68e19f91910774e5') }}
      <br>
      <br>
      <i>
        {{ $t('ade.f62ae3f21e7854b2') }}
      </i>
      <br>
      <br>
      <PrimaryButton
        class="o-primary-btn--width-medium c-modal-hard-reset-btn c-modal__confirm-btn"
        @click="nextPage"
      >
        {{ $t('ade.fd19155b7a737651') }}
      </PrimaryButton>
    </div>
    <div
      v-else
      class="c-modal-message__text"
    >
      {{ $t('ade.9ec203eb2c5ac5aa') }}
      <input
        ref="name"
        v-model="name"
        type="text"
        class="c-modal-input c-modal-hard-reset__input"
        @keyup.esc="emitClose"
      >
      <br>
      <br>
      {{ $t('ade.9dfc72b5aa5aa86a') }}
      <br>
      <br>
      {{ $t('ade.f1eaa7c1f4e736be') }}
      <br>
      <br>
      <div class="c-modal-hard-reset-danger">
        {{ $t('ade.4a1398330e9116b1') }}
      </div>
      <input
        ref="confirmPhrase"
        v-model="confirmPhrase"
        type="text"
        class="c-modal-input c-modal-hard-reset__input"
        @keyup.esc="emitClose"
      >
    </div>
    <template #confirm>
      Start Run!
    </template>
    <template #cancel>
      Cancel
    </template>
  </ModalWrapperChoice>
</template>
