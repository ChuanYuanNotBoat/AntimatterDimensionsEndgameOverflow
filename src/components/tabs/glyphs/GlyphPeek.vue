<script>
import GlyphSetPreview from "@/components/GlyphSetPreview";

export default {
  name: "GlyphPeek",
  components: {
    GlyphSetPreview
  },
  data() {
    return {
      glyphs: [],
      level: new Decimal(),
      canPeek: false,
      isVisible: false,
      canSacrifice: false,
    };
  },
  created() {
    this.on$(GAME_EVENT.REALITY_RESET_AFTER, this.refreshGlyphs);
    this.refreshGlyphs();
  },
  methods: {
    update() {
      this.canSacrifice = GlyphSacrificeHandler.canSacrifice;
      // Hide this before first reality since then it'll confuse the player,
      // and due to pre-selected first glyph might well be incorrect anyway.
      this.isVisible = !Pelle.isDoomed && PlayerProgress.realityUnlocked();
      this.canPeek = TimeStudy.reality.isBought;
      if (gainedGlyphLevel().actualLevel.neq(this.level)) {
        this.refreshGlyphs();
      }
    },
    refreshGlyphs() {
      this.canRefresh = true;
      this.glyphs = GlyphSelection.upcomingGlyphs;
      for (const glyph of this.glyphs) Glyphs.applyGamespeed(glyph);
      this.level = gainedGlyphLevel().actualLevel;
    },
    showModal() {
      Modal.glyphShowcasePanel.show({
        name: "Potential Glyphs for this Reality",
        glyphSet: this.glyphs,
        closeEvent: GAME_EVENT.REALITY_RESET_AFTER,
        isGlyphSelection: true,
        showSetName: false,
      });
    }
  }
};
</script>

<template>
  <div
    v-if="isVisible"
    class="c-glyph-peek"
  >
    <div
      v-if="canPeek"
      class="l-glyph-set-preview"
      @click="showModal"
    >
      <GlyphSetPreview
        :show-name="false"
        :text="'Upcoming Glyph selection:'"
        :glyphs="glyphs"
        :ignore-modified-level="true"
        :show-sacrifice="canSacrifice"
        :flip-tooltip="true"
        :sort="false"
      />
      {{ $t('ade.50bae4e0eb90f898') }}
    </div>
    <div v-else>
      <LocalizedText id="ade.a075581b244eac37">
        <template #p0><br></template>
      </LocalizedText>
    </div>
  </div>
</template>

<style scoped>

</style>
