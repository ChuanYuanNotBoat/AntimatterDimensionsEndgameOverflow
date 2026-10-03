<script>
import ModalWrapperChoice from "@/components/modals/ModalWrapperChoice";

export default {
  name: "UpgradeMechanicLockModal",
  components: {
    ModalWrapperChoice
  },
  props: {
    upgrade: {
      type: Object,
      required: true
    },
    isImaginary: {
      type: Boolean,
      required: true,
    },
    isDual: {
      type: Boolean,
      required: true,
    },
    isEndgame: {
      type: Boolean,
      required: true,
    },
    specialLockText: {
      type: String,
      required: false,
      default: null,
    }
  },
  computed: {
    upgradeStr() {
      if (this.isEndgame) return "Endgame Upgrade";
      if (this.isDual) return "Duality Upgrade";
      return this.isImaginary ? "Imaginary Upgrade" : "Reality Upgrade";
    },
    lockEvent() {
      return this.specialLockText ?? this.upgrade.lockEvent;
    }
  },
  methods: {
    disableLock() {
      this.upgrade.setMechanicLock(false);
    }
  }
};
</script>

<template>
  <ModalWrapperChoice
    @confirm="disableLock"
  >
    <template #header>
      {{ upgradeStr }} Condition Lock
    </template>
    <div class="c-modal-message__text">
      <LocalizedText id="ade.7ea20e0ef95f0338">
        <template #p0>{{ $legacyText(_s(lockEvent)) }}</template>
        <template #p1><span class="l-emphasis">
        fail the requirement for the {{ $legacyText(_s(upgradeStr)) }} "{{ $legacyText(_s(upgrade.name)) }}"
      </span></template>
        <template #p2><span :ach-tooltip="upgrade.requirement">
        <i class="fas fa-question-circle" />
      </span></template>
        <template #p3><br></template>
        <template #p4><br></template>
        <template #p5><br></template>
        <template #p6><br></template>
      </LocalizedText>
    </div>
    <template #confirm-text>
      Disable Lock
    </template>
  </ModalWrapperChoice>
</template>

<style scoped>
.l-emphasis {
  font-weight: bold;
  color: var(--color-bad);
}
</style>
