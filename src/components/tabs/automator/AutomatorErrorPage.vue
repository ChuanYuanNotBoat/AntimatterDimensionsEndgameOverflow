<script>
export default {
  name: "AutomatorErrorPage",
  data() {
    return {
      errors: [],
    };
  },
  methods: {
    update() {
      this.errors = AutomatorData.currentErrors();
    },
    scrollToLine(line) {
      AutomatorScroller.scrollToLine(line);
      AutomatorHighlighter.updateHighlightedLine(line, LineEnum.Error);
    }
  }
};
</script>

<template>
  <div class="c-automator-docs-page">
    <div v-if="errors.length === 0">
      {{ $t('ade.e3abc85bbe8202d7') }}
    </div>
    <div v-else>
      <b>Your script has the following {{ $legacyText(_s(quantify("error", errors.length))) }}:</b>
      <br>
      <span
        v-for="(error, i) in errors"
        :key="i"
      >
        <b>{{ $t('ade.e065043be7e80514', { p0: $legacyText(_s(error.startLine)) }) }}</b>
        <button
          v-tooltip="$legacyTooltip('Jump to line')"
          class="c-automator-docs--button fas fa-arrow-circle-right"
          @click="scrollToLine(error.startLine)"
        />
        <div class="c-automator-docs-page__indented">
          {{ $legacyText(_s(error.info)) }}
        </div>
        <div class="c-automator-docs-page__indented">
          <i>{{ $t('ade.ec978b2387687339', { p0: $legacyText(_s(error.tip)) }) }}</i>
        </div>
      </span>
      <i>
        {{ $t('ade.ecee5233eb8a05f4') }}
      </i>
    </div>
  </div>
</template>

<style scoped>

</style>
