<script>
import ModalWrapperChoice from "@/components/modals/ModalWrapperChoice";

export default {
  name: "EnterUniverseModal",
  components: {
    ModalWrapperChoice,
  },
  props: {
    number: {
      type: Number,
      required: true,
    },
    name: {
      type: String,
      required: true
    }
  },
  computed: {
    topLabel() {
      return `${this.name} Universe`;
    },
    message() {
      return this.$t("universes.entry.reset", { universe: this.$legacyText(this.topLabel) });
    },
    description() {
      switch (this.number) {
        case 1:
          return this.$t("universes.entry.transientDescription", {
            speed: format(0.001, 3, 3), penalty: format(0.1, 1, 1),
            tetration: format(0.9, 1, 1), dilation: format(0.1, 1, 1)
          });
        case 2:
          return this.$t("universes.entry.tangibleDescription", { speed: format(0.001, 3, 3), height: formatInt(1) });
        case 3:
          return ``;
        case 4:
          return ``;
        case 5:
          return ``;
        case 6:
          return ``;
        case 7:
          return ``;
        case 8:
          return ``;
        default: throw new Error(`Attempted to start an Unknown Universe in Universe Modal Confirmation.`);
      }
    },
    reward() {
      switch (this.number) {
        case 1:
          return `Existing the Transient Universe will give Ephemeral Light based on highest Antimatter reached,
          which empowers Galaxy Generation inside Doom and Tachyon Particles and Dilated Time gain outside Pelle.`;
        case 2:
          return this.$t("universes.entry.tangibleReward");
        case 3:
          return ``;
        case 4:
          return ``;
        case 5:
          return ``;
        case 6:
          return ``;
        case 7:
          return ``;
        case 8:
          return ``;
        default: throw new Error(`Could not find Universe reward in Universe Modal Confirmation.`);
      }
    },
    highestAntimatter() {
      switch (this.number) {
        case 1:
          return player.universes.highestTransientAntimatter;
        case 2:
          return player.universes.highestTangibleMatter;
        case 3:
          return new Decimal();
        case 4:
          return new Decimal();
        case 5:
          return new Decimal();
        case 6:
          return new Decimal();
        case 7:
          return new Decimal();
        case 8:
          return new Decimal();
        default: throw new Error(`Could not find highest Antimatter in Universe Modal Confirmation.`);
      }
    }
  },
  methods: {
    handleYesClick() {
      enterUniverse(this.number);
    }
  },
};
</script>

<template>
  <ModalWrapperChoice @confirm="handleYesClick">
    <template #header>
      {{ $legacyText(topLabel) }}
    </template>
    <div>
      {{ message }}
      <br>
      <br>
      <div
        v-if="description"
        class="universe-description"
      >
        <br><br>
        {{ $legacyText(description) }}
      </div>
      <br><br>
      <div>
        {{ $legacyText(reward) }}
      </div>
      <br>
      <div>
        {{ $t('universes.entry.rewardThreshold', { amount: format(highestAntimatter, 2, 1), resource: $t(number === 2 ? 'terms.matter' : 'terms.antimatter'), universe: $legacyText(topLabel) }) }}
      </div>
    </div>
    <template #confirm-text>
      {{ $t('universes.entry.button') }}
    </template>
  </ModalWrapperChoice>
</template>

<style scoped>
.universe-description {
  padding: 0 2rem;
}
</style>
