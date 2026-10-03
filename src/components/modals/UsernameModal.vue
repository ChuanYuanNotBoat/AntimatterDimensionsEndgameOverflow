<script>
import ModalWrapperChoice from "@/components/modals/ModalWrapperChoice";

export default {
  name: "UsernameModal",
  components: {
    ModalWrapperChoice
  },
  data() {
    return {
      hasSeenModal: false,
      input: "",
      username: ""
    };
  },
  computed: {
    notEmpty() {
      return this.input !== "";
    },
  },
  methods: {
    saveUsername() {
      if (this.notEmpty) this.username = this.input;
      if (this.notEmpty) player.username = this.username;
      if (this.notEmpty) this.hasSeenModal = true;
      this.input = "";
      player.options.hasSeenUsernameModal = this.hasSeenModal;
      if (player.options.hasSeenUsernameModal) player.introFrozen = false;
    },
  },
};
</script>

<template>
  <ModalWrapperChoice
    :show-cancel="!notEmpty"
    :show-confirm="notEmpty"
    confirm-class="o-primary-btn--width-medium c-modal__confirm-btn c-modal-username-btn"
    @confirm="saveUsername"
  >
    <template #header>
      ENTER USERNAME
    </template>
    <div class="c-modal-message__text">
      {{ $t('ade.e65d6dc1ef77828e') }}
      <span class="c-modal-username-danger">{{ $t('ade.868eaff87fd7c191') }}</span>
      {{ $t('ade.3426051e3d0c639c') }}
      <div class="c-modal-username-danger">
        {{ $t('ade.301a62b9206692ea') }}
      </div>
    </div>
    <input
      ref="input"
      v-model="input"
      type="text"
      class="c-modal-input c-modal-username__input"
      @keyup.esc="emitClose"
    >
    <div class="c-modal-username-info">
      <div
        v-if="notEmpty"
        class="c-modal-username-danger"
      >
        {{ $t('ade.2d0e0630cf5a660a') }}
      </div>
      <div v-else>
        {{ $t('ade.fddf2cefcbedcd68') }}
      </div>
    </div>
    <template #confirm-text>
      CONFIRM
    </template>
  </ModalWrapperChoice>
</template>
