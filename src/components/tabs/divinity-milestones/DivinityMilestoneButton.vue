<script>
import { resolveText } from "@/i18n/text-ref";

export default {
  name: "DivinityMilestoneButton",
  props: {
    getMilestone: {
      type: Function,
      required: true
    }
  },
  data() {
    return {
      isReached: false,
    };
  },
  computed: {
    milestone() {
      return this.getMilestone();
    },
    config() {
      return this.milestone.config;
    },
    descriptionLines() {
      return resolveText(this.config.reward).split("\n").map(x => x.trim());
    },
    divinities() {
      return this.config.divinities;
    },
    reward() {
      const reward = this.config.reward;
      return typeof reward === "function" ? reward() : reward;
    },
    rewardClassObject() {
      return {
        "o-divinity-milestone__reward": true,
        "o-divinity-milestone__reward--locked": !this.isReached,
        "o-divinity-milestone__reward--reached": this.isReached
      };
    },
    activeCondition() {
      return this.config.activeCondition ? this.config.activeCondition() : null;
    },
  },
  methods: {
    update() {
      this.isReached = this.milestone.isReached;
    }
  }
};
</script>

<template>
  <div
    v-if="isReached"
    class="l-divinity-milestone"
  >
    <span class="o-divinity-milestone__goal">
      {{ $legacyText(_s(quantifyInt("Divinity", divinities))) }}:
    </span>
    <button
      v-tooltip="$legacyTooltip(activeCondition)"
      :class="rewardClassObject"
    >
      <div
        v-for="(description, descriptionKey) in descriptionLines"
        :key="descriptionKey"
        class="c-divinity-reward-description"
      >
        {{ description }}
      </div>
    </button>
  </div>
</template>

<style scoped>
.o-divinity-milestone__reward {
  max-width: calc(100vw - 16rem);
}

.c-divinity-reward-description {
  text-align: left;
  overflow-wrap: anywhere;
}

@media (max-width: 600px) {
  .o-divinity-milestone__reward {
    max-width: calc(100vw - 4rem);
    padding: 2rem;
  }
}
</style>
