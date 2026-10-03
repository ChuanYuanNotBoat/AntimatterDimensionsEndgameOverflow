<script>
import ExpandingControlBox from "@/components/ExpandingControlBox";
import OpenModalHotkeysButton from "@/components/OpenModalHotkeysButton";
import OptionsButton from "@/components/OptionsButton";
import PrimaryToggleButton from "@/components/PrimaryToggleButton";
import SelectLanguageDropdown from "./SelectLanguageDropdown";
import SelectLargeNotationDropdown from "./SelectLargeNotationDropdown";
import SelectNotationDropdown from "@/components/tabs/options-visual/SelectNotationDropdown";
import SelectThemeDropdown from "@/components/tabs/options-visual/SelectThemeDropdown";
import SelectSidebarDropdown from "@/components/tabs/options-visual/SelectSidebarDropdown";
import UpdateRateSlider from "./UpdateRateSlider";

export default {
  name: "OptionsVisualTab",
  components: {
    UpdateRateSlider,
    PrimaryToggleButton,
    ExpandingControlBox,
    OptionsButton,
    OpenModalHotkeysButton,
    SelectThemeDropdown,
    SelectNotationDropdown,
    SelectSidebarDropdown,
    SelectLargeNotationDropdown,
    SelectLanguageDropdown,
  },
  data() {
    return {
      theme: "",
      notation: "",
      lnotation: "",
      sidebarResourceID: 0,
      headerTextColored: true,
    };
  },
  computed: {
    sidebarDB: () => GameDatabase.sidebarResources,
    themeLabel() {
      return this.$t("options.visual.theme", { name: Themes.find(this.theme).displayName() });
    },
    notationLabel() {
      return this.$t("options.visual.notation", { name: Notations.find(this.notation).displayName });
    },
    postNotationLabel() {
      return this.$t("options.visual.largeNotation", { name: LNotations.find(this.lnotation).displayName });
    },
    sidebarLabel() {
      const name = this.sidebarResourceID === 0
        ? this.$t("options.visual.latestResource")
        : this.sidebarDB.find(entry => entry.id === this.sidebarResourceID).optionName;
      return this.$t("options.visual.sidebar", { name });
    },
    UILabel() {
      return this.$t("options.visual.ui", { mode: this.$viewModel.newUI ? "modern" : "classic" });
    }
  },
  watch: {
    headerTextColored(newValue) {
      player.options.headerTextColored = newValue;
    },
  },
  methods: {
    update() {
      const options = player.options;
      this.theme = Theme.currentName();
      this.notation = options.notation;
      this.lnotation = options.lnotation;
      this.sidebarResourceID = options.sidebarResourceID;
      this.headerTextColored = options.headerTextColored;
    },
  }
};
</script>

<template>
  <div class="l-options-tab">
    <div class="l-options-grid">
      <SelectLanguageDropdown />
      <div class="l-options-grid__row">
        <OptionsButton
          class="o-primary-btn--option_font-large"
          onclick="GameOptions.toggleUI()"
        >
          {{ UILabel }}
        </OptionsButton>
        <UpdateRateSlider />
        <OptionsButton
          class="o-primary-btn--option"
          onclick="Modal.newsOptions.show();"
        >
          {{ $t("options.visual.news") }}
        </OptionsButton>
      </div>
      <div class="l-options-grid__row">
        <ExpandingControlBox
          class="l-options-grid__button c-options-grid__notations"
          button-class="o-primary-btn o-primary-btn--option l-options-grid__notations-header"
          :label="themeLabel"
        >
          <template #dropdown>
            <SelectThemeDropdown />
          </template>
        </ExpandingControlBox>
        <ExpandingControlBox
          class="l-options-grid__button c-options-grid__notations l-high-z-index"
          button-class="o-primary-btn o-primary-btn--option l-options-grid__notations-header"
          :label="notationLabel"
        >
          <template #dropdown>
            <SelectNotationDropdown />
          </template>
        </ExpandingControlBox>
        <OptionsButton
          class="o-primary-btn--option"
          onclick="Modal.notation.show();"
        >
          {{ $t("options.visual.exponent") }}
        </OptionsButton>
      </div>
      <div class="l-options-grid__row">
        <OptionsButton
          class="o-primary-btn--option"
          onclick="Modal.animationOptions.show();"
        >
          {{ $t("options.visual.animation") }}
        </OptionsButton>
        <OptionsButton
          class="o-primary-btn--option"
          onclick="Modal.infoDisplayOptions.show()"
        >
          {{ $t("options.visual.info") }}
        </OptionsButton>
        <OptionsButton
          class="o-primary-btn--option"
          onclick="Modal.awayProgressOptions.show()"
        >
          {{ $t("options.visual.away") }}
        </OptionsButton>
      </div>
      <div class="l-options-grid__row">
        <OptionsButton
          class="o-primary-btn--option"
          onclick="Modal.hiddenTabs.show()"
        >
          {{ $t("options.visual.tabs") }}
        </OptionsButton>
        <PrimaryToggleButton
          v-model="headerTextColored"
          class="o-primary-btn--option l-options-grid__button"
          :label="$t('options.visual.coloring')"
        />
        <ExpandingControlBox
          v-if="$viewModel.newUI"
          class="l-options-grid__button c-options-grid__notations"
          button-class="o-primary-btn o-primary-btn--option l-options-grid__notations-header"
          :label="sidebarLabel"
        >
          <template #dropdown>
            <SelectSidebarDropdown />
          </template>
        </ExpandingControlBox>
      </div>
      <div class="l-options-grid__row">
        <ExpandingControlBox
          class="l-options-grid__button c-options-grid__notations l-low-z-index"
          button-class="o-primary-btn o-primary-btn--option l-options-grid__notations-header"
          :label="postNotationLabel"
        >
          <template #dropdown>
            <SelectLargeNotationDropdown />
          </template>
        </ExpandingControlBox>
      </div>
      <OpenModalHotkeysButton />
    </div>
  </div>
</template>
<style scoped>
.l-high-z-index {
  z-index: 2;
}

.l-low-z-index {
  z-index: 1;
}
</style>
