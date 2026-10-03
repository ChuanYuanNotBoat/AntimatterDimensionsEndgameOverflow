<script>
import GlyphSetPreview from "@/components/GlyphSetPreview";

export default {
  name: "LaitelaRunButton",
  components: {
    GlyphSetPreview
  },
  data() {
    return {
      realityTime: 0,
      maxDimTier: 0,
      isRunning: false,
      realityReward: new Decimal(1),
      singularitiesUnlocked: false,
      bestSet: [],
      tierNotCompleted: true,
      hadronizeUnlocked: false,
      darkEnergyBoost: new Decimal(0),
      hasHadronizes: false,
      hadronizes: 0,
    };
  },
  computed: {
    completionTime() {
      if (this.tierNotCompleted) return "Not completed at this tier";
      return `Fastest Completion: ${TimeSpan.fromSeconds(new Decimal(this.realityTime)).toStringShort()}`;
    },
    runEffects() {
      return GameDatabase.celestials.descriptions[5].effects().split("\n");
    },
    runDescription() {
      return GameDatabase.celestials.descriptions[5].description();
    },
    isDoomed: () => Pelle.isDoomed || Slabdrill.isCursed,
  },
  methods: {
    update() {
      this.realityTime = player.celestials.laitela.fastestCompletion;
      this.maxDimTier = Laitela.maxAllowedDimension;
      this.realityReward.copyFrom(Laitela.realityReward);
      this.isRunning = Laitela.isRunning;
      this.singularitiesUnlocked = Currency.singularities.gt(0);
      this.bestSet = cloneDeep(Glyphs.copyForRecords(player.records.bestReality.laitelaSet));
      this.tierNotCompleted = this.realityTime === 3600 || (this.realityTime === 300 && this.maxDimTier < 8);
      this.hadronizeUnlocked = ExpansionPack.laitelaPack.isBought && !player.disablePostReality;
      this.darkEnergyBoost.copyFrom(Laitela.realityRewardDE);
      this.hasHadronizes = this.hadronizes > 0;
      this.hadronizes = Laitela.hadronizes;
    },
    startRun() {
      if (this.isDoomed) return;
      Modal.celestials.show({ name: "Lai'tela's", number: 5 });
    },
    classObject() {
      return {
        "o-laitela-run-button": true,
        "o-laitela-run-button--large": !this.singularitiesUnlocked,
        "o-laitela-run-button--larger": this.hadronizeUnlocked
      };
    },
    runButtonClassObject() {
      return {
        "o-laitela-run-button__icon": true,
        "o-laitela-run-button__icon--running": this.isRunning,
        "c-celestial-run-button--clickable": !this.isDoomed,
        "o-pelle-disabled-pointer": this.isDoomed
      };
    },
    hadronize() {
      Laitela.hadronize();
    }
  }
};
</script>

<template>
  <button :class="classObject()">
    <span :class="{ 'o-pelle-disabled': isDoomed }">
      <b>{{ $t('ade.efe1a6822c07408b') }}</b>
    </span>
    <div
      :class="runButtonClassObject()"
      @click="startRun"
    />
    <div v-if="realityReward.gt(1)">
      <b>
        {{ $t('ade.be27ee5587430159', { p0: $legacyText(_s(formatX(realityReward,2,2))) }) }}
      </b>
      <br>
      <span v-if="maxDimTier === 0 || hasHadronizes">
        <b>
          {{ $t('ade.7e75b08a62a5cc00', { p0: $legacyText(_s(formatX(darkEnergyBoost))) }) }}
        </b>
      </span>
      <span v-if="hasHadronizes">
        <b>
          {{ $t('ade.e875a2ab45d1fe8b', { p0: $legacyText(_s(formatHybridSmall(hadronizes,3))) }) }}
        </b>
      </span>
      <span v-if="maxDimTier > 0">
        <br><br>
        {{ $legacyText(_s(completionTime)) }}
        <br>
        <span v-if="maxDimTier <= 7">
          <b>{{ $t('ade.b754bc27a18d105d', { p0: $legacyText(_s(formatInt(maxDimTier))) }) }}</b>
        </span>
        <br><br>
        {{ $t('ade.6b86fcb5d4c04854') }}
        <GlyphSetPreview
          text="Fastest Destabilization Glyph Set"
          :text-hidden="true"
          :force-name-color="false"
          :glyphs="bestSet"
        />
      </span>
      <span v-else>
        <LocalizedText id="ade.74d966b4a517acec">
    <template #p0><br></template>
    <template #p1><br></template>
  </LocalizedText>
      </span>
      <br>
    </div>
    <div
      v-for="(line, lineId) in runEffects"
      :key="lineId + '-laitela-run-desc' + maxDimTier"
    >
      {{ $legacyText(_s(line)) }} <br>
    </div>
    <br>
    <div>{{ $legacyText(_s(runDescription)) }}</div>
    <br>
    <div v-if="hadronizeUnlocked">
      <button
        class="l-laitela-hadronize-button c-laitela-hadronize-button"
        @click="hadronize"
      >
        <b>{{ $t('ade.b1669604f4f094b3') }}</b>
      </button>
      <br>
      <br>
      {{ $t('ade.bb3aa8f8940972d5', { p0: $legacyText(_s(formatInt(8))), p1: $legacyText(_s(formatInt(8))) }) }}
    </div>
  </button>
</template>
