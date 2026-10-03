<script>
import PrimaryToggleButton from "@/components/PrimaryToggleButton";

export default {
  name: "ModalOptionsToggleButton",
  components: {
    PrimaryToggleButton
  },
  props: {
    value: {
      type: Boolean,
      required: false,
      default: false,
    },
    text: {
      type: String,
      required: true
    }
  },
  computed: {
    styleObject() {
      return {
        "background-color": this.value ? "var(--color-good)" : "var(--color-gh-purple)",
      };
    },
  }
};
</script>

<template>
  <PrimaryToggleButton
    :value="value"
    :label="$legacyText(text)"
    class="o-primary-btn--modal-option"
    :style="styleObject"
    @input="emitInput"
  />
</template>
