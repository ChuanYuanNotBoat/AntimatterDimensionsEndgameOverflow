<script>
export default {
  name: "OpenModalHotkeysButton",
  methods: {
    handleClick() {
      Modal.hotkeys.show();
    }
  }
};
</script>

<template>
  <p
    class="c-options-tab__hotkeys-link"
    @click="handleClick"
  >
    <LocalizedText id="ade.7538dd38119713c0">
      <template #p0><kbd>?</kbd></template>
    </LocalizedText>
  </p>
</template>
