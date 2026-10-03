<script>
import ModalWrapperChoice from "@/components/modals/ModalWrapperChoice";

export default {
  name: "HardResetModal",
  components: {
    ModalWrapperChoice
  },
  data() {
    return {
      input: ""
    };
  },
  computed: {
    willHardReset() {
      return this.input === "Shrek is love, Shrek is life";
    },
    hasExtraNG() {
      return player.records.fullGameCompletions > 0;
    },
    hasSpeedrun() {
      return player.speedrun.isUnlocked;
    }
  },
  destroyed() {
    if (this.willHardReset) SecretAchievement(38).unlock();
  },
  methods: {
    hardReset() {
      if (this.willHardReset) GameStorage.hardReset();
      this.input = "";
    },
  },
};
</script>

<template>
  <ModalWrapperChoice
    :show-cancel="!willHardReset"
    :show-confirm="willHardReset"
    confirm-class="o-primary-btn--width-medium c-modal__confirm-btn c-modal-hard-reset-btn"
    @confirm="hardReset"
  >
    <template #header>
      HARD RESET
    </template>
    <div class="c-modal-message__text">
      {{ $t('ade.c5c57bc70944a425') }}
      <span class="c-modal-hard-reset-danger">{{ $t('ade.29fe27d03300647d') }}</span>
      {{ $t('ade.142f352eae3fa166') }}
      <div class="c-modal-hard-reset-danger">
        <LocalizedText id="ade.35b8af5940fc0a96">
          <template #p0><span v-if="hasExtraNG">
          <br>
          {{ $t('ade.776765326dad2152') }}
        </span></template>
          <template #p1><span v-if="hasSpeedrun">
          <br>
          {{ $t('ade.e01c54165e7c483c') }}
        </span></template>
        </LocalizedText>
      </div>
    </div>
    <input
      ref="input"
      v-model="input"
      type="text"
      class="c-modal-input c-modal-hard-reset__input"
      @keyup.esc="emitClose"
    >
    <div class="c-modal-hard-reset-info">
      <div
        v-if="willHardReset"
        class="c-modal-hard-reset-danger"
      >
        {{ $t('ade.408dd2f31c7fd60c') }}
      </div>
      <div v-else>
        {{ $t('ade.378af36731fa25a2') }}
      </div>
    </div>
    <template #confirm-text>
      HARD RESET
    </template>
  </ModalWrapperChoice>
</template>
