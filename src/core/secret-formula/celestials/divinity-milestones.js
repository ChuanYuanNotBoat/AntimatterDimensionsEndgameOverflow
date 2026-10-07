import { t } from "../../../i18n";
import { textRef } from "../../../i18n/text-ref";

export const divinityMilestones = {
  firstDivine: {
    divinities: 1,
    get reward() {
      return textRef("divinity.milestones.firstDivine", {
        p0: String(format(Decimal.pow10(1e150))),
        p1: String(format(Decimal.pow10(1e225))),
        p2: String(t(player.universes.current === 2 ? "terms.matter" : "terms.antimatter", {}, "alias1")),
        p3: String(format(DC.E9E15)),
        p4: String(t(player.universes.current === 2 ? "terms.matter" : "terms.antimatter", {}, "alias1")),
        p5: String(formatPercents(0.05)),
        p6: String(formatPercents(0.2)),
        p7: String(formatX(10)),
        p8: String(format(1.1, 1, 1))
      });
    }
  },
  divineDimensions: {
    divinities: 2,
    get reward() {
      return textRef("divinity.milestones.divineDimensions", {
        p0: String(formatPercents(0.2)),
        p1: String(formatPercents(0.2))
      });
    }
  },
  hadronEmpowerment: {
    divinities: 3,
    get reward() {
      return textRef("divinity.milestones.hadronEmpowerment", {
        p0: String(t(player.universes.current === 2 ? "terms.matter" : "terms.antimatter", {}, "alias1")),
        p1: String(formatInt(30)),
        p2: String(formatInt(8)),
        p3: String(formatInt(8)),
        p4: String(formatInt(8)),
        p5: String(formatX(77)),
        p6: String(formatInt(10))
      });
    }
  },
  pelleQoL: {
    divinities: 4,
    get reward() {
      return textRef("divinity.milestones.pelleQoL", {
        p0: String(formatPercents(1)),
        p1: String(formatX(10)),
        p2: String(formatPow(1.05, 2, 2)),
        p3: String(formatPercents(0.5)),
        p4: String(formatPercents(0.2))
      });
    }
  },
  celestialSurge: {
    divinities: 5,
    get reward() {
      return textRef("divinity.milestones.celestialSurge", {
        p0: String(t(player.universes.current === 2 ? "terms.matter" : "terms.antimatter", {}, "alias1")),
        p1: String(formatX(10)),
        p2: String(formatPercents(0.75)),
        p3: String(formatInt(1000)),
        p4: String(formatInt(40)),
        p5: String(formatInt(5)),
        p6: String(formatInt(3))
      });
    }
  },
  finalRebirth: {
    divinities: 7,
    get reward() {
      return textRef("divinity.milestones.finalRebirth", {
        p0: String(t(player.universes.current === 2 ? "terms.matter" : "terms.antimatter", {}, "alias1")),
        p1: String(formatX(100)),
        p2: String(formatPow(1.05, 2, 2)),
        p3: String(formatPercents(0.5)),
        p4: String(formatPercents(0.25))
      });
    }
  },
  ascendedSurge: {
    divinities: 10,
    get reward() {
      return textRef("divinity.milestones.ascendedSurge", {
        p0: String(formatPercents(0.1)),
        p1: String(formatX(1000)),
        p2: String(formatPercents(0.75)),
        p3: String(formatPercents(0.5))
      });
    }
  },
  universes: {
    divinities: 13,
    get reward() {
      return textRef("divinity.milestones.universes");
    }
  },
  powerBurst: {
    divinities: 17,
    get reward() {
      return textRef("divinity.milestones.powerBurst", {
        p0: String(t(player.universes.current === 2 ? "terms.matter" : "terms.antimatter", {}, "alias1")),
        p1: String(formatX(10)),
        p2: String(formatX(1000))
      });
    }
  },
  serpentPower: {
    divinities: 22,
    get reward() {
      return textRef("divinity.milestones.serpentPower", {
        p0: String(formatX(10)),
        p1: String(formatX(10)),
        p2: String(formatX(10))
      });
    }
  }
};
