<script>
import ModalWrapper from "@/components/modals/ModalWrapper";
import PrimaryButton from "@/components/PrimaryButton";

export default {
  name: "ModifySeedModal",
  components: {
    ModalWrapper,
    PrimaryButton,
  },
  data() {
    return {
      mode: 0,
      inputSeed: "",
      seedText: "",
      convertedInput: false,
      seedValue: 0,
    };
  },
  computed: {
    choiceEnum: () => SPEEDRUN_SEED_STATE,
    officialSeed: () => Speedrun.officialFixedSeed,
  },
  created() {
    this.seedValue = player.speedrun.initialSeed;
    this.inputSeed = `${player.speedrun.initialSeed}`;
    this.convertedInput = false;
  },
  methods: {
    update() {
      this.mode = player.speedrun.seedSelection;
      this.seedText = Speedrun.seedModeText();
    },
    handleSeedInput() {
      if (this.inputSeed.match(/^-?\d+$/gu)) {
        const num = Number(this.inputSeed);
        this.seedValue = Math.abs(num) > 9e15
          ? this.hashStringToSeed(this.inputSeed)
          : Number(this.inputSeed);
      } else {
        this.seedValue = this.hashStringToSeed(this.inputSeed);
      }
      this.convertedInput = this.seedValue !== Number(this.inputSeed);

      if (this.seedValue === 0) this.setMode(this.choiceEnum.FIXED);
      else this.setMode(this.choiceEnum.PLAYER, this.seedValue);
    },
    setMode(mode, seed) {
      if (mode === this.choiceEnum.PLAYER && this.seedValue === 0) return;
      Speedrun.modifySeed(mode, parseInt(seed, 10));
    },
    buttonClass(mode) {
      return {
        "o-primary-btn--subtab-option": true,
        "o-selected": mode === this.mode,
      };
    },
    // String-to-number hashing function, using a fixed numerical seed inspired by Number.MAX_VALUE
    // See https://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript
    hashStringToSeed(str) {
      const seed = 17977308;
      let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
      for (let i = 0, ch; i < str.length; i++) {
        ch = str.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
      }
      h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
      h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
      return 4294967296 * (2097151 & h2) + (h1 >>> 0);
    }
  },
};
</script>

<template>
  <ModalWrapper>
    <template #header>
      Modifying Glyph RNG Seed
    </template>
    <div>
      {{ $t('ade.7230fff6da25bae8') }}
      <i>{{ $t('ade.948a434650d61b1d') }}</i> {{ $t('ade.82717a64aa168842') }}
      <br>
      <br>
      {{ $t('ade.9a999b51844e3e49') }}
      <br>
      {{ $t('ade.18b12c94dee3f488') }} <b>{{ $legacyText(_s(seedText)) }}</b>
      <br>
      <br>
      <PrimaryButton
        :class="buttonClass(choiceEnum.FIXED)"
        @click="setMode(choiceEnum.FIXED)"
      >
        {{ $t('ade.70c53ec6b77035bf') }}
      </PrimaryButton>
      <br>
      {{ $t('ade.bfae15a4549c77a6') }} <b>{{ $legacyText(_s(officialSeed)) }}</b>{{ $t('ade.f20c901e9dbdf856') }}
      <br>
      <br>
      <PrimaryButton
        :class="buttonClass(choiceEnum.RANDOM)"
        @click="setMode(choiceEnum.RANDOM)"
      >
        {{ $t('ade.ed867707b15ec2d0') }}
      </PrimaryButton>
      <br>
      {{ $t('ade.69eed6486dbf1355') }}
      <br>
      <br>
      <PrimaryButton
        v-tooltip="$legacyTooltip(seedValue === 0 ? 'Input seed cannot be zero!' : '')"
        :class="buttonClass(choiceEnum.PLAYER)"
        @click="setMode(choiceEnum.PLAYER, seedValue)"
      >
        {{ $t('ade.fe9e40d21b73a789') }}
      </PrimaryButton>
      <input
        ref="inputSeed"
        v-model="inputSeed"
        type="text"
        class="c-modal-input"
        @input="handleSeedInput()"
      >
      <br>
      {{ $t('ade.8f607aee519f4e66') }}
      <br>
      <span v-if="seedValue !== 0">
        Your current input will be {{ $legacyText(_s(convertedInput ? "converted to" : "used as")) }} the number <b>{{ $legacyText(_s(seedValue)) }}</b>.
      </span>
      <span v-else>
        Your current input {{ $legacyText(_s(convertedInput ? "converts to" : "is equal to")) }} <b>0</b>{{ $t('ade.bff67754fed9ef02') }}
      </span>
      <br>
      {{ $t('ade.2f7b9877aaecd55a') }}
    </div>
  </ModalWrapper>
</template>

<style scoped>
.o-selected {
  color: var(--color-text-inverted);
  background-color: var(--color-good);
}
</style>
