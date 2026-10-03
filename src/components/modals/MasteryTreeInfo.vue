<script>
export default {
  name: "MasteryTreeInfo",
  props: {
    headerText: {
      type: String,
      required: true,
    },
    treeStatus: {
      type: Object,
      required: true,
    },
  },
};
</script>

<template>
  <div class="c-tree-info">
    <span
      class="l-tree-info-header"
      v-html="$legacyHtml(headerText)"
    />
    <div
      v-if="treeStatus.firstPaths"
      class="l-modal-import-tree__tree-info-line"
    >
      {{ $t('ade.a38db29f4f0c2026', { p0: $legacyText(_s(treeStatus.firstPaths)) }) }}
    </div>
    <div
      v-if="treeStatus.secondPaths"
      class="l-modal-import-tree__tree-info-line"
    >
      {{ $t('ade.83683b2a71b5fb86', { p0: $legacyText(_s(treeStatus.secondPaths)) }) }}
    </div>
    <div
      v-if="treeStatus.thirdPaths"
      class="l-modal-import-tree__tree-info-line"
    >
      Entanglement Split: {{ $legacyText(_s(treeStatus.thirdPaths)) }}
    </div>
  </div>
</template>

<style scoped>
.l-tree-info-header {
  font-size: 1.7rem;
}

.c-tree-info {
  padding: 0.7rem;
}
</style>
