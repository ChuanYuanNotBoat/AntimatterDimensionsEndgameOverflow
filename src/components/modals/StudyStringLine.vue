<script>
export default {
  name: "StudyStringLine",
  props: {
    tree: {
      type: Object,
      required: true,
    },
    intoEmpty: {
      type: Boolean,
      required: true,
    }
  },
  computed: {
    importDestString() {
      return this.intoEmpty ? "into an empty Tree" : "with your current Tree";
    }
  },
  methods: {
    formatTheoremCost(tt, st) {
      const strTT = `${formatWithCommas(tt)} TT`;
      const strST = `${formatWithCommas(st)} ST`;
      return st === 0 ? strTT : `${strTT} + ${strST}`;
    }
  },
};
</script>

<template>
  <div class="l-modal-import-tree__tree-info-line">
    <div v-if="tree.timeTheorems === 0 && tree.spaceTheorems === 0">
      <i>{{ $t('ade.6968b52dd3d82aa8', { p0: $legacyText(_s(importDestString)) }) }}</i>
    </div>
    <div v-else>
      <LocalizedText id="ade.8a980e575b786860">
        <template #p0>{{ $legacyText(_s(importDestString)) }}</template>
        <template #p1><br></template>
        <template #p2>{{ $legacyText(_s(tree.newStudies)) }}</template>
        <template #p3>{{ $legacyText(_s(formatTheoremCost(tree.timeTheorems,tree.spaceTheorems))) }}</template>
      </LocalizedText>
    </div>
    <br>
  </div>
</template>
