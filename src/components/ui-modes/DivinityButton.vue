<script>
export default {
  name: "DivinityButton",
  data() {
    return {
      isModern: false,
      shouldDisplay: false
    };
  },
  methods: {
    update() {
      this.shouldDisplay = Pelle.isDoomed && player.antimatter.gte(DC.ENUMMAX);
      if (!this.shouldDisplay) return;
      this.isModern = player.options.newUI;
    },
    handleClick() {
      divinityReset();
    }
  }
};
</script>

<template>
  <span v-if="shouldDisplay">
    <div v-if="isModern">
      <h3 class="l-spacing">
        {{ $t('ade.494d0322f5c8f915') }}
      </h3>
      <button
        :class="{
          'btn-divinity': true
        }"
        @click="handleClick"
      >
        {{ $t('ade.dff42fbc36bbaba0') }}
      </button>
    </div>
    <div v-else>
      <button
        :class="{
          'o-tab-btn': true,
          'o-divinity-btn': true,
          'l-old-ui__divinity-btn': true
        }"
        @click="handleClick"
      >
        {{ $t('ade.dff42fbc36bbaba0') }}
      </button>
      <div class="o-emptiness">
        {{ $t('ade.494d0322f5c8f915') }}
      </div>
    </div>
  </span>
</template>

<style scoped>
.l-spacing {
  margin-top: 1rem;
}
</style>
