import { I18n } from "./index";

export function installI18n(Vue) {
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
      $t: I18n.t
    }
  });
}
