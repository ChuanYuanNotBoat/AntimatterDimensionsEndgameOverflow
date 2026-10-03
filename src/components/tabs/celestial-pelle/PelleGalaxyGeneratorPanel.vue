<script>
import wordShift from "@/core/word-shift";

import PelleUpgrade from "./PelleUpgrade";

export default {
  name: "GalaxyGeneratorPanel",
  components: {
    PelleUpgrade
  },
  data() {
    return {
      isUnlocked: false,
      isDilated: false,
      isFinalized: false,
      galaxies: new Decimal(0),
      generatedGalaxies: new Decimal(0),
      galaxiesPerSecond: new Decimal(0),
      cap: 0,
      isCapped: false,
      capRift: null,
      sacrificeActive: false,
      isCollapsed: false,
      barWidth: 0,
      capRiftName: "",
      galGenInstability: 0,
      harshGalGenInstability: 0,
      effectiveInstability: new Decimal(0),
      instabilityStart: new Decimal(0),
      harshInstabilityStart: new Decimal(0),
      generationReduction: new Decimal(0),
      trueGenerationReduction: new Decimal(0),
      isInstabilityShown: false,
      isSecondInstabilityShown: false,
    };
  },
  computed: {
    collapseIcon() {
      return this.isCollapsed
        ? "fas fa-expand-arrows-alt"
        : "fas fa-compress-arrows-alt";
    },
    upgrades() {
      if (!EndgameMilestone.fasterGalaxies.isReached || player.disablePostReality) return GalaxyGeneratorUpgrades.all.filter(u => u.id !== "galaxyGeneratorRSMult" && u.id !== "galaxyGeneratorDTMult" && u.id !== "galaxyGeneratorRemnantPow" && u.id !== "galaxyGeneratorExponential" && u.id !== "galaxyGeneratorSuperExponential");
      if (!DivinityMilestone.firstDivine.isReached || player.disablePostReality) return GalaxyGeneratorUpgrades.all.filter(u => u.id !== "galaxyGeneratorDTMult" && u.id !== "galaxyGeneratorRemnantPow" && u.id !== "galaxyGeneratorExponential" && u.id !== "galaxyGeneratorSuperExponential");
      if (!DivinityMilestone.divineDimensions.isReached || player.disablePostReality) return GalaxyGeneratorUpgrades.all.filter(u => u.id !== "galaxyGeneratorRemnantPow" && u.id !== "galaxyGeneratorExponential" && u.id !== "galaxyGeneratorSuperExponential");
      if (!DivinityMilestone.celestialSurge.isReached || player.disablePostReality) return GalaxyGeneratorUpgrades.all.filter(u => u.id !== "galaxyGeneratorExponential" && u.id !== "galaxyGeneratorSuperExponential");
      if (!Accelerators.cosmic._milestones[1].isUnlocked || player.disablePostReality) return GalaxyGeneratorUpgrades.all.filter(u => u.id !== "galaxyGeneratorSuperExponential");
      return GalaxyGeneratorUpgrades.all;
    },
    galaxyText() {
      let text = format(Decimal.max(this.galaxies, 0), 2);
      if (this.galaxies.lt(0)) text += ` [${format(this.galaxies, 2)}]`;
      return text;
    },
    sacrificeText() {
      return this.capRift.galaxyGeneratorText.replace("$value", this.capRiftName);
    },
    emphasisedStart() {
      return Decimal.pow(this.generatedGalaxies.div(this.cap), 0.45).toNumber();
    }
  },
  methods: {
    update() {
      this.isUnlocked = Pelle.hasGalaxyGenerator;
      this.isDilated = player.dilation.active;
      this.isFinalized = PelleStrikes.dilation.isDestroyed();
      this.isCapped = GalaxyGenerator.isCapped;
      this.isCollapsed = player.celestials.pelle.collapsed.galaxies && !this.isCapped;
      if (this.isCollapsed || !this.isUnlocked) return;
      this.galaxies.copyFrom(player.galaxies.add(GalaxyGenerator.galaxies));
      this.generatedGalaxies.copyFrom(GalaxyGenerator.generatedGalaxies);
      this.galaxiesPerSecond.copyFrom(GalaxyGenerator.gainPerSecond);
      this.cap = GalaxyGenerator.generationCap;
      this.capRift = GalaxyGenerator.capRift;
      this.sacrificeActive = GalaxyGenerator.sacrificeActive;
      this.barWidth = (this.isCapped ? this.capRift.reducedTo : this.emphasisedStart);
      if (this.capRift) this.capRiftName = wordShift.wordCycle(this.capRift.name);
      this.galGenInstability = GalaxyGenerator.galGenInstability;
      this.harshGalGenInstability = GalaxyGenerator.harshGalGenInstability;
      this.effectiveInstability.copyFrom(Decimal.pow(this.galGenInstability, this.harshGalGenInstability));
      this.instabilityStart.copyFrom(GalaxyGenerator.instabilityStart);
      this.harshInstabilityStart.copyFrom(GalaxyGenerator.harshInstabilityStart);
      this.generationReduction.copyFrom(Decimal.max(1, Decimal.pow(this.galGenInstability, Decimal.log10(Decimal.max(Decimal.pow(this.galaxies.div(this.instabilityStart), 0.75), 1)))));
      this.trueGenerationReduction.copyFrom(Decimal.max(1, Decimal.pow(Decimal.pow(this.galGenInstability, this.harshGalGenInstability), Decimal.log10(Decimal.max(Decimal.pow(this.galaxies.div(this.instabilityStart), 0.75), 1)))));
      this.isInstabilityShown = PlayerProgress.endgameUnlocked() || this.galaxies.gte(this.instabilityStart);
      this.isSecondInstabilityShown = this.galaxies.gte(this.harshInstabilityStart);
    },
    increaseCap() {
      if (GalaxyGenerator.isCapped) GalaxyGenerator.startSacrifice();
    },
    toggleCollapse() {
      player.celestials.pelle.collapsed.galaxies = !this.isCollapsed;
    },
    unlock() {
      player.celestials.pelle.galaxyGenerator.unlocked = true;
      Pelle.quotes.galaxyGeneratorUnlock.show();
      if (player.endgames >= 1) Pelle.quotes.galgen2.show();
    }
  },
};
</script>

<template>
  <div class="l-pelle-panel-container">
    <div class="c-pelle-panel-title">
      <i
        v-if="!isCapped"
        :class="collapseIcon"
        class="c-collapse-icon-clickable"
        @click="toggleCollapse"
      />
      {{ $t('ade.656a7712a75244af') }}
    </div>
    <div
      v-if="!isCollapsed"
      class="l-pelle-content-container"
    >
      <div v-if="isUnlocked">
        <div>
          {{ $t('ade.82b3193ccafd785e') }}
          <span class="c-galaxies-amount">{{ $legacyText(_s(galaxyText)) }}</span>
          {{ $t('ade.2f6f7899981d6c24') }}
          <span class="c-galaxies-amount">{{ $t('ade.7401cbf5f86d95e0', { p0: $legacyText(_s(format(galaxiesPerSecond,2,1))) }) }}</span>
          <div v-if="isInstabilityShown">
            <LocalizedText id="ade.a1e854713b6c2387">
              <template #p0><span class="c-galaxies-amount">{{ $legacyText(_s(format(galGenInstability, 2, 1))) }}</span></template>
              <template #p1>{{ $legacyText(_s(format(instabilityStart,2,1))) }}</template>
              <template #p2><span class="c-galaxies-amount">{{ $legacyText(_s(format(generationReduction, 2, 1))) }}</span></template>
            </LocalizedText>
          </div>
          <br>
          <div v-if="isSecondInstabilityShown">
            <span class="c-danger-text">
              <LocalizedText id="ade.e3a9f3d4a0353f83">
                <template #p0>{{ $legacyText(_s(format(harshInstabilityStart,2,1))) }}</template>
                <template #p1><br></template>
                <template #p2><span class="c-galaxies-amount">{{ $legacyText(_s(formatPow(harshGalGenInstability, 2, 3))) }}</span></template>
                <template #p3><span class="c-galaxies-amount">{{ $legacyText(_s(format(effectiveInstability, 2, 1))) }}</span></template>
                <template #p4><br></template>
                <template #p5><span class="c-galaxies-amount">{{ $legacyText(_s(format(trueGenerationReduction, 2, 1))) }}</span></template>
              </LocalizedText>
            </span>
          </div>
        </div>
        <div>
          <button
            class="c-increase-cap"
            :class="{
              'c-increase-cap-available': isCapped && capRift && !sacrificeActive,
              'tutorial--glow': cap === Infinity
            }"
            @click="increaseCap"
          >
            <div
              class="c-increase-cap-background"
              :style="{ 'width': `${barWidth * 100}%` }"
            />
            <div
              v-if="isCapped && capRift"
              class="c-increase-cap-text"
            >
              {{ $legacyText(_s(sacrificeText)) }}. <br><br>
              <span
                v-if="!sacrificeActive"
                class="c-big-text"
              >
                {{ $t('ade.9d1234812c5b5c5e', { p0: $legacyText(_s(capRiftName)) }) }}
              </span>
              <span
                v-else
                class="c-big-text"
              >
                {{ $t('ade.2764bf147d24a15c', { p0: $legacyText(_s(capRiftName)) }) }}
              </span>
            </div>
            <div
              v-else
              class="c-increase-cap-text c-medium-text"
            >
              {{ $t('ade.fe77d79876dfad00', { p0: $legacyText(_s(format(generatedGalaxies,2))), p1: $legacyText(_s(format(cap,2))) }) }}
            </div>
          </button>
        </div>
        <div class="l-galaxy-generator-upgrades-container">
          <PelleUpgrade
            v-for="upgrade in upgrades"
            :key="upgrade.config.id"
            :upgrade="upgrade"
            :galaxy-generator="true"
          />
        </div>
      </div>
      <button
        v-if="(isDilated || isFinalized) && !isUnlocked"
        class="c-generator-unlock-button"
        @click="unlock"
      >
        {{ $t('ade.f9dd28987d65114e') }}
      </button>
      <button
        v-if="!isDilated && !isFinalized"
        class="c-generator-locked-button"
      >
        {{ $t('ade.ff37d29f9dac32ed') }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.c-collapse-icon-clickable {
  position: absolute;
  top: 50%;
  left: 1.5rem;
  width: 3rem;
  align-content: center;
  transform: translateY(-50%);
  cursor: pointer;
}

.c-generator-unlock-button {
  width: 25rem;
  height: 10rem;
  font-family: Typewriter;
  font-size: 2rem;
  font-weight: bold;
  color: black;
  background: linear-gradient(var(--color-pelle--secondary), var(--color-pelle--base));
  border-radius: var(--var-border-radius, 0.5rem);
  padding: 2rem;
  cursor: pointer;
}

.c-generator-locked-button {
  width: 25rem;
  height: 10rem;
  font-family: Typewriter;
  font-size: 1.5rem;
  font-weight: bold;
  color: black;
  background: #5f5f5f;
  border-radius: var(--var-border-radius, 0.5rem);
  padding: 2rem;
  cursor: pointer;
}

.l-galaxy-generator-upgrades-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
}

.c-galaxies-amount {
  font-size: 2.5rem;
  font-weight: bold;
  background: linear-gradient(var(--color-pelle--secondary), var(--color-pelle--base));
  background-clip: text;

  -webkit-text-fill-color: transparent;
}

.highlight {
  font-size: 2rem;
  font-weight: bold;
  color: var(--color-pelle--base);
}

.c-increase-cap {
  overflow: hidden;
  width: 100%;
  height: 11.4rem;
  max-width: 70rem;
  position: relative;
  font-family: Typewriter;
  font-size: 1.1rem;
  color: var(--color-text);
  background-color: #c1eaf0;
  border: var(--var-border-width, 0.1rem) solid var(--color-pelle--base);
  border-radius: var(--var-border-radius, 0.5rem);
  /* box-shadow is here to prevent a weird grey border forming around the background */
  box-shadow: inset 0 0 0.1rem 0.1rem var(--color-pelle--base);
  margin: 1rem;
  padding: 2rem;
}

.s-base--dark .c-increase-cap {
  background-color: #004b55;
}

.c-increase-cap:hover {
  box-shadow: inset 0 0 0.1rem 0.1rem var(--color-pelle--base), 0.1rem 0.1rem 0.5rem var(--color-pelle--base);
  transition-duration: 0.12s;
}

.c-increase-cap-available {
  cursor: pointer;
}

.c-increase-cap-text {
  position: relative;
  z-index: 1;
}

.c-increase-cap-background {
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 0;
  background: linear-gradient(var(--color-text-inverted), var(--color-pelle--base));
  transition: width 0.1s;
}

.c-big-text {
  font-size: 2.5rem;
  text-shadow: 0.2rem 0.2rem 0.2rem #888888;
}

.s-base--dark .c-big-text {
  text-shadow: 0.2rem 0.2rem 0.2rem black;
}

.c-medium-text {
  font-size: 2rem;
  text-shadow: 0.2rem 0.2rem 0.2rem #888888;
}

.s-base--dark .c-medium-text {
  text-shadow: 0.2rem 0.2rem 0.2rem black;
}

.c-danger-text {
  font-weight: bold;
  color: var(--color-pelle--base);
  text-shadow: 0.2rem 0.2rem 0.2rem black;
}
</style>
