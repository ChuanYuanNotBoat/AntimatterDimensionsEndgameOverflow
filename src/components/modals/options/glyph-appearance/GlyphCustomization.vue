<script>
import GlyphComponent from "@/components/GlyphComponent";
import GlyphCustomizationSingleType from "@/components/modals/options/glyph-appearance/GlyphCustomizationSingleType";
import PrimaryButton from "@/components/PrimaryButton";
import PrimaryToggleButton from "@/components/PrimaryToggleButton";

export default {
  name: "GlyphCustomization",
  components: {
    GlyphCustomizationSingleType,
    PrimaryButton,
    PrimaryToggleButton,
    GlyphComponent
  },
  data() {
    return {
      enabled: false,
      // This is here to force a re-render if the appearance is set to the default values
      defaultKeySwap: false,
      selectedIndex: 0,
    };
  },
  computed: {
    cosmeticTypes() {
      // We want to sort the base types in a way consistent with type orders within most of the rest of the game. We
      // can safely slice the first 5 and insert them back in the correct order because they'll always be unlocked.
      const nonBaseTypes = CosmeticGlyphTypes.list.filter(t => t.canCustomize).map(t => t.id).slice(5);
      const sortedBase = ["power", "infinity", "replication", "time", "dilation"];
      return sortedBase.concat(nonBaseTypes);
    },
    glyphIconProps() {
      return {
        size: "2.5rem",
        "glow-blur": "0.3rem",
        "glow-spread": "0.1rem",
        "text-proportion": 0.7
      };
    },
    hasCustomSets() {
      return GlyphAppearanceHandler.unlockedSets.length > 0;
    },
    hasSpecialTypes() {
      return GlyphAppearanceHandler.availableTypes.length > 0;
    }
  },
  watch: {
    enabled(newValue) {
      player.reality.glyphs.cosmetics.active = newValue;
      EventHub.dispatch(GAME_EVENT.GLYPH_VISUAL_CHANGE);
    },
  },
  methods: {
    update() {
      this.enabled = player.reality.glyphs.cosmetics.active;
      this.defaultKeySwap = true;
    },
    resetAll() {
      const cosmetics = player.reality.glyphs.cosmetics;
      cosmetics.symbolMap = {};
      cosmetics.colorMap = {};
      this.defaultKeySwap = false;
      EventHub.dispatch(GAME_EVENT.GLYPH_VISUAL_CHANGE);
    },
    resetSingle() {
      const cosmetics = player.reality.glyphs.cosmetics;
      const currType = this.cosmeticTypes[this.selectedIndex];
      cosmetics.symbolMap[currType] = undefined;
      cosmetics.colorMap[currType] = undefined;
      this.defaultKeySwap = false;
      EventHub.dispatch(GAME_EVENT.GLYPH_VISUAL_CHANGE);
    },
    fakeGlyph(type) {
      let typeName = "power";
      if (type === "reality") typeName = "reality";
      if (type === "cursed") typeName = "cursed";
      return {
        // This are just dummy values to make sure that GlyphComponent doesn't throw errors; only the cosmetic aspects
        // will end up being visible in this case anyway (as they override anything type would otherwise show). Type
        // looks particularly odd because reality glyphs need that passed in for the color animation, and cursed ones
        // are inverted, but power is an okay placeholder for anything else. We can't pass in type or else it will error
        // out with cosmetic types.
        type: typeName,
        strength: 1,
        cosmetic: type,
      };
    },
    typeClass(index) {
      return {
        "c-single-type": true,
        "o-disabled-cosmetics": !this.enabled,
        "c-type-current": this.selectedIndex === index,
        "c-type-other": this.selectedIndex !== index,
      };
    },
    resetIndividual() {
      for (const glyph of Glyphs.allGlyphs) {
        if (!glyph.fixedCosmetic) glyph.cosmetic = undefined;
      }
      this.defaultKeySwap = false;
      EventHub.dispatch(GAME_EVENT.GLYPH_VISUAL_CHANGE);
    },
  }
};
</script>

<template>
  <div class="c-glyph-customization-group">
    <b>{{ $t('ade.a6065688c5b7bb85') }}</b>
    <PrimaryToggleButton
      v-model="enabled"
      class="o-primary-btn--subtab-option"
      :on="$t('ade.b62610f2dc23aace')"
      :off="$t('ade.ca0c9d78501a2151')"
    />
    <br>
    <div v-if="hasCustomSets">
      {{ $t('ade.c782bf5e363710ce') }}
      <PrimaryButton
        class="o-primary-btn--subtab-option"
        :class="{ 'o-primary-btn--disabled' : !enabled }"
        @click="resetAll"
      >
        {{ $t('ade.140549175cdcd8dc') }}
      </PrimaryButton>
      <PrimaryButton
        class="o-primary-btn--subtab-option"
        :class="{ 'o-primary-btn--disabled' : !enabled }"
        @click="resetSingle"
      >
        {{ $t('ade.e5e1b88d15bffd05') }}
      </PrimaryButton>
      <br>
      <i>{{ $t('ade.c36bbd13d523ddcb') }}</i>
      <br>
      <br>
      {{ $t('ade.0433668cadebdfa6') }}
      <br>
      <div class="c-type-selection">
        <div
          v-for="(type, index) in cosmeticTypes"
          :key="type"
          :class="typeClass(index)"
          @click="selectedIndex = index"
        >
          <GlyphComponent
            v-tooltip="$legacyTooltip(type.capitalize())"
            v-bind="glyphIconProps"
            :glyph="fakeGlyph(type)"
          />
        </div>
      </div>
      <GlyphCustomizationSingleType
        :key="selectedIndex + enabled + defaultKeySwap"
        :type="cosmeticTypes[selectedIndex]"
      />
      {{ $t('ade.e622c4f8c2687a8f') }}
    </div>
    <div v-else>
      <LocalizedText id="ade.163f010847118a64">
        <template #p0><br></template>
        <template #p1><br></template>
        <template #p2><span v-if="hasSpecialTypes">
        {{ $t('ade.ded8b289c5d021c8') }}
      </span>
<span v-else>
        {{ $t('ade.10608a2436e64ed9') }}
      </span></template>
      </LocalizedText>

    </div>
    <PrimaryButton
      class="o-primary-btn--subtab-option"
      @click="resetIndividual"
    >
      {{ $t('ade.3ad8ef491c384dd0') }}
    </PrimaryButton>
  </div>
</template>

<style scoped>
.c-glyph-customization-group {
  width: 100%;
  margin-top: 0.5rem;
  text-align: left;
}

.c-type-selection {
  display: flex;
  flex-direction: row;
  justify-content: space-around;
  align-items: center;
  margin-top: 0.5rem;
}

.o-disabled-cosmetics {
  opacity: 0.5;
}

.c-single-type {
  padding: 0.5rem;
}

.c-type-current {
  border: 0.1rem solid var(--color-text);
}

.c-type-other {
  padding: 0.6rem;
}
</style>
