import { t } from "../../../i18n";

// State rules outside the resource multiplier products. Keep these separate from
// source impacts: a purchase limit or disabled producer is not a multiplier.
export function multiplierStateNotes(resource) {
  const notes = [];
  const universe = player.universes.current;
  if (resource === "ID" && universe === 2) notes.push(t("analysis.state.infinityDisabled"));
  if (resource === "TD" && (universe === 1 || universe === 2)) {
    notes.push(t("analysis.state.timeDisabled"));
  }
  if (["AD", "ID", "TD", "gamespeed"].includes(resource) && universe === 2) {
    notes.push("Tangible Universe disables Singularity Milestone effects.");
  }
  if (["AM", "AD", "tickspeed", "gamespeed"].includes(resource) && Slabdrill.coreActive) {
    notes.push("Slabdrill core replaces AD multipliers and bypasses Tickspeed, AD production powers and caps.");
  }
  if (["AD", "ID", "TD"].includes(resource) && player.compression.active) {
    notes.push("Compression transforms dimension multipliers before their later rewards and overflow limits.");
  }
  if (resource === "AD" && Slabdrill.isCursed) {
    const unlocked = Math.max(Math.min(Math.floor((player.celestials.slabdrill.goodbyeTick - 30000) / 1000), 10), 2) - 1;
    notes.push(t("analysis.state.slabdrillDimensions", { tier: formatInt(unlocked) }));
    notes.push("Slabdrill moves Sacrifice and unascended TS214 to AD1, and applies the IC8 reward as a power.");
  }
  if (resource === "ID" && SlabdrillUnlocks.timeStudy181.isUnlocked) {
    notes.push(`Slabdrill sets the base ID1-7 purchase cap to ${formatInt(InfinityDimensions.HARDCAP_PURCHASES)}; ` +
      "Tesseract bonuses still apply, and ID8 retains its separate cap.");
  }
  if (resource === "replicanti") {
    notes.push(`Actual replication interval: ${format(getReplicantiInterval(), 2, 2)} ms; ` +
      `chance per tick: ${formatDecimalPercents(player.replicanti.chance, 2)}. External speed alone does not include interval penalties.`);
    if (SlabdrillUnlocks.replicanti.isUnlocked) {
      notes.push("Slabdrill multiplies the interval by 1000 and changes each chance upgrade to +0.1 percentage points.");
    }
    if (Replicanti.amount.gt(replicantiCap())) {
      notes.push(`Above the cap, the interval grows by ${formatX(ReplicantiGrowth.scaleFactor, 2, 2)} ` +
        `per ${format(ReplicantiGrowth.scaleLog10, 2, 2)} orders of magnitude, before later interval powers.`);
    }
  }
  if (resource === "tickspeed") {
    if (Slabdrill.isCursed) {
      notes.push("Slabdrill halves galaxy strength before its galaxy power reward.");
      notes.push("While cursed, TS223, TS224 and the EC5 reward act as galaxy strength modifiers.");
    }
    if (SlabdrillUnlocks.galaxy.isUnlocked) {
      notes.push(`Slabdrill galaxy power: ${formatX(Slabdrill.slabPowers.galMult(), 2, 2)}.`);
    }
    if (SlabdrillUnlocks.timeStudy181.isUnlocked) {
      notes.push("For purchased Antimatter, purchased Replicanti and Tachyon Galaxies, galaxies above 100 count at one tenth strength.");
    }
    if (SlabdrillUnlocks.eternityChallengeTen.isUnlocked) {
      notes.push(`Free Tickspeed softcap: ${formatInt(FreeTickspeed.softcap)}; ` +
        "Slabdrill divides the threshold by 10 and multiplies the post-softcap cost coefficient by 100.");
    }
    if (NormalChallenge(5).isCharged) {
      notes.push(`Charged NC5 galaxy strength: ${formatX(NormalChallenge(5).chargedEffect, 2, 2)} in the large-galaxy formula.`);
    }
    if (Laitela.continuumActive && (NormalChallenge(6).isCharged || NormalChallenge(9).isCharged)) {
      notes.push("Charged NC6 and NC9 affect Continuum purchases; their effect is included in the effective purchase count.");
    }
  }
  if (["AD", "ID", "TD", "IP", "EP", "DT", "replicanti"].includes(resource) &&
      Slabdrill.isCursed && player.dilation.active) {
    notes.push("Active Dilation neutralizes Slab Power multipliers and powers; stage penalties still apply.");
  }
  return notes;
}
