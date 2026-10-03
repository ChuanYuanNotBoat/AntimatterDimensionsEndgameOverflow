<script>
import { isTextRef, resolveText } from "@/i18n/text-ref";
import wordShift from "@/core/word-shift";

/* eslint-disable no-empty-function */
export default {
  name: "DescriptionDisplay",
  props: {
    config: {
      type: Object,
      required: false,
      default: undefined
    },
    name: {
      type: String,
      required: false,
      default: undefined
    },
    length: {
      type: Number,
      required: false,
      default: undefined
    },
    title: {
      type: String,
      required: false,
      default: ""
    }
  },
  data() {
    return {
      isVisible: false,
      description: ""
    };
  },
  computed: {
    classObject() {
      const name = this.name;
      if (name === undefined) {
        return undefined;
      }
      const classes = {};
      classes[name] = true;
      if (this.description.length >= this.length) {
        classes[`${name}--small-text`] = true;
      }
      return classes;
    }
  },
  watch: {
    $i18nRevision() {
      this.configureDescription();
    },
    config: {
      immediate: true,
      handler() {
        this.configureDescription();
      }
    }
  },
  beforeCreate() {
    this.updateFunction = () => { };
  },
  methods: {
    configureDescription() {
      this.updateFunction = () => { };
      const description = this.config?.description;
      this.isVisible = description !== undefined;
      if (!this.isVisible) return;
      const refresh = () => {
        const value = resolveText(description);
        const capitalized = value.charAt(0).toUpperCase() + value.slice(1);
        this.description = this.config.scrambleText && typeof description !== "string"
          ? capitalized.replace("*", wordShift.wordCycle(this.config.scrambleText, true))
          : capitalized;
      };
      refresh();
      if (typeof description === "function" || (isTextRef(description) && typeof description.values === "function")) {
        this.updateFunction = refresh;
      }
    },
    update() {
      this.updateFunction();
    }
  },
};
</script>

<template>
  <span
    v-if="isVisible"
    :class="classObject"
  >
    {{ $legacyText(_s(title)) }} {{ $legacyText(_s(description)) }}
  </span>
</template>
