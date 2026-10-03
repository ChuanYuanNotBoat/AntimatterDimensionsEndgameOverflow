<script>
import ModalWrapper from "@/components/modals/ModalWrapper";
import PrimaryButton from "@/components/PrimaryButton";

export default {
  name: "EnslavedHintsModal",
  components: {
    ModalWrapper,
    PrimaryButton
  },
  data() {
    return {
      currentStored: new Decimal(0),
      nextHintCost: new Decimal(0),
      canGetHint: false,
      shownEntries: [],
      realityHintsLeft: 0,
      glyphHintsLeft: 0,
      hints: 0,
    };
  },
  computed: {
    hintCost() {
      return `${quantify("year", TimeSpan.fromMilliseconds(new Decimal(this.nextHintCost)).totalYears, 2)}`;
    },
    formattedStored() {
      return `${quantify("year", TimeSpan.fromMilliseconds(new Decimal(this.currentStored)).totalYears, 2)}`;
    },
    hasProgress(id) {
      return this.progressEntries.some(entry => entry.id === id);
    },
    // Note: This calculation seems to behave extremely poorly if the goal has been raised more than 12 hints worth
    // of cost bumps and I'm not entirely sure why. There's probably a numerical issue I can't quite figure out, but
    // considering that much cost raising can't happen in practice I think I'm just going to leave it be.
    timeEstimate() {
      if (this.currentStored.gte(new Decimal(this.nextHintCost))) return "";

      // Relevant values are stored as milliseconds, so multiply the rate by 1000 to get to seconds
      const storeRate = new Decimal(1000).times(Enslaved.isStoringGameTime
        ? Enslaved.currentBlackHoleStoreAmountPerMs
        : getGameSpeedupFactor());
      const alreadyWaited = this.currentStored.div(storeRate);
      const decaylessTime = new Decimal(this.nextHintCost).div(storeRate);

      // Check if decay is irrelevant and don't do the hard calculations if so
      const minCostEstimate = (TimeSpan.fromYears(new Decimal(1e40)).totalMilliseconds.sub(this.currentStored)).div(storeRate);
      if (TimeSpan.fromSeconds(minCostEstimate).totalDays.toNumber() > this.hints) {
        return `${TimeSpan.fromSeconds(minCostEstimate).toStringShort(true)}`;
      }

      // Decay is 3x per day, but the math needs decay per second
      const K = Decimal.pow(3, 1 / 86400);
      const x = decaylessTime.times(Decimal.ln(K)).times(Decimal.pow(K, alreadyWaited)).toNumber();
      const timeToGoal = new Decimal(productLog(x)).div(Decimal.ln(K)).sub(alreadyWaited);
      return `${TimeSpan.fromSeconds(timeToGoal).toStringShort(true)}`;
    }
  },
  methods: {
    update() {
      this.currentStored.copyFrom(player.celestials.enslaved.stored);
      this.nextHintCost.copyFrom(Enslaved.nextHintCost);
      this.canGetHint = this.currentStored.gte(new Decimal(this.nextHintCost));
      this.shownEntries = [];

      this.realityHintsLeft = EnslavedProgress.all.length;
      for (const prog of EnslavedProgress.all) {
        if (prog.hasHint) {
          this.shownEntries.push([false, prog]);
          this.realityHintsLeft--;
        }
      }

      const glyphHintCount = player.celestials.enslaved.glyphHintsGiven;
      for (let hintNum = 0; hintNum < glyphHintCount; hintNum++) {
        this.shownEntries.push([true, GameDatabase.celestials.enslaved.glyphHints[hintNum]]);
      }
      this.glyphHintsLeft = GameDatabase.celestials.enslaved.glyphHints.length - glyphHintCount;

      this.hints = Enslaved.hintCostIncreases;
    },
    giveRealityHint(available) {
      if (available <= 0 || !Enslaved.spendTimeForHint()) return;
      EnslavedProgress.all.filter(prog => !prog.hasHint).randomElement().unlock();
    },
    giveGlyphHint(available) {
      if (available <= 0 || !Enslaved.spendTimeForHint()) return;
      player.celestials.enslaved.glyphHintsGiven++;
    }
  },

};
</script>

<template>
  <ModalWrapper>
    <template #header>
      Cracks in The Nameless Ones' Reality
    </template>
    <div class="c-enslaved-hint-modal c-modal--short">
      <div>
        {{ $t('ade.1e58ef7db034dac1') }}
      </div>
      <br>
      <div
        v-for="(entry, index) in shownEntries"
        :key="index"
      >
        <div v-if="!entry[0]">
          <span v-if="entry[1].hasHint && !entry[1].hasProgress">
            <i class="c-icon-wrapper fas fa-question-circle" />
            <b>{{ $t('ade.da3f05ef6a95a7b3') }}</b>
          </span>
          <span v-else>
            <i class="c-icon-wrapper fa-solid fa-house-crack" />
            <b>{{ $t('ade.2ad9af48774cded8') }}</b>
          </span>
          <br>
          - {{ $legacyText(_s(entry[1].hintInfo)) }}
          <br>
          - {{ $legacyText(_s(entry[1].hasProgress ? entry[1].completedInfo : "?????")) }}
        </div>
        <div v-else>
          <i class="fa-solid fa-shapes" /> <b>{{ $t('ade.eee60b53671f87d9') }}</b>
          <br>
          {{ $legacyText(_s(entry[1])) }}
        </div>
        <br>
      </div>
      <div v-if="realityHintsLeft + glyphHintsLeft > 0">
        {{ $t('ade.b5ce7744c9188d79', { p0: $legacyText(_s(formatInt(3))), p1: $legacyText(_s(formatInt(24))), p2: $legacyText(_s(formatInt(2))), p3: $legacyText(_s(format(1e40))) }) }}
        <br><br>
        {{ $t('ade.649a5e848f7ed7e3', { p0: $legacyText(_s(hintCost)), p1: $legacyText(_s(formattedStored)) }) }}
        <span v-if="currentStored < nextHintCost">
          {{ $t('ade.2557c23f942cd6b6', { p0: $legacyText(_s(timeEstimate)) }) }}
        </span>
        <br><br>
        <PrimaryButton
          :enabled="realityHintsLeft > 0 && canGetHint"
          class="l-enslaved-hint-button"
          @click="giveRealityHint(realityHintsLeft)"
        >
          {{ $t('ade.4c242fa6d01316ce', { p0: $legacyText(_s(formatInt(realityHintsLeft))) }) }}
        </PrimaryButton>
        <br>
        <PrimaryButton
          :enabled="glyphHintsLeft > 0 && canGetHint"
          class="l-enslaved-hint-button"
          @click="giveGlyphHint(glyphHintsLeft)"
        >
          {{ $t('ade.3405eeb03278a05e', { p0: $legacyText(_s(formatInt(glyphHintsLeft))) }) }}
        </PrimaryButton>
      </div>
      <div v-else>
        <b>{{ $t('ade.cf5ccf8975f62481') }}</b>
      </div>
    </div>
  </ModalWrapper>
</template>

<style scoped>
.c-icon-wrapper {
  margin-right: 1rem;
}

.l-enslaved-hint-button {
  margin: 0.4rem 0;
}
</style>
