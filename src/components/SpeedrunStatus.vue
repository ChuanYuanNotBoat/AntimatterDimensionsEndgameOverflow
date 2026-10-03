<script>
export default {
  name: "SpeedrunStatus",
  data() {
    return {
      isActive: false,
      isSegmented: false,
      usedSTD: false,
      hasStarted: false,
      startDate: 0,
      saveName: "",
      timePlayedStr: "",
      offlineProgress: false,
      offlineFraction: 0,
      mostRecent: {},
      isCollapsed: false,
      timeSince: 0,
      seedText: 0,
      canModifySeed: false,
      isComplete: false,
    };
  },
  computed: {
    statusText() {
      if (this.isComplete) return `<span style="color: var(--color-good)">Finished!</span>`;
      return this.hasStarted
        ? `<span style="color: var(--color-good)">Running!</span>`
        : `<span style="color: var(--color-bad)">Not Started Yet</span>`;
    },
    segmentText() {
      return this.isSegmented ? "Segmented Speedrun (imported save)" : "Single-segment Speedrun (no save import)";
    },
    iapText() {
      return this.usedSTD ? "IAPs have been used" : "No IAPs Used";
    },
    offlineText() {
      const stateText = this.offlineProgress
        ? `<span style="color: var(--color-good)">Enabled</span>`
        : `<span style="color: var(--color-bad)">Disabled</span>`;
      const fractionText = this.offlineFraction === 0
        ? "(No offline time used)"
        : `(${formatPercents(this.offlineFraction, 2)} time spent offline)`;
      return `${stateText} ${fractionText}`;
    },
    collapseIcon() {
      return this.isCollapsed
        ? "fas fa-expand-arrows-alt"
        : "fas fa-compress-arrows-alt";
    }
  },
  methods: {
    update() {
      const speedrun = player.speedrun;
      this.isActive = speedrun.isActive;
      this.canModifySeed = Speedrun.canModifySeed();
      // Short-circuit if speedrun isn't active; updating some later stuff can cause vue errors outside of speedruns
      if (!this.isActive) return;
      this.isSegmented = speedrun.isSegmented;
      this.usedSTD = speedrun.usedSTD;
      this.hasStarted = speedrun.hasStarted;
      this.startDate = speedrun.startDate;
      this.saveName = speedrun.name;
      this.isCollapsed = speedrun.hideInfo;
      this.isComplete = Achievement(188).isUnlocked;

      this.timePlayedStr = Time.realTimePlayed.toStringShort();
      this.offlineProgress = player.options.offlineProgress;
      this.offlineFraction = speedrun.offlineTimeUsed / Math.clampMin(player.records.realTimePlayed, 1);
      this.mostRecent = Speedrun.mostRecentMilestone();
      this.timeSince = Time.realTimePlayed.minus(TimeSpan.fromMilliseconds(new Decimal(speedrun.records[this.mostRecent] ?? 0)))
        .toStringShort();
      this.seedText = Speedrun.seedModeText();
    },
    milestoneName(id) {
      const db = GameDatabase.speedrunMilestones;
      return id === 0 ? "None" : db.find(m => m.id === id).name;
    },
    changeName() {
      if (this.hasStarted) return;
      Modal.changeName.show();
    },
    collapseText() {
      return this.isCollapsed ? "Expand" : `Click to collapse Speedrun info`;
    },
    toggleCollapse() {
      player.speedrun.hideInfo = !this.isCollapsed;
    },
    openSeedModal() {
      if (!this.canModifySeed) return;
      Modal.modifySeed.show();
    }
  },
};
</script>

<template>
  <div
    v-if="isActive"
    class="c-speedrun-status"
  >
    <div v-if="!isCollapsed">
      <b>{{ $t('ade.d64c2dca026cff9d') }}<span v-html="$legacyHtml(statusText)" />)</b>
      <br>
      <span
        :class="{ 'c-speedrun-status--can-change': !hasStarted }"
        @click="changeName"
      >
        {{ $t('ade.1a5893293782c88a', { p0: $legacyText(_s(saveName)) }) }}
      </span>
      <br>
      <i>{{ $legacyText(_s(segmentText)) }}</i>
      <br>
      <i>{{ $legacyText(_s(iapText)) }}</i>
      <br>
      <span
        :class="{ 'c-speedrun-status--can-change': canModifySeed }"
        @click="openSeedModal()"
      >{{ $legacyText(_s(seedText)) }}</span>
      <br>
      {{ $t('ade.c4ad8b645213ff40', { p0: $legacyText(_s(timePlayedStr)) }) }}
      <br>
      {{ $t('ade.ff43616b6aa95269') }} <span v-html="$legacyHtml(offlineText)" />
      <br>
      {{ $t('ade.39ff7fedbc636f8b', { p0: $legacyText(_s(milestoneName(mostRecent))) }) }} <span v-if="mostRecent">{{ $t('ade.0b1ced927dca81b7', { p0: $legacyText(_s(timeSince)) }) }}</span>
      <br>
    </div>
    <div
      class="c-speedrun-status--collapse"
      @click="toggleCollapse"
    >
      <i :class="collapseIcon" />
      {{ $legacyText(_s(collapseText())) }}
      <i :class="collapseIcon" />
    </div>
  </div>
</template>

<style scoped>
.c-speedrun-status {
  white-space: nowrap;
  position: absolute;
  right: 2rem;
  bottom: 1rem;
  z-index: 5;
  font-size: 1.2rem;
  color: var(--color-text);
  background-color: var(--color-base);
  border: var(--var-border-width, 0.2rem) solid var(--color-accent);
  padding: 0.8rem 2rem;
  pointer-events: auto;
  -webkit-user-select: none;
  user-select: none;
}

.c-speedrun-status--can-change {
  text-decoration: underline;
  cursor: pointer;
}

.c-speedrun-status--collapse {
  padding: 0.2rem;
  cursor: pointer;
}
</style>
