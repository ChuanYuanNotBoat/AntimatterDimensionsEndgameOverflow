<script>
import { glyphDescription } from "@/i18n/content-display";
import ModalWrapper from "@/components/modals/ModalWrapper";
import PrimaryButton from "@/components/PrimaryButton";

export default {
  name: "RealityGlyphCreationModal",
  components: {
    ModalWrapper,
    PrimaryButton
  },
  data() {
    return {
      isDoomed: false,
      realityGlyphLevel: new Decimal(0),
      // This contains an array where each entry is an array looking like [4000, "realitygalaxies"]
      possibleEffects: [],
    };
  },
  methods: {
    update() {
      this.isDoomed = Pelle.isDoomed && !PelleAlchemyUpgrade.alchemyReality.canBeApplied;
      this.realityGlyphLevel.copyFrom(Decimal.floor(AlchemyResource.reality.amount));
      const realityEffectConfigs = GlyphEffects.all
        .filter(eff => eff.glyphTypes.includes("reality"))
        .sort((a, b) => a.bitmaskIndex - b.bitmaskIndex);
      const minRealityEffectIndex = realityEffectConfigs.map(cfg => cfg.bitmaskIndex).min();
      this.possibleEffects = realityEffectConfigs
        .map(cfg => [realityGlyphEffectLevelThresholds[cfg.bitmaskIndex - minRealityEffectIndex], cfg.id]);
    },
    createRealityGlyph() {
      if (GameCache.glyphInventorySpace.value === 0) {
        Modal.message.show("No available inventory space; Sacrifice some Glyphs to free up space.",
          { closeEvent: GAME_EVENT.GLYPHS_CHANGED });
        return;
      }
      Glyphs.addToInventory(GlyphGenerator.realityGlyph(Decimal.floor(AlchemyResource.reality.amount)));
      if (!ExpansionPack.effarigPack.isBought || player.disablePostReality) AlchemyResource.reality.amount = 0;
      player.reality.glyphs.createdRealityGlyph = true;
      this.emitClose();
    },
    formatGlyphEffect(effect) {
      if (this.realityGlyphLevel.lt(effect[0])) return `(Requires Glyph level ${formatInt(effect[0])})`;
      const config = GlyphEffects[effect[1]];
      const value = config.effect(this.realityGlyphLevel, rarityToStrength(100 + Ra.unlocks.realityGlyphRarity.effectOrDefault(0)));
      const effectTemplate = glyphDescription(config.singleDesc, config.id);
      return effectTemplate.replace("{value}", config.formatEffect(value));
    }
  },
};
</script>

<template>
  <ModalWrapper>
    <template #header>
      Reality Glyph Creation
    </template>
    <div class="c-reality-glyph-creation">
      <div>
        {{ $t('ade.414f0274a4300021', { p0: $legacyText(_s(formatHybridLarge(realityGlyphLevel,3))), p1: $legacyText(_s(formatPercents(1))) }) }}
      </div>
      <div class="o-available-effects-container">
        <div class="o-available-effects">
          {{ $t('ade.7eff2b3cffd28f65') }}
        </div>
        <div
          v-for="(effect, index) in possibleEffects"
          :key="index"
        >
          {{ $legacyText(_s(formatGlyphEffect(effect))) }}
        </div>
      </div>
      <PrimaryButton
        v-if="isDoomed"
        :enabled="false"
      >
        {{ $t('ade.6234e5c51f805844') }}
      </PrimaryButton>
      <PrimaryButton
        v-else-if="realityGlyphLevel.neq(0)"
        @click="createRealityGlyph"
      >
        {{ $t('ade.453e2534bda3ca77') }}
      </PrimaryButton>
      <PrimaryButton
        v-else
        :enabled="false"
      >
        {{ $t('ade.0c5b24d76ecc05c3', { p0: $legacyText(_s(formatInt(0))) }) }}
      </PrimaryButton>
    </div>
  </ModalWrapper>
</template>

<style scoped>
.o-available-effects-container {
  margin: 1.5rem 0 2rem;
}

.o-available-effects {
  font-weight: bold;
}
</style>
