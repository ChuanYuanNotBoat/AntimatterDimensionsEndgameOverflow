<script>
import EndgameUpgradeButton from "./EndgameUpgradeButton";

export default {
  name: "EndgameUpgradesTab",
  components: {
    EndgameUpgradeButton
  },
  computed: {
    upgrades: () => EndgameUpgrades.all,
    costScalingTooltip: () => `Prices start increasing faster above ${format(1e100)} CP and then even faster
      above ${format(DC.NUMMAX, 1)} CP`,
    possibleTooltip: () => `Checkered upgrades are impossible to unlock this Endgame. Striped upgrades are
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
  <div class="l-endgame-upgrade-grid">
    <div class="c-endgame-upgrade-infotext">
      {{ $t('ade.85a581122b858ea7') }} <i class="fas fa-question-circle" /> {{ $t('ade.e169190b3cdcce9a') }}
      <br>
      {{ $t('ade.efc176404e930881') }}
      <span :ach-tooltip="$legacyText(costScalingTooltip)">
        <i class="fas fa-question-circle" />
      </span>
      {{ $t('ade.8096a4c84e232aa2') }}
      <br>
      {{ $t('ade.6fc343de35b1b8fb') }}
      <span :ach-tooltip="$legacyText(possibleTooltip)">
        <i class="fas fa-question-circle" />
      </span>
      <br>
      {{ $t('ade.38ca641dce4c5a63') }}
      <br>
      {{ $t('ade.1376ed272e52269b') }} <i class="fas fa-lock-open" /> to make the game prevent you
      from doing anything this Endgame which would cause you to fail their unlock condition.
      <span :ach-tooltip="$legacyText(lockTooltip)">
        <i class="fas fa-question-circle" />
      </span>
      <br>
    </div>
    <div
      v-for="row in 5"
      :key="row"
      class="l-endgame-upgrade-grid__row"
    >
      <EndgameUpgradeButton
        v-for="column in 5"
        :key="id(row, column)"
        :upgrade="upgrades[id(row, column)]"
      />
    </div>
  </div>
</template>

<style scoped>
.c-endgame-upgrade-infotext {
  color: var(--color-text);
  margin: -1rem 0 1.5rem;
}
</style>
