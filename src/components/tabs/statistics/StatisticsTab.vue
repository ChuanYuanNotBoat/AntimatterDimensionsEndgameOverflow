<script>
import { MatterScale } from "./matter-scale";
import PrimaryButton from "@/components/PrimaryButton";

export default {
  name: "StatisticsTab",
  components: {
    PrimaryButton
  },
  data() {
    return {
      isDoomed: false,
      realTimeDoomed: TimeSpan.zero,
      totalAntimatter: new Decimal(0),
      totalAntimatterOutsideDoom: new Decimal(0),
      bestDoomedAntimatterThisDivinity: new Decimal(0),
      totalCelMatter: new Decimal(0),
      totalDivineMatter: new Decimal(0),
      hasSeenDivineDims: false,
      realTimePlayed: TimeSpan.zero,
      timeSinceCreation: 0,
      uniqueNews: 0,
      totalNews: 0,
      secretAchievementCount: 0,
      isFlipped: false,
      infinity: {
        isUnlocked: false,
        count: new Decimal(0),
        banked: new Decimal(0),
        projectedBanked: new Decimal(0),
        bankRate: new Decimal(0),
        totalInfinityAntimatter: new Decimal(0),
        hasBest: false,
        best: TimeSpan.zero,
        this: TimeSpan.zero,
        thisReal: TimeSpan.zero,
        bestRate: new Decimal(0),
      },
      eternity: {
        isUnlocked: false,
        count: new Decimal(0),
        totalEternityAntimatter: new Decimal(0),
        hasBest: false,
        best: TimeSpan.zero,
        this: TimeSpan.zero,
        thisReal: TimeSpan.zero,
        bestRate: new Decimal(0),
      },
      reality: {
        isUnlocked: false,
        count: new Decimal(0),
        totalRealityAntimatter: new Decimal(0),
        hasBest: false,
        best: TimeSpan.zero,
        bestReal: TimeSpan.zero,
        this: TimeSpan.zero,
        thisReal: TimeSpan.zero,
        totalTimePlayed: TimeSpan.zero,
        bestRate: new Decimal(0),
        bestRarity: 0,
      },
      endgame: {
        isUnlocked: false,
        count: 0,
        totalEndgameAntimatter: new Decimal(0),
        hasBest: false,
        best: TimeSpan.zero,
        bestReal: TimeSpan.zero,
        this: TimeSpan.zero,
        thisReal: TimeSpan.zero,
        bestRateCP: new Decimal(0),
        bestRateDP: new Decimal(0),
      },
      celestialInfinity: {
        isUnlocked: false,
        count: new Decimal(0),
        totalCelestialInfinityCelMatter: new Decimal(0),
        hasBest: false,
        best: TimeSpan.zero,
        bestReal: TimeSpan.zero,
        this: TimeSpan.zero,
        thisReal: TimeSpan.zero,
        bestRate: new Decimal(0),
      },
      celestialEternity: {
        isUnlocked: false,
        count: new Decimal(0),
        totalCelestialEternityCelMatter: new Decimal(0),
        hasBest: false,
        best: TimeSpan.zero,
        bestReal: TimeSpan.zero,
        this: TimeSpan.zero,
        thisReal: TimeSpan.zero,
        bestRate: new Decimal(0),
      },
      divinity: {
        isUnlocked: false,
        count: new Decimal(0)
      },
      condense: {
        isUnlocked: false,
        count: new Decimal(0),
        totalCondenseDivineMatter: new Decimal(0),
        hasBest: false,
        best: TimeSpan.zero,
        bestReal: TimeSpan.zero,
        this: TimeSpan.zero,
        thisReal: TimeSpan.zero,
        bestRate: new Decimal(0),
      },
      supernova: {
        isUnlocked: false,
        count: new Decimal(0),
        totalSupernovaDivineMatter: new Decimal(0),
        hasBest: false,
        best: TimeSpan.zero,
        bestReal: TimeSpan.zero,
        this: TimeSpan.zero,
        thisReal: TimeSpan.zero,
        bestRate: new Decimal(0),
      },
      matterScale: [],
      lastMatterTime: 0,
      paperclips: 0,
      fullTimePlayed: 0,
    };
  },
  computed: {
    // These are here to avoid extra spaces in-game pre-reality and to get around codefactor 120-char limits in the
    // HTML template due to the fact that adding a linebreak also adds a space
    infinityCountString() {
      const num = this.infinity.count;
      return num.gt(0)
        ? `${this.formatDecimalAmount(num)} ${pluralize("Infinity", num.floor())}`
        : "no Infinities";
    },
    eternityCountString() {
      const num = this.eternity.count;
      return num.gt(0)
        ? `${this.formatDecimalAmount(num)} ${pluralize("Eternity", num.floor())}`
        : "no Eternities";
    },
    realityCountString() {
      const num = new Decimal(this.reality.count);
      return num.gt(0)
        ? `${this.formatDecimalAmount(num)} ${pluralize("Reality", num.floor())}`
        : "no Realities";
    },
    endgameCountString() {
      const num = new Decimal(this.endgame.count);
      return num.gt(0)
        ? `${this.formatDecimalAmount(num)} ${pluralize("Endgame", num.floor())}`
        : "no Endgames";
    },
    celestialInfinityCountString() {
      const num = this.celestialInfinity.count;
      return num.gt(0)
        ? `${this.formatDecimalAmount(num)} ${pluralize("Celestial Infinity", num.floor())}`
        : "no Celestial Infinities";
    },
    celestialEternityCountString() {
      const num = this.celestialEternity.count;
      return num.gt(0)
        ? `${this.formatDecimalAmount(num)} ${pluralize("Celestial Eternity", num.floor())}`
        : "no Celestial Eternities";
    },
    divinityCountString() {
      const num = this.divinity.count;
      return num.gt(0)
        ? `${this.formatDecimalAmount(num)} ${pluralize("Divinity", num.floor())}`
        : "no Divinities";
    },
    condenseCountString() {
      const num = this.condense.count;
      return num.gt(0)
        ? `${this.formatDecimalAmount(num)} ${pluralize("Condense", num.floor())}`
        : "no Condenses";
    },
    supernovaCountString() {
      const num = this.supernova.count;
      return num.gt(0)
        ? `${this.formatDecimalAmount(num)} ${pluralize("Supernova", num.floor())}`
        : "no Supernovae";
    },
    fullGameCompletions() {
      return player.records.fullGameCompletions;
    },
    startDate() {
      return Time.toDateTimeString(player.records.gameCreatedTime);
    },
    saveAge() {
      return TimeSpan.fromMilliseconds(new Decimal(this.timeSinceCreation));
    },
  },
  methods: {
    update() {
      const records = player.records;
      this.totalAntimatter.copyFrom(records.totalAntimatter);
      this.totalAntimatterOutsideDoom.copyFrom(player.records.totalAntimatterOutsideDoom);
      this.bestDoomedAntimatterThisDivinity.copyFrom(player.records.bestDoomedAntimatterThisDivinity);
      this.totalCelMatter.copyFrom(records.totalCelMatter);
      this.totalDivineMatter.copyFrom(records.totalDivineMatter);
      this.hasSeenDivineDims = DivinityMilestone.divineDimensions.isReached;
      this.realTimePlayed.setFrom(new Decimal(records.realTimePlayed));
      this.fullTimePlayed = TimeSpan.fromMilliseconds(
        new Decimal(records.previousRunRealTime + records.realTimePlayed));
      this.uniqueNews = NewsHandler.uniqueTickersSeen;
      this.totalNews = player.news.totalSeen;
      this.secretAchievementCount = SecretAchievements.all.filter(a => a.isUnlocked).length;
      this.timeSinceCreation = Date.now() - player.records.gameCreatedTime;
      this.isFlipped = player.universes.current === 2;

      const progress = PlayerProgress.current;
      const isInfinityUnlocked = progress.isInfinityUnlocked;
      const infinity = this.infinity;
      const bestInfinity = records.bestInfinity;
      infinity.isUnlocked = isInfinityUnlocked;
      if (isInfinityUnlocked) {
        infinity.count.copyFrom(Currency.infinities);
        infinity.banked.copyFrom(Currency.infinitiesBanked);
        infinity.projectedBanked = new Decimal(0).plusEffectsOf(
          Achievement(131).effects.bankedInfinitiesGain,
          TimeStudy(191).effects.bankedInfinitiesGain,
        );
        infinity.bankRate = infinity.projectedBanked.div(Decimal.clampMin(33, records.thisEternity.time)).times(60000);
        infinity.totalInfinityAntimatter.copyFrom(records.totalInfinityAntimatter);
        infinity.hasBest = bestInfinity.time.lt(999999999999);
        infinity.best.setFrom(bestInfinity.time);
        infinity.this.setFrom(records.thisInfinity.time);
        infinity.bestRate.copyFrom(bestInfinity.bestIPminEternity);
      }

      const isEternityUnlocked = progress.isEternityUnlocked;
      const eternity = this.eternity;
      const bestEternity = records.bestEternity;
      eternity.isUnlocked = isEternityUnlocked;
      if (isEternityUnlocked) {
        eternity.count.copyFrom(Currency.eternities);
        eternity.totalEternityAntimatter.copyFrom(records.totalEternityAntimatter);
        eternity.hasBest = bestEternity.time.lt(999999999999);
        eternity.best.setFrom(bestEternity.time);
        eternity.this.setFrom(records.thisEternity.time);
        eternity.bestRate.copyFrom(bestEternity.bestEPminReality);
      }

      const isRealityUnlocked = progress.isRealityUnlocked;
      const reality = this.reality;
      const bestReality = records.bestReality;
      reality.isUnlocked = isRealityUnlocked;

      if (isRealityUnlocked) {
        reality.count.copyFrom(Decimal.floor(Currency.realities.value));
        reality.totalRealityAntimatter.copyFrom(records.totalRealityAntimatter);
        reality.hasBest = bestReality.time.lt(999999999999);
        reality.best.setFrom(bestReality.time);
        reality.bestReal.setFrom(new Decimal(bestReality.realTime));
        reality.this.setFrom(records.thisReality.time);
        reality.totalTimePlayed.setFrom(records.totalTimePlayed);
        // Real time tracking is only a thing once reality is unlocked:
        infinity.thisReal.setFrom(new Decimal(records.thisInfinity.realTime));
        infinity.bankRate = infinity.projectedBanked.div(Math.clampMin(33, records.thisEternity.realTime)).times(60000);
        eternity.thisReal.setFrom(new Decimal(records.thisEternity.realTime));
        reality.thisReal.setFrom(new Decimal(records.thisReality.realTime));
        reality.bestRate.copyFrom(bestReality.RMmin);
        reality.bestRarity = Math.max(strengthToRarity(bestReality.glyphStrength), 0);
      }

      const isEndgameUnlocked = progress.isEndgameUnlocked;
      const endgame = this.endgame;
      const bestEndgame = records.bestEndgame;
      endgame.isUnlocked = isEndgameUnlocked;
      
      if (isEndgameUnlocked) {
        endgame.count = Math.floor(player.endgames);
        endgame.totalEndgameAntimatter.copyFrom(records.totalEndgameAntimatter);
        endgame.hasBest = bestEndgame.realTime < 999999999999;
        endgame.best.setFrom(bestEndgame.time);
        endgame.bestReal.setFrom(new Decimal(bestEndgame.realTime));
        endgame.this.setFrom(records.thisEndgame.time);
        endgame.thisReal.setFrom(new Decimal(records.thisEndgame.realTime));
        endgame.bestRateCP.copyFrom(bestEndgame.bestCPmin);
        endgame.bestRateDP.copyFrom(bestEndgame.bestDPmin);
      }

      const isCelestialInfinityUnlocked = progress.isCelestialInfinityUnlocked;
      const celestialInfinity = this.celestialInfinity;
      const bestCelestialInfinity = records.bestCelestialInfinity;
      celestialInfinity.isUnlocked = isCelestialInfinityUnlocked;
      if (isCelestialInfinityUnlocked) {
        celestialInfinity.count.copyFrom(Currency.celestialInfinities);
        celestialInfinity.totalCelestialInfinityCelMatter.copyFrom(records.totalCelestialInfinityCelMatter);
        celestialInfinity.hasBest = bestCelestialInfinity.realTime < 999999999999;
        celestialInfinity.best.setFrom(bestCelestialInfinity.time);
        celestialInfinity.bestReal.setFrom(new Decimal(bestCelestialInfinity.realTime));
        celestialInfinity.this.setFrom(records.thisCelestialInfinity.time);
        celestialInfinity.thisReal.setFrom(new Decimal(records.thisCelestialInfinity.realTime));
        celestialInfinity.bestRate.copyFrom(bestCelestialInfinity.bestCIPminCelestialEternity);
      }

      const isCelestialEternityUnlocked = progress.isCelestialEternityUnlocked;
      const celestialEternity = this.celestialEternity;
      const bestCelestialEternity = records.bestCelestialEternity;
      celestialEternity.isUnlocked = isCelestialEternityUnlocked;
      if (isCelestialEternityUnlocked) {
        celestialEternity.count.copyFrom(Currency.celestialEternities);
        celestialEternity.totalCelestialEternityCelMatter.copyFrom(records.totalCelestialEternityCelMatter);
        celestialEternity.hasBest = bestCelestialEternity.realTime < 999999999999;
        celestialEternity.best.setFrom(bestCelestialEternity.time);
        celestialEternity.bestReal.setFrom(new Decimal(bestCelestialEternity.realTime));
        celestialEternity.this.setFrom(records.thisCelestialEternity.time);
        celestialEternity.thisReal.setFrom(new Decimal(records.thisCelestialEternity.realTime));
        celestialEternity.bestRate.copyFrom(bestCelestialEternity.bestCEPminCelestialReality);
      }

      const isDivinityUnlocked = progress.isDivinityUnlocked;
      const divinity = this.divinity;
      divinity.isUnlocked = isDivinityUnlocked;
      if (isDivinityUnlocked) {
        divinity.count.copyFrom(Currency.divinities.value.floor());
      }

      const isCondenseUnlocked = progress.isCondenseUnlocked;
      const condense = this.condense;
      const bestCondense = records.bestCondense;
      condense.isUnlocked = isCondenseUnlocked;
      if (isCondenseUnlocked) {
        condense.count.copyFrom(Currency.condenses);
        condense.totalCondenseDivineMatter.copyFrom(records.totalCondenseDivineMatter);
        condense.hasBest = bestCondense.realTime < 999999999999;
        condense.best.setFrom(bestCondense.time);
        condense.bestReal.setFrom(new Decimal(bestCondense.realTime));
        condense.this.setFrom(records.thisCondense.time);
        condense.thisReal.setFrom(new Decimal(records.thisCondense.realTime));
        condense.bestRate.copyFrom(bestCondense.bestVSminSupernova);
      }

      const isSupernovaUnlocked = progress.isSupernovaUnlocked;
      const supernova = this.supernova;
      const bestSupernova = records.bestSupernova;
      supernova.isUnlocked = isSupernovaUnlocked;
      if (isSupernovaUnlocked) {
        supernova.count.copyFrom(Currency.supernovae);
        supernova.totalSupernovaDivineMatter.copyFrom(records.totalSupernovaDivineMatter);
        supernova.hasBest = bestSupernova.realTime < 999999999999;
        supernova.best.setFrom(bestSupernova.time);
        supernova.bestReal.setFrom(new Decimal(bestSupernova.realTime));
        supernova.this.setFrom(records.thisSupernova.time);
        supernova.thisReal.setFrom(new Decimal(records.thisSupernova.realTime));
        supernova.bestRate.copyFrom(bestSupernova.bestNebminTotal);
      }
      this.updateMatterScale();

      this.isDoomed = Pelle.isDoomed;
      this.realTimeDoomed.setFrom(new Decimal(player.records.realTimeDoomed));
      this.paperclips = player.news.specialTickerData.paperclips;
    },
    formatDecimalAmount(value) {
      return value.gt(1e9) ? format(value, 3) : formatInt(Math.floor(value.toNumber()));
    },
    // Only updates once per second to reduce jitter
    updateMatterScale() {
      if (Date.now() - this.lastMatterTime > 1000) {
        this.matterScale = MatterScale.estimate(Currency.antimatter.value);
        this.lastMatterTime = Date.now();
      }
    },
    realityClassObject() {
      return {
        "c-stats-tab-title": true,
        "c-stats-tab-reality": !this.isDoomed,
        "c-stats-tab-doomed": this.isDoomed,
      };
    }
  },
};
</script>

<template>
  <div class="c-stats-tab">
    <div>
      <PrimaryButton onclick="Modal.catchup.show(0)">
        {{ $t('ade.983716ec14393a23') }}
      </PrimaryButton>
      <div class="c-stats-tab-title c-stats-tab-general">
        {{ $t('ade.ff067c2d36048625') }}
      </div>
      <div class="c-stats-tab-general">
        <div>{{ $t('ade.9cd826e166efdf12', { p0: $legacyText(_s(format(totalAntimatter,2,1))), p1: $legacyText(_s(isFlipped?"matter":"antimatter")) }) }}</div>
        <div v-if="divinity.isUnlocked">
          {{ $t('ade.a65a3860b2176038', { p0: $legacyText(_s(format(bestDoomedAntimatterThisDivinity,2,1))), p1: $legacyText(_s(isFlipped?"matter":"antimatter")) }) }}
        </div>
        <div v-if="endgame.isUnlocked">
          {{ $t('ade.72f3fc7b63b7d380', { p0: $legacyText(_s(format(totalAntimatterOutsideDoom,2,1))), p1: $legacyText(_s(isFlipped?"matter":"antimatter")) }) }}
        </div>
        <div v-if="endgame.isUnlocked">
          {{ $t('ade.449bc2ec31a4937b', { p0: $legacyText(_s(format(endgame.totalEndgameAntimatter,2,1))), p1: $legacyText(_s(isFlipped?"matter":"antimatter")) }) }}
        </div>
        <div v-if="reality.isUnlocked" :class="{ 'c-stats-tab-doomed' : isDoomed }">
          {{ $t('ade.9308315939c8f6fd', { p0: $legacyText(_s(format(reality.totalRealityAntimatter,2,1))), p1: $legacyText(_s(isFlipped?"matter":"antimatter")), p2: $legacyText(_s(isDoomed?"Armageddon":"Reality")) }) }}
        </div>
        <div v-if="eternity.isUnlocked">
          {{ $t('ade.45e8ca7b7d0ac6a5', { p0: $legacyText(_s(format(eternity.totalEternityAntimatter,2,1))), p1: $legacyText(_s(isFlipped?"matter":"antimatter")) }) }}
        </div>
        <div v-if="infinity.isUnlocked">
          {{ $t('ade.6735a2558ebfde6e', { p0: $legacyText(_s(format(infinity.totalInfinityAntimatter,2,1))), p1: $legacyText(_s(isFlipped?"matter":"antimatter")) }) }}
        </div>
        <div v-if="endgame.isUnlocked" class="c-stats-tab-celestials">
          {{ $t('ade.ece56feae1306318', { p0: $legacyText(_s(format(totalCelMatter,2,1))) }) }}
        </div>
        <div v-if="celestialEternity.isUnlocked" class="c-stats-tab-celestials">
          {{ $t('ade.377b6047e1da5fcb', { p0: $legacyText(_s(format(celestialEternity.totalCelestialEternityCelMatter,2,1))) }) }}
        </div>
        <div v-if="celestialInfinity.isUnlocked" class="c-stats-tab-celestials">
          {{ $t('ade.af438081efce7d28', { p0: $legacyText(_s(format(celestialInfinity.totalCelestialInfinityCelMatter,2,1))) }) }}
        </div>
        <div v-if="hasSeenDivineDims" class="c-stats-tab-divinity">
          {{ $t('ade.8343aa001ebfd90e', { p0: $legacyText(_s(format(totalDivineMatter,2,1))) }) }}
        </div>
        <div v-if="supernova.isUnlocked" class="c-stats-tab-divinity">
          {{ $t('ade.10fb319960b420c6', { p0: $legacyText(_s(format(supernova.totalSupernovaDivineMatter,2,1))) }) }}
        </div>
        <div v-if="condense.isUnlocked" class="c-stats-tab-divinity">
          {{ $t('ade.9b4f342572d322b6', { p0: $legacyText(_s(format(condense.totalCondenseDivineMatter,2,1))) }) }}
        </div>
        <div>{{ $t('ade.9a3449a0c005b7f5', { p0: $legacyText(_s(realTimePlayed)) }) }}</div>
        <div v-if="reality.isUnlocked">
          {{ $t('ade.1e3fd40c8969b9e3', { p0: $legacyText(_s(reality.totalTimePlayed)) }) }}
        </div>
        <div>
          {{ $t('ade.ef3096c63b3db401', { p0: $legacyText(_s(startDate)), p1: $legacyText(_s(saveAge)) }) }}
        </div>
        <br>
        <div>
          {{ $t('ade.72a9a310bae43a76', { p0: $legacyText(_s(quantifyHybridSmall("news message",totalNews))) }) }}
        </div>
        <div>
          {{ $t('ade.8fcac7ed263d882e', { p0: $legacyText(_s(quantifyInt("unique news message",uniqueNews))) }) }}
        </div>
        <div>
          {{ $t('ade.0862db62ce04808f', { p0: $legacyText(_s(quantifyInt("Secret Achievement",secretAchievementCount))) }) }}
        </div>
        <div v-if="paperclips">
          {{ $t('ade.72a577765e7e40b3', { p0: $legacyText(_s(quantifyInt("useless paperclip",paperclips))) }) }}
        </div>
        <div v-if="fullGameCompletions">
          <br>
          <b>
            <LocalizedText id="ade.47bf5ce7e7f6edb2">
              <template #p0>{{ $legacyText(_s(quantifyInt("time",fullGameCompletions))) }}</template>
              <template #p1><br></template>
              <template #p2>{{ $legacyText(_s(fullTimePlayed)) }}</template>
            </LocalizedText>
          </b>
        </div>
      </div>
      <div>
        <br>
        <div class="c-matter-scale-container c-stats-tab-general">
          <div
            v-for="(line, i) in matterScale"
            :key="i"
          >
            {{ $legacyText(_s(line)) }}
          </div>
          <br v-if="matterScale.length < 2">
          <br v-if="matterScale.length < 3">
        </div>
      </div>
      <br>
    </div>
    <div
      v-if="infinity.isUnlocked"
      class="c-stats-tab-subheader c-stats-tab-general"
    >
      <div class="c-stats-tab-title c-stats-tab-infinity">
        {{ $t('ade.eeaef40f3d862f8e') }}
      </div>
      <div>
        <LocalizedText id="ade.25fc59b38c7a409e">
          <template #p0>{{ $legacyText(_s(infinityCountString)) }}</template>
          <template #p1><span v-if="eternity.isUnlocked"> this Eternity</span></template>
        </LocalizedText>
      </div>
      <div v-if="infinity.banked.gt(0)">
        {{ $t('ade.cd1ff500c8f2ac78', { p0: $legacyText(_s(formatDecimalAmount(infinity.banked.floor()))), p1: $legacyText(_s(pluralize("Banked Infinity",infinity.banked.floor()))) }) }}
      </div>
      <div v-if="infinity.hasBest">
        {{ $t('ade.62c9d1875df15da1', { p0: $legacyText(_s(infinity.best.toStringShort())) }) }}
      </div>
      <div v-else>
        <LocalizedText id="ade.f19d55184fe2c3e4">
          <template #p0><span v-if="eternity.isUnlocked"> this Eternity</span></template>
        </LocalizedText>
      </div>
      <div>
        <LocalizedText id="ade.8d531bb52e5d2926">
          <template #p0>{{ $legacyText(_s(infinity.this.toStringShort())) }}</template>
          <template #p1><span v-if="reality.isUnlocked">
          ({{ $legacyText(_s(infinity.thisReal.toStringShort())) }} real time)
        </span></template>
        </LocalizedText>
      </div>
      <div>
        <LocalizedText id="ade.153fef2705d744b2">
          <template #p0><span v-if="eternity.count.gt(0)">this Eternity </span></template>
          <template #p1>{{ $legacyText(_s(format(infinity.bestRate,2,2))) }}</template>
        </LocalizedText>
      </div>
      <br>
    </div>
    <div
      v-if="eternity.isUnlocked"
      class="c-stats-tab-subheader c-stats-tab-general"
    >
      <div class="c-stats-tab-title c-stats-tab-eternity">
        {{ $t('ade.9398ce737a0f9218') }}
      </div>
      <div>
        {{ $t('ade.0581970f3074ed1d', { p0: $legacyText(_s(eternityCountString)) }) }}<span v-if="reality.isUnlocked"> <LocalizedText id="ade.44b4796e147dddd5">
   <template #p0><span :class="{ 'c-stats-tab-doomed' : isDoomed }">{{ $legacyText(_s(isDoomed ? "Armageddon" : "Reality")) }}</span></template>
 </LocalizedText></span>.
      </div>
      <div v-if="infinity.projectedBanked.gt(0)">
        {{ $t('ade.ece1d543889c6482', { p0: $legacyText(_s(formatDecimalAmount(infinity.projectedBanked.floor()))), p1: $legacyText(_s(pluralize("Banked Infinity",infinity.projectedBanked.floor()))), p2: $legacyText(_s(formatDecimalAmount(infinity.bankRate))) }) }}
      </div>
      <div v-else-if="infinity.banked.gt(0)">
        {{ $t('ade.91238d5ac2e0da7c') }}
      </div>
      <div v-if="eternity.hasBest">
        {{ $t('ade.ac94ad608ada89f3', { p0: $legacyText(_s(eternity.best.toStringShort())) }) }}
      </div>
      <div v-else>
        {{ $t('ade.493a32f5e6a2f566') }}<span v-if="reality.isUnlocked"> <LocalizedText id="ade.c9a31d4f172c92d0">
   <template #p0><span :class="{ 'c-stats-tab-doomed' : isDoomed }">{{ $legacyText(_s(isDoomed ? "Armageddon" : "Reality")) }}</span></template>
 </LocalizedText></span>.
      </div>
      <div>
        <LocalizedText id="ade.0bb7e2c178ec69e7">
          <template #p0>{{ $legacyText(_s(eternity.this.toStringShort())) }}</template>
          <template #p1><span v-if="reality.isUnlocked">
          ({{ $legacyText(_s(eternity.thisReal.toStringShort())) }} real time)
        </span></template>
        </LocalizedText>
      </div>
      <div>
        {{ $t('ade.8fc8789955701cb7') }}
        <span v-if="reality.isUnlocked"><LocalizedText id="ade.44b4796e147dddd5">
    <template #p0><span :class="{ 'c-stats-tab-doomed' : isDoomed }">{{ $legacyText(_s(isDoomed ? "Armageddon" : "Reality")) }}</span></template>
  </LocalizedText>
        </span>
        {{ $t('ade.2daae26a30aab1fd', { p0: $legacyText(_s(format(eternity.bestRate,2,2))) }) }}
      </div>
      <br>
    </div>
    <div
      v-if="reality.isUnlocked"
      class="c-stats-tab-subheader c-stats-tab-general"
    >
      <div :class="realityClassObject()">
        {{ $legacyText(_s(isDoomed ? "Doomed Reality" : "Reality")) }}
      </div>
      <div>
        <LocalizedText id="ade.54f45f07035df199">
          <template #p0>{{ $legacyText(_s(realityCountString)) }}</template>
          <template #p1><span v-if="endgame.isUnlocked"> this Endgame</span></template>
        </LocalizedText>
      </div>
      <div v-if="reality.hasBest">
        {{ $t('ade.1e9c73a0e71b1e5f', { p0: $legacyText(_s(reality.best.toStringShort())), p1: $legacyText(_s(reality.bestReal.toStringShort())) }) }}
      </div>
      <div v-else>
        <LocalizedText id="ade.bde90cadbf13800b">
          <template #p0><span v-if="endgame.isUnlocked"> this Endgame</span></template>
        </LocalizedText>
      </div>
      <div :class="{ 'c-stats-tab-doomed' : isDoomed }">
        {{ $t('ade.c5bdd95251d54d0e', { p0: $legacyText(_s(reality.this.toStringShort())), p1: $legacyText(_s(isDoomed?"Armageddon":"Reality")), p2: $legacyText(_s(reality.thisReal.toStringShort())) }) }}
      </div>
      <div
        v-if="isDoomed"
        class="c-stats-tab-doomed"
      >
        {{ $t('ade.3bea109c101c41b2', { p0: $legacyText(_s(realTimeDoomed.toStringShort())) }) }}
      </div>
      <div>
        <LocalizedText id="ade.306a5bbfe7ed09da">
          <template #p0><span v-if="endgame.isUnlocked">this Endgame </span></template>
          <template #p1>{{ $legacyText(_s(format(reality.bestRate,2,2))) }}</template>
        </LocalizedText>
      </div>
      <div>
        <LocalizedText id="ade.a04c66f6be5ea7c6">
          <template #p0><span v-if="endgame.isUnlocked">this Endgame </span></template>
          <template #p1>{{ $legacyText(_s(formatRarity(reality.bestRarity))) }}</template>
        </LocalizedText></div>
      <br>
    </div>
    <div
      v-if="endgame.isUnlocked"
      class="c-stats-tab-subheader c-stats-tab-general"
    >
      <div class="c-stats-tab-title c-stats-tab-endgame">
        {{ $t('ade.07bf328a78ebf91b') }}
      </div>
      <div>
        {{ $t('ade.be635d047cec0c6b', { p0: $legacyText(_s(endgameCountString)) }) }}
      </div>
      <div v-if="endgame.hasBest">
        {{ $t('ade.821427629779c64d', { p0: $legacyText(_s(endgame.best.toStringShort())), p1: $legacyText(_s(endgame.bestReal.toStringShort())) }) }}
      </div>
      <div v-else>
        {{ $t('ade.d34650cd259b3ee5') }}
      </div>
      <div>
        {{ $t('ade.fec3b8568d77e5ec', { p0: $legacyText(_s(endgame.this.toStringShort())), p1: $legacyText(_s(endgame.thisReal.toStringShort())) }) }}
      </div>
      <div>
        {{ $t('ade.0f6bd963645bbf65', { p0: $legacyText(_s(format(endgame.bestRateCP,2,2))) }) }}
      </div>
      <div>
        {{ $t('ade.c008d08b8da642ce', { p0: $legacyText(_s(format(endgame.bestRateDP,2,2))) }) }}
      </div>
      <br>
    </div>
    <div
      v-if="celestialInfinity.isUnlocked"
      class="c-stats-tab-subheader c-stats-tab-general"
    >
      <div class="c-stats-tab-title c-stats-tab-celestial-infinity">
        {{ $t('ade.190b872d96266ed2') }}
      </div>
      <div>
        <LocalizedText id="ade.53e661ee2959f665">
          <template #p0>{{ $legacyText(_s(celestialInfinityCountString)) }}</template>
          <template #p1><span v-if="celestialEternity.isUnlocked"> this Celestial Eternity</span></template>
        </LocalizedText>
      </div>
      <div v-if="celestialInfinity.hasBest">
        {{ $t('ade.044ff5cd1646886e', { p0: $legacyText(_s(celestialInfinity.best.toStringShort())), p1: $legacyText(_s(celestialInfinity.bestReal.toStringShort())) }) }}
      </div>
      <div v-else>
        <LocalizedText id="ade.0d481b26fb1a5d32">
          <template #p0><span v-if="celestialEternity.isUnlocked"> this Celestial Eternity</span></template>
        </LocalizedText>
      </div>
      <div>
        {{ $t('ade.6671b7cedb561510', { p0: $legacyText(_s(celestialInfinity.this.toStringShort())), p1: $legacyText(_s(celestialInfinity.thisReal.toStringShort())) }) }}
      </div>
      <div>
        <LocalizedText id="ade.571c8fc07e17c6a2">
          <template #p0><span v-if="celestialEternity.isUnlocked"> this Celestial Eternity</span></template>
          <template #p1>{{ $legacyText(_s(format(celestialInfinity.bestRate,2,2))) }}</template>
        </LocalizedText>
      </div>
      <br>
    </div>
    <div
      v-if="celestialEternity.isUnlocked"
      class="c-stats-tab-subheader c-stats-tab-general"
    >
      <div class="c-stats-tab-title c-stats-tab-celestial-eternity">
        {{ $t('ade.6bb0245f2b0b1e23') }}
      </div>
      <div>
        {{ $t('ade.f7517e65c9ff97dd', { p0: $legacyText(_s(celestialEternityCountString)) }) }}
      </div>
      <div v-if="celestialEternity.hasBest">
        {{ $t('ade.97725f62f9950335', { p0: $legacyText(_s(celestialEternity.best.toStringShort())), p1: $legacyText(_s(celestialEternity.bestReal.toStringShort())) }) }}
      </div>
      <div v-else>
        {{ $t('ade.41ad7803e9cf571a') }}
      </div>
      <div>
        {{ $t('ade.7e522e59c2490048', { p0: $legacyText(_s(celestialEternity.this.toStringShort())), p1: $legacyText(_s(celestialEternity.thisReal.toStringShort())) }) }}
      </div>
      <div>
        {{ $t('ade.cf3622d0a118944e', { p0: $legacyText(_s(format(celestialEternity.bestRate,2,2))) }) }}
      </div>
      <br>
    </div>
    <div
      v-if="divinity.isUnlocked"
      class="c-stats-tab-subheader c-stats-tab-general"
    >
      <div class="c-stats-tab-title c-stats-tab-divinity">
        {{ $t('ade.808ce92fea7400ba') }}
      </div>
      <div>
        {{ $t('ade.d43e7bb67d067c7a', { p0: $legacyText(_s(divinityCountString)) }) }}
      </div>
      <br>
    </div>
    <div
      v-if="condense.isUnlocked"
      class="c-stats-tab-subheader c-stats-tab-general"
    >
      <div class="c-stats-tab-title c-stats-tab-condense">
        {{ $t('ade.b3ba6d8a36080d8c') }}
      </div>
      <div>
        <LocalizedText id="ade.a94167cd2f2185a0">
          <template #p0>{{ $legacyText(_s(condenseCountString)) }}</template>
          <template #p1><span v-if="supernova.isUnlocked"> this Supernova</span></template>
        </LocalizedText>
      </div>
      <div v-if="condense.hasBest">
        {{ $t('ade.75f7e63a66a5d0ae', { p0: $legacyText(_s(condense.best.toStringShort())), p1: $legacyText(_s(condense.bestReal.toStringShort())) }) }}
      </div>
      <div v-else>
        <LocalizedText id="ade.4c552248333379d3">
          <template #p0><span v-if="supernova.isUnlocked"> this Supernova</span></template>
        </LocalizedText>
      </div>
      <div>
        {{ $t('ade.66aa125a459e9204', { p0: $legacyText(_s(condense.this.toStringShort())), p1: $legacyText(_s(condense.thisReal.toStringShort())) }) }}
      </div>
      <div>
        <LocalizedText id="ade.bd6ea1f4e1a4dc8d">
          <template #p0><span v-if="supernova.isUnlocked"> this Supernova</span></template>
          <template #p1>{{ $legacyText(_s(format(condense.bestRate,2,2))) }}</template>
        </LocalizedText>
      </div>
      <br>
    </div>
    <div
      v-if="supernova.isUnlocked"
      class="c-stats-tab-subheader c-stats-tab-general"
    >
      <div class="c-stats-tab-title c-stats-tab-supernova">
        {{ $t('ade.71dbe0054f8d0165') }}
      </div>
      <div>
        {{ $t('ade.b00912ef9c4cfdb1', { p0: $legacyText(_s(supernovaCountString)) }) }}
      </div>
      <div v-if="supernova.hasBest">
        {{ $t('ade.6d5f7f31d8d6b07f', { p0: $legacyText(_s(supernova.best.toStringShort())), p1: $legacyText(_s(supernova.bestReal.toStringShort())) }) }}
      </div>
      <div v-else>
        {{ $t('ade.57a368a68c0add31') }}
      </div>
      <div>
        {{ $t('ade.31b83c899f1668f7', { p0: $legacyText(_s(supernova.this.toStringShort())), p1: $legacyText(_s(supernova.thisReal.toStringShort())) }) }}
      </div>
      <div>
        {{ $t('ade.73f64e900cd0a071', { p0: $legacyText(_s(format(supernova.bestRate,2,2))) }) }}
      </div>
      <br>
    </div>
  </div>
</template>

<style scoped>
.c-matter-scale-container {
  height: 5rem;
}

.c-stats-tab-general {
  color: var(--color-text);
}

.c-stats-tab-title {
  font-size: 2rem;
  font-weight: bold;
}

.c-stats-tab-subheader {
  height: 15rem;
}

.c-stats-tab-infinity {
  color: var(--color-infinity);
}

.c-stats-tab-eternity {
  color: var(--color-eternity);
}

.c-stats-tab-reality {
  color: var(--color-reality);
}

.c-stats-tab-doomed {
  color: var(--color-pelle--base);
}

.c-stats-tab-endgame {
  color: var(--color-endgame);
}

.c-stats-tab-celestials {
  color: var(--color-celestials);
}

.c-stats-tab-celestial-infinity {
  background: linear-gradient(var(--color-infinity), var(--color-celestials));
  background-clip: text;

  -webkit-text-fill-color: transparent;
}

.c-stats-tab-celestial-eternity {
  background: linear-gradient(var(--color-eternity), var(--color-celestials));
  background-clip: text;

  -webkit-text-fill-color: transparent;
}

.c-stats-tab-divinity {
  color: var(--color-pelle--base);
}

.c-stats-tab-condense {
  background: linear-gradient(red, yellow, cyan);
  background-clip: text;

  -webkit-text-fill-color: transparent;
}

.c-stats-tab-supernova {
  background: linear-gradient(cyan, blue, indigo, purple);
  background-clip: text;

  -webkit-text-fill-color: transparent;
}
</style>
