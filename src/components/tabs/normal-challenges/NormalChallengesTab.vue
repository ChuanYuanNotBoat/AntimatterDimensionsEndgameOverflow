<script>
import ChallengeGrid from "@/components/ChallengeGrid";
import ChallengeTabHeader from "@/components/ChallengeTabHeader";
import NormalChallengeBox from "./NormalChallengeBox";

export default {
  name: "NormalChallengesTab",
  components: {
    ChallengeGrid,
    ChallengeTabHeader,
    NormalChallengeBox
  },
  data() {
    return {
      showCharge: false,
      charges: 0,
      isFlipped: false
    };
  },
  computed: {
    challenges() {
      return NormalChallenges.all;
    }
  },
  methods: {
    update() {
      this.showCharge = Ascensions.oc3A.isUnlocked && player.endgame.overcharge.allowComplex;
      this.charges = Math.min(player.endgame.overcharge.completions.chall, 12);
      this.isFlipped = player.universes.current === 2;
    }
  }
};
</script>

<template>
  <div class="l-challenges-tab">
    <ChallengeTabHeader />
    <div>
      {{ $t('ade.dc6ab157ae4ae24d') }}
    </div>
    <div>
      {{ $t('challenge.normalAutobuyer', { resource: $t(isFlipped ? 'terms.matter' : 'terms.antimatter') }) }}
    </div>
    <div v-if="showCharge">
      <LocalizedText id="ade.e41f8ad682ecbec7">
    <template #p0><br></template>
    <template #p1>{{ $legacyText(_s(formatInt(charges))) }}</template>
    <template #p2>{{ $legacyText(_s(formatInt(12))) }}</template>
    <template #p3>{{ $legacyText(_s(formatInt(12))) }}</template>
    <template #p4><br></template>
  </LocalizedText>
    </div>
    <ChallengeGrid
      v-slot="{ challenge }"
      :challenges="challenges"
    >
      <NormalChallengeBox :challenge="challenge" />
    </ChallengeGrid>
  </div>
</template>

<style scoped>

</style>
