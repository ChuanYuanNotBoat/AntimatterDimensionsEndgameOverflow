<script>
export default {
  name: "NewGame",
  data() {
    return {
      opacity: 0,
      visible: false,
      hasMoreCosmetics: false,
      selectedSetName: "",
    };
  },
  computed: {
    style() {
      return {
        opacity: this.opacity,
        visibility: this.visible ? "visible" : "hidden",
      };
    }
  },
  methods: {
    update() {
      this.visible = GameEnd.endState > END_STATE_MARKERS.SHOW_NEW_GAME && !GameEnd.removeAdditionalEnd;
      this.opacity = (GameEnd.endState - END_STATE_MARKERS.SHOW_NEW_GAME) * 2;
      this.hasMoreCosmetics = GlyphAppearanceHandler.lockedSets.length > 0;
      this.selectedSetName = GlyphAppearanceHandler.chosenFromModal?.name ?? "None (will choose randomly)";
    },
    startNewGame() {
      Endgame.newEndgame();
    },
    openSelectionModal() {
      Modal.cosmeticSetChoice.show();
    }
  }
};
</script>

<template>
  <div
    class="c-new-game-container"
    :style="style"
  >
    <h2>
      {{ $t('ade.9793601bd3733d7e') }}
    </h2>
    <h3>{{ $t('ade.a5f7805c4d05ada0') }}</h3>
    <div class="c-new-game-button-container">
      <button
        class="c-new-game-button"
        @click="startNewGame"
      >
        {{ $t('ade.a6a341e1bc7b1ff2') }}
      </button>
    </div>
    <br>
    <h3 v-if="hasMoreCosmetics">
      {{ $t('ade.abb5f5be4b7cb277') }}
      <br>
      <button
        class="c-new-game-button"
        @click="openSelectionModal"
      >
        {{ $t('ade.b111fcb50875c678') }}
      </button>
      <br>
      <br>
      {{ $t('ade.57303db4d991dfba', { p0: $legacyText(_s(selectedSetName)) }) }}
    </h3>
    <h3 v-else>
      {{ $t('ade.4978ea0c1597aa85') }}
    </h3>
    <br>
    <h3>
      {{ $t('ade.0a8056895a9c3884') }}
    </h3>
  </div>
</template>

<style scoped>
.c-new-game-container {
  display: flex;
  flex-direction: column;
  position: absolute;
  top: 50%;
  left: 50%;
  z-index: 9;
  justify-content: center;
  align-items: center;
  transform: translate(-50%, -50%);
  pointer-events: auto;
}

.t-s12 .c-new-game-container {
  color: white;
}

.c-new-game-button-container {
  display: flex;
  flex-direction: column;
  align-items: stretch;
}

.c-new-game-button {
  font-family: Typewriter;
  background: grey;
  border: black;
  border-radius: var(--var-border-radius, 0.5rem);
  margin-top: 1rem;
  padding: 1rem;
  cursor: pointer;
}
</style>
