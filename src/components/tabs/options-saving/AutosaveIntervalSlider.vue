<script>
import SliderComponent from "@/components/SliderComponent";

export default {
  name: "AutosaveIntervalSlider",
  components: {
    SliderComponent
  },
  props: {
    min: {
      type: Number,
      required: true,
    },
    max: {
      type: Number,
      required: true,
    },
    interval: {
      type: Number,
      required: true,
    }
  },
  data() {
    return {
      sliderInterval: 10
    };
  },
  computed: {
    sliderProps() {
      return {
        min: this.min,
        max: this.max,
        interval: this.interval,
        width: "100%",
        tooltip: false
      };
    },
  },
  methods: {
    update() {
      this.sliderInterval = player.options.autosaveInterval / 1000;
    },
    adjustSliderValue(value) {
      this.sliderInterval = value;
      player.options.autosaveInterval = this.sliderInterval * 1000;
      GameOptions.refreshAutosaveInterval();
    }
  }
};
</script>

<template>
  <div class="o-primary-btn o-primary-btn--option o-primary-btn--slider l-options-grid__button">
    <b>{{ $t('ade.23f93c68b2fc2da0', { p0: $legacyText(_s(formatInt(sliderInterval))) }) }}</b>
    <SliderComponent
      class="o-primary-btn--slider__slider"
      v-bind="sliderProps"
      :value="sliderInterval"
      @input="adjustSliderValue($event)"
    />
  </div>
</template>
