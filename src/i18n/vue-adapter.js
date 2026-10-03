import { I18n } from "./index";
import { DisplayI18n } from "./display";
import { LocalizedText } from "./localized-text";

export function installI18n(Vue) {
  Vue.component("LocalizedText", LocalizedText);
  Vue.observable(I18n.state);
  let storage;
  try {
    storage = window.localStorage;
  } catch {
    // Private browsing may deny access to localStorage itself.
  }
  I18n.initialize({ storage, document });
  Vue.mixin({
    computed: {
      $locale() {
        return I18n.state.locale;
      },
      $i18nRevision() {
        return I18n.state.revision;
      }
    },
    methods: {
      $t: I18n.t,
      $legacyText(value, scope = this.$options.name) {
        const result = DisplayI18n.translate(value, scope);
        if (result !== value || scope !== this.$options.name) return result;
        // Generic display children receive canonical strings from their parent. Resolve a scoped
        // translation at that display boundary without changing the prop or the underlying model.
        let parent = this.$parent;
        for (let depth = 0; parent && depth < 3; depth++) {
          const translated = DisplayI18n.translate(value, parent.$options.name);
          if (translated !== value) return translated;
          parent = parent.$parent;
        }
        return value;
      },
      $legacyHtml(value, scope = this.$options.name) {
        return DisplayI18n.translateHtml(value, scope, document);
      },
      $legacyTooltip(value) {
        if (typeof value === "string") return this.$legacyHtml(value);
        if (value && typeof value.content === "string") return { ...value, content: this.$legacyHtml(value.content) };
        return value;
      }
    }
  });
}
