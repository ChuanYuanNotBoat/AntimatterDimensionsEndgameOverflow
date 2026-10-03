<script>
import CelestialQuoteHistory from "@/components/CelestialQuoteHistory";

export default {
  name: "AlphaTab",
  components: {
    CelestialQuoteHistory,
  },
  data() {
    return {
      stage: 0,
      quote: "",
      isRunning: false,
      isDestroyed: false
    };
  },
  computed: {
    symbol() {
      return Alpha.symbol;
    },
    layers() {
      return AlphaDescriptions.layerRow;
    },
    nerfs() {
      return AlphaDescriptions.nerfRow;
    },
    buffs() {
      return AlphaDescriptions.buffRow;
    },
    runButtonOuterClass() {
      return {
        "l-alpha-run-button": true,
        "c-alpha-run-button": true,
        "c-alpha-run-button--running": this.isRunning,
        "c-alpha-run-button--not-running": !this.isRunning && !this.isDestroyed,
        "c-alpha-run-button--not-running--dead": this.isDestroyed,
        "c-celestial-run-button--clickable": !this.isDoomed && !this.isDestroyed,
        "o-pelle-disabled-pointer": this.isDoomed || this.isDestroyed
      };
    },
    runButtonInnerClass() {
      return this.isRunning ? "c-alpha-run-button__inner--running" : "c-alpha-run-button__inner--not-running";
    },
    runDescription() {
      return `${GameDatabase.celestials.descriptions[7].effects()}\n
      ${GameDatabase.celestials.descriptions[7].description()}`;
    },
    isDoomed: () => Pelle.isDoomed,
  },
  watch: {
    isRunning() {
      this.$recompute("runDescription");
    }
  },
  methods: {
    update() {
      this.stage = Alpha.currentStage;
      this.quote = Alpha.quote;
      this.isRunning = Alpha.isRunning;
      this.isDestroyed = Alpha.isDestroyedForDisplay;
    },
    startRun() {
      if (this.isDoomed) return;
      Modal.celestials.show({ name: "Alpha's", number: 7 });
    }
  }
};
</script>

<template>
  <div class="l-alpha-celestial-tab">
    <CelestialQuoteHistory celestial="alpha" />
    <br>
    <div>
      <span class="l-alpha-text">
        {{ $t('ade.1109d491724da278', { p0: $legacyText(_s(formatPercents(0.33))) }) }}
      </span>
    </div>
    <div class="l-alpha-unlocks-and-run">
      <div class="l-alpha-unlocks">
        <div>
          <span class="l-alpha-header">
            {{ $t('ade.9b241e8cf6e9837e') }}
          </span>
          <p
            v-for="(layer, idx) in layers"
            :key="idx"
          >
            {{ $legacyText(_s(layer)) }}
          </p>
        </div>
        <div>
          <span class="l-alpha-header">
            {{ $t('ade.ceeca85f62c7a930') }}
          </span>
          <p
            v-for="(nerf, idy) in nerfs"
            :key="idy"
          >
            {{ $legacyText(_s(nerf)) }}
          </p>
        </div>
        <div>
          <span class="l-alpha-header">
            {{ $t('ade.2ec480e8a1ddbc9a') }}
          </span>
          <p
            v-for="(buff, idz) in buffs"
            :key="idz"
          >
            {{ $legacyText(_s(buff)) }}
          </p>
        </div>
      </div>
      <div class="l-alpha-run">
        <div class="c-alpha-run-description">
          <span :class="{ 'o-pelle-disabled': isDoomed || isDestroyed }">
            {{ $t('ade.16f9ee73ef7ffc70') }}
          </span>
        </div>
        <div
          :class="runButtonOuterClass"
          @click="startRun"
        >
          <div
            :class="runButtonInnerClass"
            :button-symbol="symbol"
          >
            {{ $legacyText(_s(symbol)) }}
          </div>
        </div>
        <div class="c-alpha-run-description">
          {{ $legacyText(_s(runDescription)) }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.l-alpha-celestial-tab {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.l-alpha-unlocks-and-run {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
}

.l-alpha-unlocks {
  width: 50rem;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  border: var(--var-border-width, 0.2rem) solid var(--color-alpha--base);
  border-radius: var(--var-border-radius, 0.5rem);
  margin: 1rem;
  padding: 1rem;
}

p {
  font-size: 1.2rem;
  color: var(--color-alpha--base);
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16rem;
  height: 10rem;
}

.l-alpha-header {
  font-size: 3rem;
  font-weight: bold;
  color: var(--color-alpha--base);
}

.l-alpha-text {
  font-size: 1rem;
  color: var(--color-alpha--base);
}
</style>
