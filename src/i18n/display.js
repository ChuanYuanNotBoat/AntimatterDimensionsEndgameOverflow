import { I18n } from "./index";
import rules from "./adechinese-rules.json";
import terms from "./display-terms.json";
import { createLegacyDisplay } from "./legacy-display";

// Matching metadata contains IDs only. Every display string belongs to a language file.
export const DisplayI18n = createLegacyDisplay(I18n, [...terms, ...rules]);
