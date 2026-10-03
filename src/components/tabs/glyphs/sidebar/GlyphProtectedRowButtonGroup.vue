<script>
import ToggleButton from "@/components/ToggleButton";

export default {
  name: "GlyphProtectedRowButtonGroup",
  components: {
    ToggleButton
  },
  data() {
    return {
      protectedRows: 0,
      moveGlyphs: false,
    };
  },
  computed: {
    questionMarkTooltip() {
      return `Protected slots are unaffected by anything which may move or purge Glyphs.
        New Glyphs will never be inserted into these slots.`;
    }
  },
  watch: {
    moveGlyphs(newValue) {
      player.reality.moveGlyphsOnProtection = newValue;
    },
  },
  methods: {
    update() {
      this.moveGlyphs = player.reality.moveGlyphsOnProtection;
      this.protectedRows = player.reality.glyphs.protectedRows;
    },
    addRow() {
      Glyphs.changeProtectedRows(1);
    },
    removeRow() {
      Glyphs.changeProtectedRows(-1);
    },
    isProtectedRowsMax() {
      return this.protectedRows === Glyphs.totalSlots / 10 - 1;
    },
    addRowButtonClass() {
      return {
        "c-glyph-inventory-option": true,
        "o-non-clickable": this.isProtectedRowsMax()
      };
    },
    removeRowButtonClass() {
      return {
        "c-glyph-inventory-option": true,
        "o-non-clickable": this.protectedRows === 0
      };
    }
  }
};
</script>

<template>
  <div class="o-glyph-inventory-management-group">
    <div class="l-glyph-sacrifice-options__header">
      <div
        v-tooltip="$legacyTooltip(questionMarkTooltip)"
        class="o-questionmark"
      >
        ?
      </div>
      {{ $t('ade.6744ae859c3475f5', { p0: $legacyText(_s(quantifyInt("row",protectedRows))) }) }}
    </div>
    <button
      :class="addRowButtonClass()"
      @click="addRow"
    >
      {{ $t('ade.ebe90588ec41849e') }}
      <div
        v-if="isProtectedRowsMax()"
        class="c-glyph-inventory-option__tooltip"
      >
        {{ $t('ade.dd69bc4002d43643') }}
      </div>
    </button>
    <button
      :class="removeRowButtonClass()"
      @click="removeRow"
    >
      {{ $t('ade.f8849c5fee868e6b') }}
    </button>
    <ToggleButton
      v-model="moveGlyphs"
      class="c-glyph-inventory-option"
      :label="$t('ade.26cb021d5385325c')"
    />
  </div>
</template>

<style scoped>
.o-non-clickable {
  cursor: auto;
}
</style>
