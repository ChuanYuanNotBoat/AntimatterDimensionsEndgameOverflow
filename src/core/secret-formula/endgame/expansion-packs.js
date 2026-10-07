import { t } from "../../../i18n";
import { textRef } from "../../../i18n/text-ref";

export const expansionPacks = {
  teresaPack: {
    name: "Teresa's Expansion Pack",
    id: "teresaPack",
    symbol: "Ϟ",
    get description() {
      return textRef("endgame.expansion.teresaPack")
    },
    cost: Decimal.pow(10, 1e30),
    formatCost: value => formatPostBreak(value, 2, 0)
  },
  effarigPack: {
    name: "Effarig's Expansion Pack",
    id: "effarigPack",
    symbol: "Ϙ",
    get description() {
      return textRef("endgame.expansion.effarigPack", {
        p0: String(t(player.universes.current === 2 ? "terms.matter" : "terms.antimatter", {}, "alias1")),
        p1: String(formatX(player.antimatter.max(10).log10(), 2)),
        p2: String(formatInt(10)),
        p3: String(formatInt(7)),
        p4: String(formatHybridLarge(player.records.bestEndgame.glyphLevel.div(3), 3)),
        p5: String(TimeSpan.fromMilliseconds(new Decimal(player.records.bestEndgame.realTime).div(10)).toStringShort())
      })
    },
    cost: Decimal.pow(10, 1e50),
    formatCost: value => formatPostBreak(value, 2, 0)
  },
  enslavedPack: {
    name: "The Nameless Ones' Expansion Pack",
    id: "enslavedPack",
    symbol: "\uf0c1",
    get description() {
      return textRef("endgame.expansion.enslavedPack", {
        p0: String(formatPercents(0.99)),
        p1: String(formatX(Math.floor(1 + Math.pow(Math.log10(Math.min(Tesseracts.effectiveCount, 1000) * Math.max(Math.log10(Tesseracts.effectiveCount) - 2, 1) + 1), Math.log10(player.endgames + 1))), 2, 2)),
        p2: String(formatX(Math.pow(1 / Math.log10(Tesseracts.effectiveCount + 1), 0.2), 2, 3))
      })
    },
    cost: Decimal.pow(10, 1e70),
    formatCost: value => formatPostBreak(value, 2, 0)
  },
  vPack: {
    name: "V's Expansion Pack",
    id: "vPack",
    symbol: "⌬",
    get description() {
      return textRef("endgame.expansion.vPack", {
        p0: formatInt(60)
      })
    },
    cost: Decimal.pow(10, 1e90),
    formatCost: value => formatPostBreak(value, 2, 0)
  },
  raPack: {
    name: "Ra's Expansion Pack",
    id: "raPack",
    symbol: "\uf185",
    get description() {
      return textRef("endgame.expansion.raPack", {
        p0: String(t(player.universes.current === 2 ? "terms.matter" : "terms.antimatter", {}, "alias1")),
        p1: String(formatHybridLarge(Decimal.max(Decimal.floor(player.records.bestAntimatterExponentOutsideDoom.max(1).log10()), 25), 3)),
        p2: String(formatInt(7)),
        p3: String(formatX(10))
      })
    },
    cost: Decimal.pow(10, 1e110),
    formatCost: value => formatPostBreak(value, 2, 0)
  },
  laitelaPack: {
    name: "Lai'tela's Expansion Pack",
    id: "laitelaPack",
    symbol: "ᛝ",
    get description() {
      return textRef("endgame.expansion.laitelaPack", {
        p0: String(formatInt(8)),
        p1: String(formatInt(8)),
        p2: String(formatInt(200)),
        p3: String(t(player.universes.current === 2 ? "terms.matter" : "terms.antimatter", {}, "alias1")),
        p4: String(formatX(Decimal.max(player.antimatter.max(1e10).log10().log10(), player.reality.imaginaryMachines.max(10).log10()), 2, 2)),
        p5: String(formatInt(10)),
        p6: String(formatX(player.celestials.laitela.singularities.max(10).log10().pow(2), 2, 2)),
        p7: String(formatPow(Decimal.pow((Decimal.log10(Decimal.log10(Currency.darkMatter.value.add(1)).add(1)).add(1)).div(2), 2).add(1), 2, 3)),
        p8: String(formatInt(10))
      })
    },
    cost: Decimal.pow(10, 1e130),
    formatCost: value => formatPostBreak(value, 2, 0)
  },
  pellePack: {
    name: "Pelle's Expansion Pack",
    id: "pellePack",
    symbol: "♅",
    get description() {
      return textRef("endgame.expansion.pellePack", {
        p0: String(formatInt(1)),
        p1: String(formatPow(Decimal.pow(Decimal.log10(player.records.bestEndgame.galaxies).div(100), 1.5).add(1), 2, 3))
      })
    },
    cost: Decimal.pow(10, 1e150),
    formatCost: value => formatPostBreak(value, 2, 0)
  },
  alphaPack: {
    name: "Alpha's Expansion Pack",
    id: "alphaPack",
    symbol: "α",
    get description() {
      return textRef("endgame.expansion.alphaPack", {
        p0: String(t(player.universes.current === 2 ? "terms.matter" : "terms.antimatter", {}, "alias1"))
      })
    },
    cost: Decimal.pow(10, 1e200),
    formatCost: value => formatPostBreak(value, 2, 0)
  },
  slabPack: {
    name: "Slabdrill's Expansion Pack",
    id: "slabPack",
    symbol: "⁹δ",
    get description() {
      return textRef("endgame.expansion.slabPack")
    },
    cost: Decimal.pow(10, 1e275),
    formatCost: value => formatPostBreak(value, 2, 0)
  }
};
