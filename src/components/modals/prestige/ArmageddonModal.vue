<script>
import ModalWrapperChoice from "@/components/modals/ModalWrapperChoice";

export default {
  name: "ArmageddonModal",
  components: {
    ModalWrapperChoice
  },
  data() {
    return {
      isDoomed: false,
      remnantsGain: new Decimal(0),
      realityShardGain: new Decimal(0),
      nextRealityShardGain: new Decimal(0),
      canArmageddon: false,
    };
  },
  computed: {
    topLabel() {
      if (!this.isDoomed) return `You are about to Doom your Reality`;
      return `You are about to perform an Armageddon reset`;
    },
    message() {
      const isFirstReset = (Currency.remnants.eq(0))
        ? `which will produce ${format(this.nextRealityShardGain, 2, 2)} Reality Shards/s`
        : `which will increase your Reality Shards gain from ${format(this.realityShardGain, 2, 2)}/s
          to ${format(this.nextRealityShardGain, 2, 2)}/s`;

      return `Armageddon will start a new Doomed Reality. You will gain
      ${quantify("Remnant", this.remnantsGain, 2, 0)} ${isFirstReset}`;
    }
  },
  methods: {
    update() {
      this.isDoomed = Pelle.isDoomed;
      this.remnantsGain.copyFrom(Pelle.remnantsGain);
      this.realityShardGain.copyFrom(Pelle.realityShardGainPerSecond);
      this.nextRealityShardGain.copyFrom(Pelle.nextRealityShardGain);
      this.canArmageddon = Pelle.canArmageddon;
    },
    handleYesClick() {
      Pelle.initializeRun();
    },
  },
};
</script>

<template>
  <ModalWrapperChoice
    :option="isDoomed ? 'armageddon' : 'doom'"
    @confirm="handleYesClick"
  >
    <template #header>
      {{ topLabel }}
    </template>
    <div
      v-if="!isDoomed"
      class="c-modal-message__text"
    >
      <LocalizedText id="ade.fd49eebd3a16869b">
        <template #p0><br></template>
        <template #p1><br></template>
      </LocalizedText>
    </div>
    <div
      v-else
      class="c-modal-message__text"
    >
      {{ $legacyText(_s(message)) }}
    </div>
  </ModalWrapperChoice>
</template>
