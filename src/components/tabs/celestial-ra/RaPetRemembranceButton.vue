<script>
export default {
  name: "RaPetRemembranceButton",
  props: {
    petConfig: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      isUnlocked: false,
      hasRemembrance: false,
    };
  },
  computed: {
    pet() {
      return this.petConfig.pet;
    },
    name() {
      return this.pet.name;
    },
    petStyle() {
      return {
        backgroundColor: this.hasRemembrance ? this.pet.color : "#555",
        "box-shadow": this.hasRemembrance ? "0.1rem 0.1rem 0.1rem rgba(0, 0, 0, 0.7)" : "",
        "border-color": this.hasRemembrance ? "black" : ""
      };
    }
  },
  methods: {
    update() {
      const pet = this.pet;
      this.isUnlocked = pet.isUnlocked;
      if (!this.isUnlocked) return;
      this.hasRemembrance = pet.hasRemembrance;
    },
    toggleRemembrance() {
      Ra.petWithRemembrance = Ra.petWithRemembrance === this.pet.name ? "" : this.pet.name;
    }
  },
};
</script>

<template>
  <button
    v-if="isUnlocked"
    class="c-ra-pet-remembrance-button"
    :style="petStyle"
    @click="toggleRemembrance"
  >
    <span v-if="hasRemembrance">
      {{ $t('ade.afc0e53dda54b85c', { p0: $legacyText(_s(name)) }) }}
    </span>
    <span v-else>
      {{ $t('ade.d45a5c49184d8740', { p0: $legacyText(_s(name)) }) }}
    </span>
  </button>
</template>
