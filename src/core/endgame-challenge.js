// Recheck entry when a confirmation is committed; the game may have changed since it opened.
export function canStartEndgameChallenge(allowWarp = false) {
  const slab = player.celestials.slabdrill;
  return !GameEnd.creditsEverClosed && !slab.isCursed && !slab.core.isActive &&
    (!slab.isWarping || allowWarp) && !(slab.isDestroyed && !slab.hasBoughtNinthDimension) &&
    !player.endgame.largeHadronCollider.void.isRunning && !player.endgame.overcharge.isRunning &&
    !player.compression.active && player.universes.current === 0;
}
