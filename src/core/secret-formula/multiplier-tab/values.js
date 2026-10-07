import { AM } from "./antimatter";
import { AD } from "./antimatter-dimensions";
import { DT } from "./dilated-time";
import { eternities } from "./eternities";
import { EP } from "./eternity-points";
import { galaxies } from "./galaxies";
import { gamespeed } from "./gamespeed";
import { general } from "./general";
import { infinities } from "./infinities";
import { ID } from "./infinity-dimensions";
import { IP } from "./infinity-points";
import { replicanti } from "./replicanti";
import { TP } from "./tachyon-particles";
import { tickspeed, tickspeedUpgrades } from "./tickspeed";
import { TD } from "./time-dimensions";
import { MultiplierTabIcons } from "./icons";
import { CelestialDimensionAnalysis, DivineDimensionAnalysis } from "./expansion-dimensions";
import { ExpansionRewardAnalyses, machineAnalysisUnlocked } from "./expansion-rewards";

export const multiplierTabValues = {
  general,
  AM,
  AD,
  ID,
  TD,
  CD: CelestialDimensionAnalysis.values,
  DD: DivineDimensionAnalysis.values,
  IP,
  EP,
  TP,
  DT,
  tickspeed,
  tickspeedUpgrades,
  galaxies,
  infinities,
  eternities,
  gamespeed,
  replicanti
};

for (const [resource, analysis] of Object.entries(ExpansionRewardAnalyses)) {
  multiplierTabValues[resource] = analysis.values;
}
multiplierTabValues.machines = { total: { isActive: () => machineAnalysisUnlocked("RM") } };

// Use the celestial's own emblem for all of its named analysis sources.
for (const values of Object.values(multiplierTabValues)) {
  for (const [key, entry] of Object.entries(values)) {
    if (/^(?:source)?slab/iu.test(entry.sourceKey ?? key)) entry.icon = MultiplierTabIcons.SLABDRILL;
  }
}
