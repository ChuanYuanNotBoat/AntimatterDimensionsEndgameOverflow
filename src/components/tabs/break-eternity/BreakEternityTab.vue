<script>
import BreakEternityButton from "./BreakEternityButton";
import BreakEternityUpgradeButton from "./BreakEternityUpgradeButton";

export default {
  name: "BreakEternityTab",
  components: {
    BreakEternityButton,
    BreakEternityUpgradeButton
  },
  data() {
    return {
      isUnlocked: false,
      antimatterReq: new Decimal(0),
      isFlipped: false
    };
  },
  computed: {
    grid() {
      return [
        [
          BreakEternityUpgrade.antimatterDimensionPow,
          BreakEternityUpgrade.infinityDimensionPow,
          BreakEternityUpgrade.timeDimensionPow,
          BreakEternityUpgrade.replicantiIntervalPow,
          BreakEternityUpgrade.tachyonParticlePow,
        ],
        [
          BreakEternityUpgrade.galaxyScaleDelay,
          BreakEternityUpgrade.infinityPowerConversion,
          BreakEternityUpgrade.epMultiplierDelay,
          BreakEternityUpgrade.replicantiGalaxyPower,
          BreakEternityUpgrade.dilatedTimeMultiplier,
        ],
        [
          BreakEternityUpgrade.doubleIPUncap,
          BreakEternityUpgrade.tgThresholdUncap,
          BreakEternityUpgrade.tesseractMultiplier,
          BreakEternityUpgrade.glyphSacrificeUncap,
          BreakEternityUpgrade.glyphSlotImprovement
        ]
      ];
    }
  },
  methods: {
    update() {
      this.isUnlocked = (PlayerProgress.endgameUnlocked() && player.antimatter.gte(DC.E9E15)) || player.break2;
      this.antimatterReq = DC.E9E15;
      this.isFlipped = player.universes.current === 2;
    },
    btnClassObject(column) {
      return {
        "l-break-eternity-upgrade-grid__cell": true,
        "o-break-eternity-upgrade-btn--multiplier": column === 1 || column === 2
      };
    },
    timeDisplayShort(time) {
      return timeDisplayShort(time);
    }
  }
};
</script>

<template>
  <div class="l-break-eternity-tab">
    <div v-if="!isUnlocked">
      {{ $t('endgame.breakEternity.unlock', { amount: format(antimatterReq, 2, 1), resource: $t(isFlipped ? 'terms.matter' : 'terms.antimatter') }) }}
    </div>
    <BreakEternityButton class="l-break-eternity-tab__break-btn" />
    <div
      v-if="isUnlocked"
      class="l-break-eternity-upgrade-grid l-break-eternity-tab__grid"
    >
      <div
        v-for="(column, columnId) in grid"
        :key="columnId"
        class="l-break-eternity-upgrade-grid__row"
      >
        <BreakEternityUpgradeButton
          v-for="upgrade in column"
          :key="upgrade.id"
          :upgrade="upgrade"
          :class="btnClassObject(columnId)"
        />
      </div>
    </div>
    <div>
      {{ $t(isFlipped ? 'ade.bff617a48096f688' : 'ade.35d3c89b5b7d585d') }}
    </div>
  </div>
</template>

<style scoped>

</style>
