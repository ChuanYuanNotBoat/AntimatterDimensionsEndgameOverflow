<script>
import GlyphSetPreview from "@/components/GlyphSetPreview";
import ModalWrapperChoice from "@/components/modals/ModalWrapperChoice";

export default {
  name: "GlyphSetSaveDeleteModal",
  components: {
    ModalWrapperChoice,
    GlyphSetPreview
  },
  props: {
    glyphSetId: {
      type: Number,
      required: true
    }
  },
  data() {
    return {
      glyphSet: []
    };
  },
  methods: {
    update() {
      this.glyphSet = cloneDeep(Glyphs.copyForRecords(player.reality.glyphs.sets[this.glyphSetId].glyphs));
    },
    handleYesClick() {
      player.reality.glyphs.sets[this.glyphSetId].glyphs = [];
      EventHub.dispatch(GAME_EVENT.GLYPH_SET_SAVE_CHANGE);
    },
  },
};
</script>

<template>
  <ModalWrapperChoice
    option="deleteGlyphSetSave"
    @confirm="handleYesClick"
  >
    <template #header>
      Delete this Glyph Set
    </template>
    <div class="c-modal-message__text">
      {{ $t('ade.a7ee3d186c991ec6') }}
      <GlyphSetPreview
        :is-in-modal="true"
        :glyphs="glyphSet"
      />
      {{ $t('ade.ac12463e8123f272') }}
    </div>
    <template #confirm-text>
      Delete
    </template>
  </ModalWrapperChoice>
</template>
