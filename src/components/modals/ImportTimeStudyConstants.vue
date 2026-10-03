<script>
import ModalWrapperChoice from "@/components/modals/ModalWrapperChoice";

export default {
  name: "ImportTimeStudyConstants",
  components: {
    ModalWrapperChoice
  },
  data() {
    return {
      constantNames: [],
      willImport: [],
    };
  },
  computed: {
    presets: () => player.timestudy.presets.filter(p => p.studies !== ""),
    names() {
      // Study presets can contain non-alphanumeric characters, which aren't allowed in constants,
      // so we replace all of those with underscores. This alone can however result in duplicate names due
      // to multiple different characters being mapped to underscores, so we also include the preset index
      return this.presets.map((p, index) => `TSPreset${index + 1}__${p.name.replaceAll(/[^a-zA-Z_0-9]/gu, "_")}`);
    }
  },
  methods: {
    update() {
      this.constantNames = [...player.reality.automator.constantSortOrder];
      this.updateImportStatus();
    },
    importConstants() {
      for (let index = 0; index < this.presets.length; index++) {
        AutomatorBackend.modifyConstant(this.names[index], this.presets[index].studies);
      }
    },
    hasConflict(constantName) {
      return this.constantNames.includes(constantName);
    },
    updateImportStatus() {
      let availableSlots = AutomatorData.MAX_ALLOWED_CONSTANT_COUNT - this.constantNames.length;
      this.willImport = [];
      for (let index = 0; index < this.names.length; index++) {
        if (this.hasConflict(this.names[index])) {
          this.willImport.push(true);
        } else if (availableSlots > 0) {
          this.willImport.push(true);
          availableSlots--;
        } else this.willImport.push(false);
      }
    },
    missedImports() {
      return this.willImport.countWhere(x => !x);
    },
    // Shorten the string to less than 55 characters for UI purposes - but we shorten the middle since the
    // beginning and end are both potentially useful to see
    shortenString(str) {
      if (str.length < 55) return str;
      return `${str.substring(0, 12)}...${str.substring(str.length - 40, str.length)}`;
    }
  }
};
</script>

<template>
  <ModalWrapperChoice
    @confirm="importConstants"
  >
    <template #header>
      Importing Time Study Presets as Constants
    </template>
    <div class="c-modal-message__text">
      {{ $t('ade.8935baf817b810bd') }}
      <br>
      <br>
      <div
        v-for="i in presets.length"
        :key="i"
        :class="{ 'l-not-imported' : !willImport[i-1] }"
      >
        <LocalizedText id="ade.e19e72e7d18c3f6b">
          <template #p0>{{ $legacyText(_s(presets[i-1].name)) }}</template>
          <template #p1><b>{{ $legacyText(_s(names[i-1])) }}</b></template>
          <template #p2><br></template>
          <template #p3>{{ $legacyText(_s(shortenString(presets[i-1].studies))) }}</template>
          <template #p4><span
          v-if="hasConflict(names[i-1])"
          class="l-warn-text"
        >
          <br>
          {{ $t('ade.62b932c8235c388b') }}
        </span></template>
          <template #p5><br></template>
          <template #p6><br></template>
        </LocalizedText>
      </div>
      <div
        v-if="missedImports() > 0"
        class="l-warn-text"
      >
        {{ $t('ade.00898e0a7d252faf', { p0: $legacyText(_s(quantify("preset",missedImports()))) }) }}
      </div>
    </div>
    <template #confirm-text>
      Import All
    </template>
  </ModalWrapperChoice>
</template>

<style scoped>
.l-warn-text {
  font-weight: bold;
  color: var(--color-bad);
}

.l-not-imported {
  color: var(--color-disabled);
}
</style>
