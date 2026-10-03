<script>
export default {
  name: "MasteryStringLine",
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
    formatSkillCost(es) {
      const strES = `${formatWithCommas(es)} ES`;
      return strES;
    }
  },
};
</script>

<template>
  <div class="l-modal-import-tree__tree-info-line">
    <div v-if="tree.endgameSkills === 0">
      <i>{{ $t('ade.125a7f57930a32bd', { p0: $legacyText(_s(importDestString)) }) }}</i>
    </div>
    <div v-else>
      <LocalizedText id="ade.585e92526268f173">
        <template #p0>{{ $legacyText(_s(importDestString)) }}</template>
        <template #p1><br></template>
        <template #p2>{{ $legacyText(_s(tree.newMasteries)) }}</template>
        <template #p3>{{ $legacyText(_s(formatSkillCost(tree.endgameMasteries))) }}</template>
      </LocalizedText>
    </div>
    <br>
  </div>
</template>
