<script>
import PrimaryButton from "@/components/PrimaryButton";
import { MULTIPLIER_TAB_GROUPS } from "@/components/tabs/statistics/multiplier-tab-navigation";

export default {
  name: "CursedHeader",
  components: {
    PrimaryButton
  },
  data() {
    return {
      findChance: 0,
      findInterval: 0,
      now: Date.now(),
      lastFound: 0,
      canHunt: false,
      cores: 0
    };
  },
  computed: {
    classObj() {
      return {
        "o-primary-btn": true,
        "o-primary-btn--disabled": !this.canHunt
      };
    },
    huntText() {
      if (this.canHunt) return this.$t("slabdrill.core.hunt");
      const time = TimeSpan.fromMilliseconds(new Decimal(this.findInterval).sub(this.now - this.lastFound)).toStringShort();
      return this.$t("slabdrill.core.wait", { time: this.$legacyText(time) });
    },
    intervalText() {
      return `${TimeSpan.fromMilliseconds(new Decimal(this.findInterval)).toStringShort()}`;
    }
  },
  methods: {
    update() {
      this.findChance = Slabdrill.huntChance;
      this.findInterval = Slabdrill.huntInterval;
      this.now = Date.now();
      this.lastFound = player.celestials.slabdrill.core.lastFound;
      this.canHunt = this.now - this.lastFound >= this.findInterval;
      this.cores = player.celestials.slabdrill.core.chaosCores;
    },
    hunt() {
      Slabdrill.hunt();
    },
    changeTabs() {
      if (ui.view.tab === "dimensions" && ui.view.subtab === "antimatter") this.openADAnalysis();
      else if (ui.view.tab === "statistics" && ui.view.subtab === "multipliers") Tab.celestials.slabdrill.show(true);
      else Tab.dimensions.antimatter.show(true);
    },
    openADAnalysis() {
      const option = MULTIPLIER_TAB_GROUPS.flatMap(group => group.options).find(entry => entry.key === "AD");
      player.options.multiplierTab.currTab = option.id;
      Tab.statistics.multipliers.show(true);
    }
  }
};
</script>

<template>
  <span class="c-cursed-header">
    <span>
      {{ $t('slabdrill.core.huntStatus', {
        amount: $legacyText(quantifyInt("Chaos Core", cores)),
        chance: formatPercents(findChance, 2, 2), interval: $legacyText(intervalText)
      }) }}
    </span>
    <br>
    <br>
    <span class="o-cursed-btn-row">
      <PrimaryButton
        class="o-cursed-btn"
        :class="classObj"
        @click="hunt"
      >
        {{ $legacyText(_s(huntText)) }}
      </PrimaryButton>
      <PrimaryButton
        class="o-primary-btn o-cursed-btn"
        @click="changeTabs"
      >
        {{ $t('slabdrill.core.changeTabs') }}
      </PrimaryButton>
    </span>
  </span>
</template>

<style scoped>
.c-cursed-header {
  font-weight: bold;
  color: red;
}

.o-cursed-btn-row {
  display: flex;
  flex-direction: row;
  justify-content: center;
}

.o-cursed-btn {
  width: 20rem;
  font-size: 1rem;
  margin-left: 2rem;
  margin-right: 2rem;
}
</style>
