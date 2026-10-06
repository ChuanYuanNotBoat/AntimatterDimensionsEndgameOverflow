<script>
export default {
  name: "BigCrunchButton",
  data() {
    return {
      isVisible: false,
      gainedIP: new Decimal(0),
      currentIPRate: new Decimal(0),
      peakIPRate: new Decimal(0),
      peakIPRateVal: new Decimal(0),
      currentIP: new Decimal(0),
      tesseractAffordable: false,
      canCrunch: false,
      infinityGoal: new Decimal(0),
      inAntimatterChallenge: false,
      hover: false,
      headerTextColored: true,
      creditsClosed: false,
      showIPRate: false,
      isFlipped: false
    };
  },
  computed: {
    buttonClassObject() {
      return {
        "o-infinity-button--unavailable": !this.canCrunch,
        "o-pelle-disabled-pointer": this.creditsClosed
      };
    },
    // Show IP/min below this threshold, color the IP number above it
    rateThreshold: () => 5e11,
    amountStyle() {
      if (!this.headerTextColored || this.currentIP.lt(this.rateThreshold)) return {
        "transition-duration": "0s"
      };
      if (this.hover) return {
        color: "black",
        "transition-duration": "0.2s"
      };

      // Dynamically generate red-text-green based on the CSS entry for text color, returning a raw 6-digit hex color
      // code. stepRGB is an array specifying the three RGB codes, which are then interpolated between in order to
      // generate the final color; only ratios between 0.9-1.1 give a color gradient
      const textHexCode = getComputedStyle(document.body).getPropertyValue("--color-text").split("#")[1];
      const stepRGB = [
        [255, 0, 0],
        [
          parseInt(textHexCode.substring(0, 2), 16),
          parseInt(textHexCode.substring(2, 4), 16),
          parseInt(textHexCode.substring(4), 16)
        ],
        [0, 255, 0]
      ];
      const ratio = this.gainedIP.log10().div(this.currentIP.log10());
      const interFn = index => {
        if (ratio.lt(0.9)) return stepRGB[0][index];
        if (ratio.lt(1)) {
          const r = (ratio.sub(0.9)).times(10).toNumber();
          return Math.round(stepRGB[0][index] * (1 - r) + stepRGB[1][index] * r);
        }
        if (ratio.lt(1.1)) {
          const r = (ratio.sub(1)).times(10).toNumber();
          return Math.round(stepRGB[1][index] * (1 - r) + stepRGB[2][index] * r);
        }
        return stepRGB[2][index];
      };
      const rgb = [interFn(0), interFn(1), interFn(2)];
      return {
        color: `rgb(${rgb.join(",")})`,
        "transition-duration": "0.2s"
      };
    },
  },
  methods: {
    update() {
      this.isVisible = player.break;
      this.tesseractAffordable = Tesseracts.canBuyTesseract;
      if (!this.isVisible) return;
      this.canCrunch = Player.canCrunch;
      this.infinityGoal.copyFrom(Player.infinityGoal);
      this.inAntimatterChallenge = Player.isInAntimatterChallenge;
      this.headerTextColored = player.options.headerTextColored;
      this.creditsClosed = GameEnd.creditsEverClosed;

      const gainedIP = gainedInfinityPoints();
      this.currentIP.copyFrom(Currency.infinityPoints);
      this.gainedIP.copyFrom(gainedIP);
      this.currentIPRate.copyFrom(gainedIP.dividedBy(Math.clampMin(0.0005, Time.thisInfinityRealTime.totalMinutes.toNumber())));
      this.peakIPRate.copyFrom(player.records.thisInfinity.bestIPmin);
      this.peakIPRateVal.copyFrom(player.records.thisInfinity.bestIPminVal);
      this.showIPRate = this.peakIPRate.lte(this.rateThreshold);
      this.isFlipped = player.universes.current === 2;
    },
    switchToInfinity() {
      Tab.dimensions.infinity.show(true);
    },
    crunch() {
      if (!Player.canCrunch) return;
      manualBigCrunchResetRequest();
    }
  },
};
</script>

<template>
  <button
    v-if="isVisible && !tesseractAffordable"
    :class="buttonClassObject"
    class="o-prestige-button o-infinity-button"
    @click="crunch"
    @mouseover="hover = true"
    @mouseleave="hover = false"
  >
    <!-- Cannot Crunch -->
    <template v-if="!canCrunch">
      <LocalizedText id="infinity.crunch.requirement">
        <template #p0>{{ format(infinityGoal, 2, 2) }}</template>
        <template #p1><br></template>
        <template #p2>{{ $t(isFlipped ? 'terms.matter' : 'terms.antimatter') }}</template>
      </LocalizedText>
    </template>

    <!-- Can Crunch in challenge -->
    <template v-else-if="inAntimatterChallenge">
      <LocalizedText id="ade.b4de8f3319900581">
        <template #p0><br></template>
      </LocalizedText>
    </template>

    <!-- Can Crunch -->
    <template v-else>
      <div v-if="!showIPRate" />
      <b>
        <LocalizedText id="ade.b286bfb59fd91edd">
          <template #p0><span :style="amountStyle">{{ $legacyText(_s(format(gainedIP, 2))) }}</span></template>
          <template #p1><span v-if="showIPRate"> {{ $t('ade.86533e9829fbcdf8') }}</span>
<span v-else> {{ $t('ade.c8610389b1942566', { p0: $legacyText(_s(pluralize("Point",gainedIP))) }) }}</span></template>
        </LocalizedText>

      </b>
      <template v-if="showIPRate">
        <LocalizedText id="ade.ab7b0ae0503e704d">
    <template #p0><br></template>
    <template #p1>{{ $legacyText(_s(format(currentIPRate,2))) }}</template>
    <template #p2><br></template>
    <template #p3>{{ $legacyText(_s(format(peakIPRate,2))) }}</template>
    <template #p4><br></template>
    <template #p5>{{ $legacyText(_s(format(peakIPRateVal,2))) }}</template>
  </LocalizedText>
      </template>
      <div v-else />
    </template>
  </button>

  <button
    v-else-if="tesseractAffordable"
    class="o-prestige-button c-game-header__tesseract-available"
    :class="{ 'o-pelle-disabled-pointer': creditsClosed }"
    @click="switchToInfinity"
  >
    <b>
      {{ $t('ade.7ba9bcf3f55fec8c') }}
    </b>
  </button>
</template>

<style scoped>

</style>
