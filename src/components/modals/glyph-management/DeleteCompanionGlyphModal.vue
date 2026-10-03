<script>
import PrimaryButton from "@/components/PrimaryButton";

export default {
  name: "DeleteCompanionGlyphModal",
  components: {
    PrimaryButton
  },
  data() {
    return {
      messageIndex: 0,
    };
  },
  computed: {
    message() {
      switch (this.messageIndex) {
        case 0: return "Are you sure you want to get rid of your Companion Glyph?";
        case 1: return "You will not receive any cake.";
        case 2: return "This is permanent! You will not get another Companion Glyph!";
        case 3: return `You deleted your faithful Companion Glyph more quickly than any
                        other test subject on record. Congratulations.`;
        default: return "Invalid message index";
      }
    }
  },
  methods: {
    handleLeftButtonClick() {
      if (this.messageIndex < 2) {
        this.handleYesClick();
      } else {
        this.handleNoClick();
      }
    },
    handleRightButtonClick() {
      if (this.messageIndex >= 2) {
        this.handleYesClick();
      } else {
        this.handleNoClick();
      }
    },
    handleYesClick() {
      this.messageIndex++;
      if (this.messageIndex === 3) this.deleteCompanion();
    },
    handleNoClick() {
      this.messageIndex = 0;
      this.emitClose();
    },
    deleteCompanion() {
      // Yes, this actually deletes a companion glyph at random, but the player can only ever legitimately have one.
      // Passing information into modals seems to require a bunch of refactoring that's not worth it for this one case.
      const toDelete = player.reality.glyphs.inventory.filter(g => g.type === "companion")[0];
      Glyphs.removeFromInventory(toDelete);
    }
  },
};
</script>

<template>
  <div class="c-modal-message l-modal-content--centered">
    <div class="c-modal-message__text">
      {{ $legacyText(_s(message)) }}
    </div>
    <div v-if="messageIndex < 3">
      <PrimaryButton
        class="o-primary-btn--width-medium c-modal-message__okay-btn"
        @click="handleLeftButtonClick"
      >
        {{ $legacyText(_s(messageIndex < 2 ? "Delete" : "Cancel")) }}
      </PrimaryButton>
      <PrimaryButton
        class="o-primary-btn--width-medium c-modal-message__okay-btn"
        @click="handleRightButtonClick"
      >
        {{ $legacyText(_s(messageIndex >= 2 ? "Delete" : "Cancel")) }}
      </PrimaryButton>
    </div>
    <div v-else>
      <PrimaryButton
        class="o-primary-btn--width-medium c-modal-message__okay-btn"
        @click="handleNoClick"
      >
        {{ $t('ade.d2dff8b191caaa8d') }}
      </PrimaryButton>
    </div>
  </div>
</template>
