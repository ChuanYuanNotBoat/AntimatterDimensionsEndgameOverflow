<script>
import PrimaryButton from "@/components/PrimaryButton";

export default {
  name: "PrimaryToggleButton",
  components: {
    PrimaryButton
  },
  props: {
    label: {
      type: String,
      required: false,
      default: ""
    },
    on: {
      type: String,
      required: false,
      default: undefined
    },
    off: {
      type: String,
      required: false,
      default: undefined
    },
    value: {
      type: Boolean,
      required: true
    },
  },
  computed: {
    displayText() {
      const state = this.value ? (this.on ?? this.$t("common.on")) : (this.off ?? this.$t("common.off"));
      return `${this.label} ${state}`.trim();
    }
  },
};
</script>

<template>
  <PrimaryButton
    v-bind="$attrs"
    @click="emitInput(!value)"
  >
    {{ $legacyText(_s(displayText)) }}
  </PrimaryButton>
</template>
