<script>
export default {
  name: "AutomatorEventLog",
  data() {
    return {
      unsortedEvents: [],
      newestFirst: false,
      timestampMode: 0,
      currentTime: 0,
      maxEntries: 0,
      clearOnReality: false,
      clearOnRestart: false,
    };
  },
  computed: {
    events() {
      // eslint-disable-next-line no-nested-ternary
      const sorted = this.unsortedEvents.sort((a, b) => (a.timestamp === b.timestamp
        ? (a.thisReality === b.thisReality
          ? a.line - b.line
          : a.thisReality - b.thisReality)
        : a.timestamp - b.timestamp));
      return this.newestFirst ? sorted.reverse() : sorted;
    },
    clearTooltip() {
      return `Clear all entries (Max. ${this.maxEntries})`;
    },
    buttonClassObject() {
      return "c-automator-docs--button fas";
    }
  },
  watch: {
    newestFirst(newValue) {
      player.options.automatorEvents.newestFirst = newValue;
    },
    timestampMode(newValue) {
      player.options.automatorEvents.timestampType = newValue;
    },
    clearOnReality(newValue) {
      player.options.automatorEvents.clearOnReality = newValue;
    },
    clearOnRestart(newValue) {
      player.options.automatorEvents.clearOnRestart = newValue;
    }
  },
  methods: {
    update() {
      const eventSettings = player.options.automatorEvents;
      this.unsortedEvents = AutomatorData.eventLog;
      this.newestFirst = eventSettings.newestFirst;
      this.timestampMode = eventSettings.timestampType;
      this.currentTime = Date.now();
      this.maxEntries = eventSettings.maxEntries;
      this.clearOnReality = eventSettings.clearOnReality;
      this.clearOnRestart = eventSettings.clearOnRestart;
    },
    clearLog() {
      AutomatorData.clearEventLog();
      this.update();
    },
    sortStyle(selected) {
      return {
        "background-color": selected ? "var(--color-reality)" : ""
      };
    },
    timestampStyle(key) {
      return {
        "background-color": this.timestampMode === AUTOMATOR_EVENT_TIMESTAMP_MODE[key] ? "var(--color-reality)" : ""
      };
    },
    clearRealityStyle() {
      return {
        "background-color": this.clearOnReality ? "var(--color-reality)" : ""
      };
    },
    clearRestartStyle() {
      return {
        "background-color": this.clearOnRestart ? "var(--color-reality)" : ""
      };
    },
    setTimestampMode(key) {
      this.timestampMode = AUTOMATOR_EVENT_TIMESTAMP_MODE[key];
    },
    timestamp(entry) {
      switch (this.timestampMode) {
        case AUTOMATOR_EVENT_TIMESTAMP_MODE.DISABLED:
          return "";
        case AUTOMATOR_EVENT_TIMESTAMP_MODE.THIS_REALITY:
          return `, ${TimeSpan.fromSeconds(new Decimal(entry.thisReality)).toStringShort()} (real-time) in Reality`;
        case AUTOMATOR_EVENT_TIMESTAMP_MODE.RELATIVE_NOW:
          return `, ${TimeSpan.fromMilliseconds(new Decimal(this.currentTime - entry.timestamp)).toStringShort()} ago`;
        case AUTOMATOR_EVENT_TIMESTAMP_MODE.RELATIVE_PREV:
          if (entry.timegap === entry.timestamp) return `, first logged event`;
          return `, ${TimeSpan.fromMilliseconds(new Decimal(entry.timegap)).toStringShort()} after previous event`;
        case AUTOMATOR_EVENT_TIMESTAMP_MODE.DATE_TIME:
          return `, ${Time.toDateTimeString(entry.timestamp)}`;
        default:
          throw Error("Unrecognized timestamp mode in Automator event log");
      }
    },
    scrollToLine(line) {
      AutomatorScroller.scrollToLine(line);
      AutomatorHighlighter.updateHighlightedLine(line, LineEnum.Event);
    }
  }
};

const AUTOMATOR_EVENT_TIMESTAMP_MODE = {
  DISABLED: 0,
  THIS_REALITY: 1,
  RELATIVE_NOW: 2,
  RELATIVE_PREV: 3,
  DATE_TIME: 4,
};
</script>

<template>
  <div class="c-automator-docs-page">
    <div>
      {{ $t('ade.1e3294dd5b0e17b2') }}
      <br>
      <br>
      {{ $t('ade.7ac218039dc7e5b6') }}
      <br>
      <br>
      <b>{{ $t('ade.90c21b505751a38d') }}</b>
      <button
        v-tooltip="$legacyTooltip('Oldest results first')"
        :style="sortStyle(!newestFirst)"
        :class="buttonClassObject"
        class="fa-angle-down"
        @click="newestFirst = false"
      />
      <button
        v-tooltip="$legacyTooltip('Newest results first')"
        :style="sortStyle(newestFirst)"
        :class="buttonClassObject"
        class="fa-angle-up"
        @click="newestFirst = true"
      />
      <button
        v-tooltip="$legacyTooltip(clearTooltip)"
        :class="buttonClassObject"
        class="fa-trash"
        @click="clearLog"
      />
      <button
        v-tooltip="$legacyTooltip('Clear event log every Reality')"
        :style="clearRealityStyle()"
        :class="buttonClassObject"
        class="fa-eraser"
        @click="clearOnReality = !clearOnReality"
      />
      <button
        v-tooltip="$legacyTooltip('Clear event log on script restart')"
        :style="clearRestartStyle()"
        :class="buttonClassObject"
        class="fa-backspace"
        @click="clearOnRestart = !clearOnRestart"
      />
    </div>
    <div>
      <b>{{ $t('ade.56e8e1f2a54db2d9') }}</b>
      <button
        v-tooltip="$legacyTooltip('No timestamps')"
        :style="timestampStyle('DISABLED')"
        :class="buttonClassObject"
        class="fa-ban"
        @click="setTimestampMode('DISABLED')"
      />
      <button
        v-tooltip="$legacyTooltip('Current time this Reality')"
        :style="timestampStyle('THIS_REALITY')"
        :class="buttonClassObject"
        class="fa-stopwatch"
        @click="setTimestampMode('THIS_REALITY')"
      />
      <button
        v-tooltip="$legacyTooltip('Time elapsed since event')"
        :style="timestampStyle('RELATIVE_NOW')"
        :class="buttonClassObject"
        class="fa-clock"
        @click="setTimestampMode('RELATIVE_NOW')"
      />
      <button
        v-tooltip="$legacyTooltip('Time since last event')"
        :style="timestampStyle('RELATIVE_PREV')"
        :class="buttonClassObject"
        class="fa-arrow-left"
        @click="setTimestampMode('RELATIVE_PREV')"
      />
      <button
        v-tooltip="$legacyTooltip('Date and time')"
        :style="timestampStyle('DATE_TIME')"
        :class="buttonClassObject"
        class="fa-user-clock"
        @click="setTimestampMode('DATE_TIME')"
      />
    </div>
    <span
      v-for="(event, id) in events"
      :key="id"
    >
      <b>{{ $t('ade.6327b888890793d5', { p0: $legacyText(_s(event.line)), p1: $legacyText(_s(timestamp(event))) }) }}</b>
      <button
        v-tooltip="$legacyTooltip('Jump to line')"
        :class="buttonClassObject"
        class="fa-arrow-circle-right"
        @click="scrollToLine(event.line)"
      />
      <div class="c-automator-docs-page__indented">
        <i>{{ $legacyText(_s(event.message)) }}</i>
      </div>
    </span>
  </div>
</template>

<style scoped>

</style>
