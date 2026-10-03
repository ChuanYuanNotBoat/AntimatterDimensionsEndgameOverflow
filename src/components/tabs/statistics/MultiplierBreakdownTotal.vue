<script>
import { BreakdownEntryInfo } from "./breakdown-entry-info";

// The live headline is independent of the expensive breakdown tree. The
// global UI mixin calls update() on every UI frame, just like the original
// statistics headline, while the parent only samples source impacts as needed.
export default {
  name: "MultiplierBreakdownTotal",
  props: {
    resource: {
      type: BreakdownEntryInfo,
      required: true,
    },
    presentation: { type: String, default: "formula" },
    valueMode: { type: String, default: "all" }
  },
  data() {
    return { text: "" };
  },
  watch: {
    resource() {
      this.update();
    },
    valueMode() {
      this.update();
    }
  },
  created() {
    this.update();
  },
  methods: {
    update() {
      const resource = this.resource;
      const name = resource.name;
      const override = resource.displayOverride;
      if (override) {
        this.text = `${name}: ${override}`;
        return;
      }
      const transform = resource.getTransform(false, this.valueMode);
      if (transform?.aggregate) {
        let valueText = transform.display ?? "";
        if (!valueText && transform.value !== null && transform.value !== undefined) {
          valueText = transform.type === "power"
            ? `${formatPow(transform.value, 2, 3)} per tier`
            : formatX(transform.value, 2, 2);
        }
        this.text = valueText ? `${name}: ${valueText}` : name;
        return;
      }
      const value = resource.mult;
      this.text = resource.isBase
        ? `${name}: ${format(value, 2, 2)}`
        : `${name}: ${formatX(value, 2, 2)}`;
    }
  }
};
</script>

<template>
  <span>{{ $legacyText(_s(text)) }}</span>
</template>
