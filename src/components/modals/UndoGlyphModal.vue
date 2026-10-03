<script>
import ModalWrapperChoice from "@/components/modals/ModalWrapperChoice";

export default {
  name: "UndoGlyphModal",
  components: {
    ModalWrapperChoice
  },
  data() {
    return {
      showStoredGameTime: false,
    };
  },
  methods: {
    update() {
      this.showStoredGameTime = Enslaved.isUnlocked;
    },
    realityInvalidate() {
      this.emitClose();
      Modal.message.show("Glyph Undo can only undo with a Reality!",
        { closeEvent: GAME_EVENT.REALITY_RESET_AFTER });
    },
    handleYesClick() {
      this.emitClose();
      Glyphs.undo();
    },
  },
};
</script>

<template>
  <ModalWrapperChoice
    option="glyphUndo"
    @confirm="handleYesClick"
  >
    <template #header>
      You are about to undo equipping a Glyph
    </template>
    <div
      class="c-modal-message__text c-text-wrapper"
    >
      {{ $t('ade.738f12b57f6a4d08') }}
      <br>
      <div class="c-text-wrapper">
        <LocalizedText id="ade.bb6adad5f45e2c64">
    <template #p0><br></template>
    <template #p1><br></template>
    <template #p2><br></template>
    <template #p3><br></template>
    <template #p4><br></template>
    <template #p5><span v-if="showStoredGameTime"><br>{{ $t('ade.21d9bd794f269407') }}</span></template>
  </LocalizedText>
      </div>
      <br>
      {{ $t('ade.40166ac681892d5f') }}
    </div>
  </ModalWrapperChoice>
</template>

<style scoped>
.c-text-wrapper {
  text-align: left;
}
</style>