import * as ADLNotations from "adnot-beport-large";
import * as ADNotations from "adnot-beport-small";

import { t } from "../i18n";

export const Notation = (function() {
  const N = ADNotations;
  const notation = (type, nameKey) => {
    const n = new type();
    Object.defineProperty(n, "displayName", { get: () => t(nameKey) });
    n.setAsCurrent = () => {
      player.options.notation = n.name;
      ui.notationName = n.name;
    };
    return n;
  };
  const painful = n => {
    n.isPainful = true;
    return n;
  };
  return {
    scientific: notation(N.ScientificNotation, "notations.small.scientific"),
    engineering: notation(N.EngineeringNotation, "notations.small.engineering"),
    letters: notation(N.LettersNotation, "notations.small.letters"),
    standard: painful(notation(N.StandardNotation, "notations.small.standard")),
    emoji: painful(notation(N.EmojiNotation, "notations.small.emoji")),
    mixedScientific: notation(N.MixedScientificNotation, "notations.small.mixedScientific"),
    mixedEngineering: notation(N.MixedEngineeringNotation, "notations.small.mixedEngineering"),
    logarithm: notation(N.LogarithmNotation, "notations.small.logarithm"),
    brackets: painful(notation(N.BracketsNotation, "notations.small.brackets")),
    infinity: notation(N.InfinityNotation, "notations.small.infinity"),
    roman: painful(notation(N.RomanNotation, "notations.small.roman")),
    dots: painful(notation(N.DotsNotation, "notations.small.dots")),
    zalgo: painful(notation(N.ZalgoNotation, "notations.small.zalgo")),
    hex: painful(notation(N.HexNotation, "notations.small.hex")),
    imperial: painful(notation(N.ImperialNotation, "notations.small.imperial")),
    clock: painful(notation(N.ClockNotation, "notations.small.clock")),
    prime: painful(notation(N.PrimeNotation, "notations.small.prime")),
    bar: painful(notation(N.BarNotation, "notations.small.bar")),
    shi: painful(notation(N.ShiNotation, "notations.small.shi")),
    blind: painful(notation(N.BlindNotation, "notations.small.blind")),
    blobs: painful(notation(N.BlobsNotation, "notations.small.blobs")),
    all: painful(notation(N.AllNotation, "notations.small.all"))
  };
}());

export const LNotation = (function() {
  const N = ADLNotations;
  const notation = (type, nameKey) => {
    const n = new type();
    Object.defineProperty(n, "displayName", { get: () => t(nameKey) });
    n.setAsCurrent = () => {
      player.options.lnotation = n.name;
      ui.lnotationName = n.name;
    };
    return n;
  };
  return {
    extendedScientific: notation(N.ExtendedScientificNotation, "notations.large.extendedScientific"),
    stackedScientific: notation(N.StackedScientificNotation, "notations.large.stackedScientific"),
    semiStackedScientific: notation(N.SemiStackedScientificNotation, "notations.large.semiStackedScientific"),
    extendedLogarithm: notation(N.ExtendedLogarithmNotation, "notations.large.extendedLogarithm"),
    tetrational: notation(N.TetrationalNotation, "notations.large.tetrational"),
    trueTetrational: notation(N.TrueTetrationalNotation, "notations.large.trueTetrational"),
    hyperE: notation(N.HyperENotation, "notations.large.hyperE"),
    simpleExtendedScientific: notation(N.SimpleExtendedScientificNotation, "notations.large.simpleExtendedScientific"),
    stackedMixedScientific: notation(N.StackedMixedScientificNotation, "notations.large.stackedMixedScientific")
  };
}());

Notation.emoji.setAsCurrent = (silent = false) => {
  player.options.notation = Notation.emoji.name;
  ui.notationName = Notation.emoji.name;
  if (!silent) GameUI.notify.success("😂😂😂");
};

// Post e9e15
export const LNotations = {
  // Defined as a list here for exact order in options tab.
  all: [
    LNotation.extendedScientific,
    LNotation.stackedScientific,
    LNotation.semiStackedScientific,
    LNotation.extendedLogarithm,
    LNotation.tetrational,
    LNotation.trueTetrational,
    LNotation.hyperE,
    LNotation.simpleExtendedScientific,
    LNotation.stackedMixedScientific
  ],
  find: name => {
    const notation = LNotations.all.find(n => n.name === name);
    return notation === undefined ? LNotation.extendedScientific : notation;
  },
  get current() {
    return GameUI.initialized ? ui.lnotation : LNotation.extendedScientific;
  }
};

// Pre e9e15
export const Notations = {
  // Defined as a list here for exact order in options tab.
  all: [
    Notation.scientific,
    Notation.engineering,
    Notation.letters,
    Notation.standard,
    Notation.emoji,
    Notation.mixedScientific,
    Notation.mixedEngineering,
    Notation.logarithm,
    Notation.brackets,
    Notation.infinity,
    Notation.roman,
    Notation.dots,
    Notation.zalgo,
    Notation.hex,
    Notation.imperial,
    Notation.clock,
    Notation.prime,
    Notation.bar,
    Notation.shi,
    Notation.blind,
    Notation.blobs,
    Notation.all,
  ],
  find: name => {
    const notation = Notations.all.find(n => n.name === name);
    return notation === undefined ? Notation.mixedScientific : notation;
  },
  get current() {
    return GameUI.initialized ? ui.notation : Notation.mixedScientific;
  }
};

ADNotations.Settings.isInfinite = decimal => ui.formatPreBreak && decimal.gte(DC.NUMMAX);

EventHub.logic.on(GAME_EVENT.GAME_TICK_AFTER, () => {
  ui.formatPreBreak = !PlayerProgress.hasBroken() || (NormalChallenge.isRunning && !Enslaved.isRunning);
});
