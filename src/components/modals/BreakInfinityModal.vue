<script>
import ModalWrapperChoice from "@/components/modals/ModalWrapperChoice";

export default {
  name: "BreakInfinityModal",
  data() {
    return {
      isFlipped: false
    };
  },
  components: {
    ModalWrapperChoice
  },
  computed: {
    message() {
      const infinity = formatPostBreak(Number.MAX_VALUE, 2);
      const values = { infinity, resource: this.$t(this.isFlipped ? "terms.matter" : "terms.antimatter") };
      const lines = [this.$t(PlayerProgress.eternityUnlocked() ? "breakInfinity.gain" : "breakInfinity.firstGain", values),
        this.$t("breakInfinity.costs", values), this.$t("breakInfinity.points", values)];
      if (!EternityMilestone.keepAutobuyers.isReached) lines.push(this.$t("breakInfinity.autobuyers"));
      return lines;
    },
  },
  methods: {
    update() {
      this.isFlipped = player.universes.current === 2;
    },
    handleYesClick() {
      breakInfinity();
    }
  },
};
</script>

<template>
  <ModalWrapperChoice
    :show-cancel="false"
    @confirm="handleYesClick"
  >
    <template #header>
      {{ $t('breakInfinity.title') }}
    </template>
    <div class="c-modal-message__text">
      <span
        v-for="(line, index) in message"
        :key="index"
      >
        {{ $legacyText(_s(line)) }} <br>
      </span>
    </div>
    <template #confirm-text>
      {{ $t('breakInfinity.confirm') }}
    </template>
  </ModalWrapperChoice>
</template>
