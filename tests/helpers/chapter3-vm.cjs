const vm = require('node:vm');

// Existing formula tests exercise earlier progression. Supply the newly added
// Chapter 3 systems in their locked, neutral state while preserving each test's mocks.
function withChapter3(context = {}) {
  const effect = {
    isUnlocked: false, isBought: false, canBeApplied: false,
    effectOrDefault: fallback => fallback,
    applyEffect() {},
  };
  context.Slabdrill ??= { isCursed: false, coreActive: false };
  context.SlabdrillUnlocks ??= new Proxy({}, { get: () => effect });
  context.CompressionUpgrade ??= new Proxy({}, { get: () => effect });
  context.Universes ??= { areUnlocked: false, ephemeralLightToDilation: 1, ephemeralLightToGalGen: 1 };
  context.player ??= {};
  context.player.compression ??= { active: false };
  context.player.universes ??= { current: 0 };
  context.player.endgame ??= { credits: false };
  context.Ascension ??= {
    get overchargePenalty() { return [1, 0.72, 0.525, 0.375, 0.125][context.player.endgame?.overcharge?.level ?? 0]; },
  };
  context.CMilestones ??= {
    tesseractEqualizer: (bought, free) => bought + free,
    tickspeedEqualizer: (bought, free) => new context.Decimal(bought).add(free),
    antimatterEqualizer: (multiplier, tickspeed) => new context.Decimal(multiplier).times(tickspeed),
  };
  context.NormalChallenge ??= () => ({ isRunning: false, isCompleted: false });
  if (!context.NormalChallenge.chapter3Defaults) {
    const original = context.NormalChallenge;
    const normalChallenge = (...args) => {
      const challenge = original(...args);
      challenge.chargedEffect ??= 1;
      challenge.isCharged ??= false;
      return challenge;
    };
    Object.assign(normalChallenge, original, { chapter3Defaults: true });
    context.NormalChallenge = normalChallenge;
  }
  return context;
}

module.exports = {
  ...vm,
  createContext: (context, options) => vm.createContext(withChapter3(context), options),
  runInNewContext: (code, context, options) => vm.runInNewContext(code, withChapter3(context), options),
};
