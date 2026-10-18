<script>
import ModalWrapperChoice from "@/components/modals/ModalWrapperChoice";

export default {
  name: "ExitCompressionModal",
  components: {
    ModalWrapperChoice
  },
  data() {
    return {
      hawkingRadiationGain: new Decimal(0)
    };
  },
  computed: {
    gainText() {
      if (this.hawkingRadiationGain.lte(0)) return `not gain anything`;
      return `gain ${quantify("Hawking Radiation", this.hawkingRadiationGain, 2, 1)}`;
    }
  },
  methods: {
    update() {
      if (!player.compression.active) this.emitClose();
      this.hawkingRadiationGain.copyFrom(getHawkingRadiationGain(true));
    },
    handleYesClick() {
      exitCompression();
    },
  },
};
</script>

<template>
  <ModalWrapperChoice
    option="compression"
    @confirm="handleYesClick"
  >
    <template #header>
      <span>
        {{ $t('compression.exit.header') }}
      </span>
    </template>
    <div class="c-modal-message__text">
      <span>
        {{ $t('compression.exit.confirm', { gain: $legacyText(gainText) }) }}
      </span>
      <br>
      {{ $t('ade.a4d500e55df8919f') }}
    </div>
    <template #confirm-text>
      {{ $t('compression.exit.button') }}
    </template>
  </ModalWrapperChoice>
</template>
