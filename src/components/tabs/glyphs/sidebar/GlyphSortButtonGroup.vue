<script>
export default {
  name: "GlyphSortButtonGroup",
  data() {
    return {
      showScoreFilter: false,
    };
  },
  methods: {
    update() {
      this.showScoreFilter = EffarigUnlock.glyphFilter.isUnlocked;
    },
    sortByLevel() {
      Glyphs.sortByLevel();
    },
    sortByPower() {
      Glyphs.sortByPower();
    },
    sortByScore() {
      Glyphs.sortByScore();
    },
    sortByEffect() {
      Glyphs.sortByEffect();
    },
    collapseEmpty() {
      Glyphs.collapseEmptySlots();
    }
  }
};
</script>

<template>
  <div class="o-glyph-inventory-management-group">
    <div class="l-glyph-sacrifice-options__header">
      {{ $t('ade.928ceaa26fc1a8af') }}
    </div>
    <button
      class="c-glyph-inventory-option"
      @click="sortByLevel"
    >
      {{ $t('ade.e72cb805b00fa4ff') }}
      <div class="c-glyph-inventory-option__tooltip">
        {{ $t('ade.f13d22366eaab928') }}
      </div>
    </button>
    <button
      class="c-glyph-inventory-option"
      @click="sortByPower"
    >
      {{ $t('ade.41e23e96e56ccd1b') }}
      <div class="c-glyph-inventory-option__tooltip">
        {{ $t('ade.447466414f6074e7') }}
      </div>
    </button>
    <button
      class="c-glyph-inventory-option"
      @click="sortByEffect"
    >
      {{ $t('ade.452c4bd2034b62ab') }}
      <div class="c-glyph-inventory-option__tooltip">
        {{ $t('ade.abb879370d8daa09') }}
      </div>
    </button>
    <button
      v-if="showScoreFilter"
      class="c-glyph-inventory-option"
      @click="sortByScore"
    >
      {{ $t('ade.63dde153ebcc507e') }}
      <div class="c-glyph-inventory-option__tooltip">
        {{ $t('ade.2e87bd24d857d1d0') }}
      </div>
    </button>
    <button
      class="c-glyph-inventory-option"
      @click="collapseEmpty"
    >
      {{ $t('ade.2f49738de097cc95') }}
      <div class="c-glyph-inventory-option__tooltip">
        {{ $t('ade.02f897727f689de2') }}
      </div>
    </button>
  </div>
</template>

<style scoped>

</style>
