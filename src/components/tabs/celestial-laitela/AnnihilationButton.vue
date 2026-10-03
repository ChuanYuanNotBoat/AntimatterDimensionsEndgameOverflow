<script>
export default {
  name: "AnnihilationButton",
  data() {
    return {
      darkMatter: new Decimal(0),
      darkMatterMult: new Decimal(0),
      darkMatterMultGain: new Decimal(0),
      autobuyerUnlocked: false,
      annihilationButtonVisible: false,
      matterRequirement: 0,
      darkMatterMultRatio: new Decimal(0),
      autoAnnihilationInput: player.auto.annihilation.multiplier,
      isEnabled: true,
      modeUnlocked: false,
      annihilationMode: 0,
      isBasic: true,
    };
  },
  computed: {
    annihilationInputStyle() {
      return { "background-color": this.isEnabled ? "" : "var(--color-bad)" };
    }
  },
  methods: {
    update() {
      this.darkMatter.copyFrom(Currency.darkMatter);
      this.darkMatterMult.copyFrom(Laitela.darkMatterMult);
      // Preview the actual capped increase, not the theoretical gain at BEMAX.
      this.darkMatterMultGain.copyFrom(Laitela.darkMatterMultAfterAnnihilation.sub(Laitela.darkMatterMult));
      this.autobuyerUnlocked = Autobuyer.annihilation.isUnlocked;
      this.annihilationButtonVisible = Laitela.canAnnihilate || this.autobuyerUnlocked;
      this.matterRequirement = Laitela.annihilationDMRequirement;
      this.darkMatterMultRatio.copyFrom(Laitela.darkMatterMultRatio);
      this.isEnabled = player.auto.annihilation.isActive;
      this.modeUnlocked = ExpansionPack.laitelaPack.isBought && !player.disablePostReality;
      this.annihilationMode = player.auto.annihilation.mode;
      this.isBasic = this.annihilationMode === 0;
    },
    annihilate() {
      Laitela.annihilate();
    },
    modeToggle() {
      player.auto.annihilation.mode = (player.auto.annihilation.mode + 1) % 2;
    },
    handleAutoAnnihilationInputChange() {
      const float = parseFloat(this.autoAnnihilationInput);
      if (isNaN(float)) {
        this.autoAnnihilationInput = player.auto.annihilation.multiplier;
      } else {
        player.auto.annihilation.multiplier = float;
      }
    },
    classObject() {
      return {
        "l-laitela-annihilation-container": true,
        "l-laitela-annihilation-container--large": this.modeUnlocked
      };
    }
  }
};
</script>

<template>
  <div :class="classObject()">
    <button
      v-if="darkMatter.lt(matterRequirement)"
      class="l-laitela-annihilation-button"
    >
      {{ $t('ade.5fdc9073da96a233', { p0: $legacyText(_s(format(matterRequirement,2))) }) }}
    </button>
    <button
      v-else
      class="l-laitela-annihilation-button c-laitela-annihilation-button"
      @click="annihilate"
    >
      <b>{{ $t('ade.961b54020dd50c84') }}</b>
    </button>
    <br>
    <br>
    <span v-if="darkMatterMult.gt(1)">
      {{ $t('ade.ad469327a649bf60') }} <b>{{ $legacyText(_s(formatX(darkMatterMult, 2, 2))) }}</b>
      <br>
      <br>
      {{ $t('ade.5f95e9634be1b1cb') }}
      <b>+{{ $legacyText(_s(format(darkMatterMultGain, 2, 2))) }}</b> to your Annihilation multiplier.
      <br>
      (<b>{{ $legacyText(_s(formatX(darkMatterMultRatio, 2, 2))) }}</b> from previous multiplier)
      <span v-if="autobuyerUnlocked">
        <br>
        <br>
        <span v-if="isBasic">
          {{ $t('ade.ee377669fe2cb21f') }}
        </span>
        <span v-if="!isBasic">
          {{ $t('ade.a2fac105ae960c8e') }}
        </span>
        <input
          v-model="autoAnnihilationInput"
          type="text"
          :style="annihilationInputStyle"
          class="c-small-autobuyer-input c-laitela-annihilation-input"
          @change="handleAutoAnnihilationInputChange()"
        >
        <span v-if="isBasic">
          {{ $t('ade.57ae762c7a4a2707') }}
        </span>
        <span v-if="!isBasic">
          {{ $t('ade.a20dab309bcffe4a') }}
        </span>
      </span>
    </span>
    <span v-else>
      <LocalizedText id="ade.aa64f59e2f8ac0ea">
        <template #p0><b>{{ $legacyText(_s(formatX(darkMatterMultGain.add(1), 2, 2))) }}</b></template>
      </LocalizedText>
    </span>
    <br>
    <br>
    <button
      v-if="modeUnlocked"
      class="l-laitela-annihilation-button c-laitela-annihilation-button"
      @click="modeToggle"
    >
      <b>{{ $t('ade.c91eb995a24a5993') }}</b>
    </button>
  </div>
</template>
