import { createI18nAudit } from "./audit";
import { createI18n } from "./service";
import { languagePacks, localeMetadata } from "./locale-metadata";

// Language packs ship with the game, including when the network is unavailable.
export const I18nAudit = createI18nAudit();
export const I18n = createI18n({ catalogs: languagePacks, metadata: localeMetadata, onDiagnostic: I18nAudit.record,
  warn: (...details) => { if (process.env.NODE_ENV !== "production") console.warn(...details); } });
export const t = I18n.t;
