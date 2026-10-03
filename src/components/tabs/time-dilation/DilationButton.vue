<script>
export default {
  name: "DilationButton",
  data() {
    return {
      isUnlocked: false,
      isRunning: false,
      hasGain: false,
      requiredForGain: new Decimal(),
      canEternity: false,
      eternityGoal: new Decimal(),
      tachyonGain: new Decimal(),
      remnantRequirement: 0,
      showRequirement: false,
      creditsClosed: false,
      isFlipped: false
    };
  },
  computed: {
    disableText() {
      // Doesn't need to be reactive or check strike status; it's always permanent once entered in Doomed
      return Pelle.isDoomed && !PelleStrikes.dilation.isDestroyed() ? "Dilation is permanent." : "Disable Dilation.";
    }
  },
  methods: {
    update() {
      this.isUnlocked = PlayerProgress.dilationUnlocked();
      this.isRunning = player.dilation.active;
      this.remnantRequirement = Pelle.remnantRequirementForDilation;
      this.showRequirement = Pelle.isDoomed && !Pelle.canDilateInPelle;
      if (!this.isRunning) return;
      this.canEternity = Player.canEternity;
      // This lets this.hasGain be true even before eternity.
      this.hasGain = getTachyonGain(false).gt(0);
      if (this.canEternity && this.hasGain) {
        this.tachyonGain.copyFrom(getTachyonGain(true));
      } else if (this.hasGain) {
        this.eternityGoal.copyFrom(Player.eternityGoal);
      } else {
        this.requiredForGain.copyFrom(getTachyonReq());
      }
      this.creditsClosed = GameEnd.creditsEverClosed;
      this.isFlipped = player.universes.current === 2;
    },
    dilate() {
      if (this.creditsClosed) return;
      startDilatedEternityRequest();
    }
  }
};
</script>

<template>
  <button
    class="o-dilation-btn"
    :class="isUnlocked ? 'o-dilation-btn--unlocked' : 'o-dilation-btn--locked'"
    @click="dilate()"
  >
    <span v-if="!isUnlocked">{{ $t('ade.56de18fb8a84375c') }}</span>
    <span v-else-if="!isRunning">
      {{ $t('ade.c227871f17dbd6ab') }}
      <div v-if="showRequirement">
        {{ $t('ade.f0f91df63a44450d', { p0: $legacyText(_s(format(remnantRequirement,2))) }) }}
      </div>
    </span>
    <span v-else-if="canEternity && hasGain">
      <LocalizedText id="ade.89ca63d5500cadb7">
        <template #p0>{{ $legacyText(_s(disableText)) }}</template>
        <template #p1><br></template>
        <template #p2>{{ $legacyText(_s(quantify("Tachyon Particle",tachyonGain,2,1))) }}</template>
      </LocalizedText>
    </span>
    <span v-else-if="hasGain">
      <LocalizedText id="ade.7a9eb41ae2dae795">
        <template #p0>{{ $legacyText(_s(disableText)) }}</template>
        <template #p1><br></template>
        <template #p2>{{ $legacyText(_s(quantify("Infinity Point",eternityGoal,1,0))) }}</template>
      </LocalizedText>
    </span>
    <span v-else>
      <LocalizedText id="ade.85df24ba7729fe0a">
        <template #p0>{{ $legacyText(_s(disableText)) }}</template>
        <template #p1><br></template>
        <template #p2>{{ $legacyText(_s(format(requiredForGain,2,1))) }}</template>
        <template #p3>{{ $legacyText(_s(isFlipped?"matter":"antimatter")) }}</template>
      </LocalizedText>
    </span>
  </button>
</template>

<style scoped>

</style>
