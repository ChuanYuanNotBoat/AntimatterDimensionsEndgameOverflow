<script>
import { localizedDescription } from "@/i18n/content-display";
import wordShift from "@/core/word-shift";

import DescriptionDisplay from "@/components/DescriptionDisplay";
import EffectDisplay from "@/components/EffectDisplay";
import EternityChallengeBoxWrapper from "./EternityChallengeBoxWrapper";

export default {
  name: "EternityChallengeBox",
  components: {
    EternityChallengeBoxWrapper,
    DescriptionDisplay,
    EffectDisplay
  },
  props: {
    challenge: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      isUnlocked: false,
      isRunning: false,
      isCompleted: false,
      canBeUnlocked: false,
      completions: 0,
      showGoalSpan: false,
      lastGoal: "",
    };
  },
  computed: {
    config() {
      return localizedDescription(this.challenge.config, `eternity-challenges:${this.challenge.id}`);
    },
    rewardConfig() {
      return localizedDescription(this.challenge.config.reward, `eternity-challenges:${this.challenge.id}`);
    },
    goalDisplay() {
      const config = this.config;
      let goal = this.$t("challenge.goal", { amount: this.goalAtCompletions(this.completions),
        resource: this.$t("terms.infinityPoint") });
      if (config.restriction) {
        const restriction = config.restriction(this.completions);
        const text = this.challenge.id === 4
          ? (restriction === 0 ? this.$t("challenge.noInfinities")
            : this.$t("challenge.infinityLimit", { count: formatInt(restriction) }))
          : this.$t("challenge.timeLimit", { seconds: format(restriction, 0, 1) });
        goal += ` ${text}`;
      }
      return goal;
    },
    firstGoal() {
      return this.goalAtCompletions(0);
    },
    currentRewardConfig() {
      const challenge = this.challenge;
      const config = this.config.reward;
      return {
        effect: () => config.effect(challenge.completions),
        formatEffect: config.formatEffect,
        cap: config.cap,
      };
    },
    nextRewardConfig() {
      const challenge = this.challenge;
      const config = this.config.reward;
      return {
        effect: () => config.effect(challenge.completions + 1),
        formatEffect: config.formatEffect,
        cap: config.cap,
      };
    },
    name() {
      return `EC${this.challenge.id}`;
    }
  },
  methods: {
    update() {
      const challenge = this.challenge;
      this.isUnlocked = challenge.isUnlocked;
      this.isRunning = challenge.isRunning;
      this.isCompleted = challenge.isFullyCompleted;
      this.completions = challenge.completions;
      this.showGoalSpan = PlayerProgress.realityUnlocked();
      this.canBeUnlocked = TimeStudy.eternityChallenge(challenge.id).canBeBought;

      this.lastGoal = (Enslaved.isRunning && this.challenge.id === 1)
        ? wordShift.wordCycle(this.config.scrambleText.map(x => format(x)))
        : this.goalAtCompletions(this.challenge.maxCompletions - 1);
    },
    start() {
      if (this.canBeUnlocked) {
        TimeStudy.eternityChallenge(this.challenge.id).purchase();
      } else this.challenge.requestStart();
    },
    goalAtCompletions(completions) {
      return format(this.challenge.goalAtCompletions(completions), 2, 1);
    }
  }
};
</script>

<template>
  <EternityChallengeBoxWrapper
    :name="name"
    :is-unlocked="isUnlocked"
    :is-running="isRunning"
    :is-completed="isCompleted"
    :can-be-unlocked="canBeUnlocked"
    :completion-count="completions"
    @start="start"
  >
    <template #top>
      <DescriptionDisplay :config="config" />
    </template>
    <template #bottom>
      <div :style="{ visibility: completions < 5 ? 'visible' : 'hidden' }">
        <div>
          {{ $t('challenge.completions', { count: formatInt(completions) }) }}
        </div>
        {{ goalDisplay }}
      </div>
      <span v-if="showGoalSpan">
        {{ $t('challenge.goalSpan', { first: firstGoal, last: lastGoal }) }}
      </span>
      <span>
        {{ $t('challenge.rewardLabel') }}
        <DescriptionDisplay
          :config="rewardConfig"
          :length="55"
          name="c-challenge-box__reward-description"
        />
      </span>
      <span>
        <EffectDisplay
          v-if="completions > 0"
          :config="currentRewardConfig"
        />
        <span v-if="completions > 0 && completions < 5">|</span>
        <EffectDisplay
          v-if="completions < 5"
          :config="nextRewardConfig"
          :label="$t('challenge.next')"
          :ignore-capped="true"
        />
      </span>
    </template>
  </EternityChallengeBoxWrapper>
</template>

<style scoped>

</style>
