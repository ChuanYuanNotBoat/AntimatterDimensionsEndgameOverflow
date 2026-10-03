<script>
export default {
  name: "EndgameButton",
  data() {
    return {
      canEndgame: false,
      showPelleGlow: false,
      gainedCP: 0,
      gainedDP: 0,
      isFlipped: false
    };
  },
  computed: {
    formatCPGain() {
      return `Celestial Points gained: ${format(this.gainedCP, 2)}`;
    },
    formatDPGain() {
      return `Doomed Particles gained: ${format(this.gainedDP, 2)}`;
    },
    classObject() {
      return {
        "c-endgame-button--unlocked": this.canEndgame,
        "c-endgame-button--locked": !this.canEndgame,
        "c-endgame-button--special": this.showPelleGlow,
      };
    }
  },
  methods: {
    update() {
      this.canEndgame = isEndgameAvailable();
      this.showPelleGlow = true;
      if (!this.canEndgame) {
        this.gainedCP = 0;
        this.gainedDP = 0;
        return;
      }
      this.gainedCP = gainedCelestialPoints();
      this.gainedDP = gainedDoomedParticles();
      this.isFlipped = player.universes.current === 2;
    },
    handleClick() {
      if (this.canEndgame) {
        Endgame.newEndgame();
      }
    }
  }
};
</script>

<template>
  <div class="l-endgame-button">
    <button
      class="c-endgame-button infotooltip"
      :class="classObject"
      @click="handleClick"
    >
      <div class="l-endgame-button__contents">
        <template v-if="canEndgame">
          <div class="c-endgame-button__header">
            {{ $t('ade.d1f77184b56b2dd2') }}
          </div>
          <div>{{ $legacyText(_s(formatCPGain)) }}</div>
          <div>{{ $legacyText(_s(formatDPGain)) }}</div>
        </template>
        <template v-else>
          <div>
            {{ $t('ade.1017e673f528e424', { p0: $legacyText(_s(format("e9e15",2,2))), p1: $legacyText(_s(isFlipped?"Matter":"Antimatter")) }) }}
          </div>
        </template>
        <div
          v-if="canEndgame"
          class="infotooltiptext"
        >
          <div>{{ $t('ade.6b8d954ec075b802') }}</div>
        </div>
      </div>
    </button>
  </div>
</template>

<style scoped>

</style>
