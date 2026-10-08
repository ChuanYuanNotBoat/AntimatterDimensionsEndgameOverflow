<script>
import { localizedDescription } from "@/i18n/content-display";
import ChallengeBox from "@/components/ChallengeBox";
import DescriptionDisplay from "@/components/DescriptionDisplay";
import EffectDisplay from "@/components/EffectDisplay";

export default {
  name: "InfinityChallengeBox",
  components: {
    ChallengeBox,
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
      isFlipped: false
    };
  },
  computed: {
    config() {
      return localizedDescription(this.challenge.config, `infinity-challenges:${this.challenge.id}`);
    },
    rewardConfig() {
      return localizedDescription(this.challenge.config.reward, `infinity-challenges:${this.challenge.id}`);
    },
    name() {
      return `IC${this.challenge.id}`;
    }
  },
  methods: {
    update() {
      const challenge = this.challenge;
      this.isUnlocked = challenge.isUnlocked;
      this.isRunning = challenge.isRunning;
      this.isCompleted = challenge.isCompleted;
      this.isFlipped = player.universes.current === 2;
    }
  }
};
</script>

<template>
  <ChallengeBox
    :name="name"
    :is-unlocked="isUnlocked"
    :is-running="isRunning"
    :is-completed="isCompleted"
    class="c-challenge-box--infinity"
    @start="challenge.requestStart()"
  >
    <template #top>
      <DescriptionDisplay :config="config" />
      <EffectDisplay
        v-if="isRunning"
        :config="config"
      />
    </template>
    <template #bottom>
      <div class="l-challenge-box__bottom--infinity">
        <span>{{ $t('challenge.goal', { amount: format(config.goal()),
          resource: $t(isFlipped ? 'terms.matter' : 'terms.antimatter') }) }}</span>
        <DescriptionDisplay
          :config="rewardConfig"
          :title="$t('challenge.rewardLabel')"
        />
        <EffectDisplay
          :config="config.reward"
        />
      </div>
    </template>
  </ChallengeBox>
</template>

<style scoped>

</style>
