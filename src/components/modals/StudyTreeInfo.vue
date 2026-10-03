<script>
export default {
  name: "StudyTreeInfo",
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
      {{ $t('ade.e0cca9a716e1b03a', { p0: $legacyText(_s(treeStatus.firstPaths)) }) }}
    </div>
    <div
      v-if="treeStatus.secondPaths"
      class="l-modal-import-tree__tree-info-line"
    >
      {{ $t('ade.b9d3dab3a2a01260', { p0: $legacyText(_s(treeStatus.secondPaths)) }) }}
    </div>
    <div
      v-if="treeStatus.ec > 0"
      class="l-modal-import-tree__tree-info-line"
    >
      {{ $t('ade.3ada08c17da04014', { p0: $legacyText(_s(treeStatus.ec)), p1: $legacyText(_s(treeStatus.startEC?"(will start)":"")) }) }}
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
