import enCommon from "../locales/en/common.json";
import enNotations from "../locales/en/notations.json";
import enOptions from "../locales/en/options.json";
import enSample from "../locales/en/sample.json";
import zhCommon from "../locales/zh-CN/common.json";
import zhNotations from "../locales/zh-CN/notations.json";
import zhOptions from "../locales/zh-CN/options.json";
import zhSample from "../locales/zh-CN/sample.json";

import { createI18n } from "./service";
import { localeMetadata } from "./locale-metadata";

// Both initial packs ship with the game, including when the network is unavailable.
export const I18n = createI18n({
  catalogs: {
    en: { ...enCommon, ...enNotations, ...enOptions, ...enSample },
    "zh-CN": { ...zhCommon, ...zhNotations, ...zhOptions, ...zhSample }
  },
  metadata: localeMetadata
});

export const t = I18n.t;
