import { createI18n } from "./service";
import { languagePacks, localeMetadata } from "./locale-metadata";

// Language packs ship with the game, including when the network is unavailable.
export const I18n = createI18n({ catalogs: languagePacks, metadata: localeMetadata });
export const t = I18n.t;
