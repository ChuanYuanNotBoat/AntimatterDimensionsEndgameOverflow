<script>
import { I18n } from "@/i18n";
import { localeMetadata } from "@/i18n/locale-metadata";

export default {
  name: "SelectLanguageDropdown",
  computed: {
    languages: () => localeMetadata,
  },
  methods: {
    selectLanguage(event) {
      const locale = event.target.value;
      if (!I18n.setLocale(locale)) return;
      const language = this.languages.find(entry => entry.id === locale).nativeName;
      GameUI.notify.info(this.$t("options.language.changed", { language }));
    }
  }
};
</script>

<template>
  <div class="c-language-setting">
    <label for="ade-language">{{ $t("options.language.label") }}</label>
    <select
      id="ade-language"
      class="o-primary-btn o-primary-btn--option c-language-setting__select"
      :value="$locale"
      @change="selectLanguage"
    >
      <option
        v-for="language in languages"
        :key="language.id"
        :value="language.id"
        :lang="language.id"
      >
        {{ $legacyText(_s(language.nativeName)) }}
      </option>
    </select>
    <p class="c-language-setting__notice">
      {{ $t("options.language.coverage") }}
    </p>
  </div>
</template>

<style scoped>
.c-language-setting {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  width: 100%;
  margin-bottom: 1rem;
}

.c-language-setting__select {
  margin-left: 1rem;
}

.c-language-setting__notice {
  flex-basis: 100%;
  max-width: 60rem;
  margin: 0.5rem auto;
  font-size: 1.2rem;
}
</style>
