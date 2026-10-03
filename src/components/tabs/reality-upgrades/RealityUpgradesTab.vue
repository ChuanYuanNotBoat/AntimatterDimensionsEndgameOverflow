<script>
import RealityUpgradeButton from "./RealityUpgradeButton";

export default {
  name: "RealityUpgradesTab",
  components: {
    RealityUpgradeButton
  },
  computed: {
    upgrades: () => RealityUpgrades.all,
    costScalingTooltip: () => `Prices start increasing faster above ${format(1e30)} RM and then even faster
      above ${format(DC.NUMMAX, 1)} RM`,
    possibleTooltip: () => `Checkered upgrades are impossible to unlock this Reality. Striped upgrades are
      still possible.`,
    lockTooltip: () => `This will only function if you have not already failed the condition or
      unlocked the upgrade.`,
  },
  methods: {
    id(row, column) {
      return (row - 1) * 5 + column - 1;
    }
  }
};
</script>

<template>
  <div class="l-reality-upgrade-grid">
    <div class="c-reality-upgrade-infotext">
      {{ $t('ade.85a581122b858ea7') }} <i class="fas fa-question-circle" /> {{ $t('ade.e169190b3cdcce9a') }}
      <br>
      {{ $t('ade.efc176404e930881') }}
      <span :ach-tooltip="$legacyText(costScalingTooltip)">
        <i class="fas fa-question-circle" />
      </span>
      {{ $t('ade.39967a263af7126f') }}
      <br>
      {{ $t('ade.06f4a389e8fbfb5a') }}
      <span :ach-tooltip="$legacyText(possibleTooltip)">
        <i class="fas fa-question-circle" />
      </span>
      <br>
      {{ $t('ade.bb28a9ea037ac430') }}
      <br>
      {{ $t('ade.1376ed272e52269b') }} <i class="fas fa-lock-open" /> to make the game prevent you
      from doing anything this Reality which would cause you to fail their unlock condition.
      <span :ach-tooltip="$legacyText(lockTooltip)">
        <i class="fas fa-question-circle" />
      </span>
      <br>
      Every completed row of purchased upgrades increases your Glyph level by {{ $legacyText(_s(formatInt(1))) }}.
    </div>
    <div
      v-for="row in 5"
      :key="row"
      class="l-reality-upgrade-grid__row"
    >
      <RealityUpgradeButton
        v-for="column in 5"
        :key="id(row, column)"
        :upgrade="upgrades[id(row, column)]"
      />
    </div>
  </div>
</template>

<style scoped>
.c-reality-upgrade-infotext {
  color: var(--color-text);
  margin: -1rem 0 1.5rem;
}
</style>
