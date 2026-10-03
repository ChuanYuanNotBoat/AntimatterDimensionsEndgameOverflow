<script>
import ModalWrapperChoice from "@/components/modals/ModalWrapperChoice";

export default {
  name: "UiChoiceModal",
  components: {
    ModalWrapperChoice
  },
  computed: {
    listEntries() {
      return [
        `Many more game events now have animations. If these impact your performance or gameplay, they can be
        disabled in the Visual Options tab.`,
        `New confirmation windows have replaced the default Javascript alert windows. These can be disabled in the
        Gameplay Options tab.`,
        "The game now also has a new sleek layout which was designed with more Modern design practices in mind."
      ];
    }
  },
  methods: {
    handleYesClick() {
      GameOptions.toggleUI();
    },
  },
};
</script>

<template>
  <ModalWrapperChoice @confirm="handleYesClick">
    <template #header>
      Visual Changes
    </template>
    <div class="c-modal-message__text">
      {{ $t('ade.efacef522506cd0d') }}
      <br>
      <br>
      <div class="c-visual-change-list">
        <div
          v-for="(entry, i) in listEntries"
          :key="i"
          class="c-visual-change-list-entry"
        >
          <b>&bull;</b>
          {{ $legacyText(_s(entry)) }}
        </div>
      </div>
      <br>
      <br>
      {{ $t('ade.a37a6556e48f28c9') }}
    </div>
    <template #cancel-text>
      Remain
    </template>
    <template #confirm-text>
      Swap
    </template>
  </ModalWrapperChoice>
</template>

<style scoped>
.c-visual-change-list {
  display: inline-block;
  max-width: 45rem;
  text-align: left;
}

.c-visual-change-list-entry {
  display: flex;
  margin-bottom: 0.5rem;
  gap: 1rem;
}
</style>
