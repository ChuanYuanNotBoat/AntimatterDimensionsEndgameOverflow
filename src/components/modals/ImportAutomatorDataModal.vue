<script>
import { hasCompilationErrors } from "@/core/automator";

import ModalWrapperChoice from "@/components/modals/ModalWrapperChoice";

export default {
  name: "ImportAutomatorDataModal",
  components: {
    ModalWrapperChoice,
  },
  data() {
    return {
      input: "",
      isValid: false,
      hasExtraData: false,
      scriptName: "",
      lineCount: 0,
      scriptContent: "",
      hasErrors: false,
      importedPresets: [],
      importedConstants: [],
      ignorePresets: false,
      ignoreConstants: false,
    };
  },
  computed: {
    hasPresets() {
      return (this.importedPresets?.length ?? 0) !== 0;
    },
    hasConstants() {
      return (this.importedConstants?.length ?? 0) !== 0;
    },
    isImportingExtraData() {
      // These two checks differ because we suppress the preset import warning when importing into an empty
      // slot, but we use this prop for information on importing rather than overwriting
      const hasNewConstants = this.willOverwriteConstant || this.constantCountAfterImport > this.currentConstants;
      const isImportingPresets = this.importedPresets ? !this.ignorePresets : false;
      const isImportingConstants = this.importedConstants
        ? !this.ignoreConstants && hasNewConstants
        : false;
      return this.isValid && this.hasExtraData && (isImportingPresets || isImportingConstants);
    },
    currentPresets: () => player.timestudy.presets,
    currentConstants: () => Object.keys(player.reality.automator.constants),
    maxConstantCount() {
      return AutomatorData.MAX_ALLOWED_CONSTANT_COUNT;
    },
    // Number of studies with different contents which will be overwritten
    overwrittenPresetCount() {
      let mismatchedPresets = 0;
      for (const toImport of this.importedPresets) {
        const existingPreset = this.currentPresets[toImport.id];
        const isEmpty = existingPreset.name === "" && existingPreset.studies === "";
        if (!isEmpty && (existingPreset.name !== toImport.name || existingPreset.studies !== toImport.studies)) {
          mismatchedPresets++;
        }
      }
      return mismatchedPresets;
    },
    willOverwriteConstant() {
      if (!this.hasExtraData) return false;
      const all = new Set();
      for (const constant of this.currentConstants) all.add(constant);
      for (const constant of this.importedConstants) {
        if (all.has(constant.key) && player.reality.automator.constants[constant.key] !== constant.value) return true;
      }
      return false;
    },
    constantCountAfterImport() {
      if (!this.hasExtraData) return this.currentConstants.length;
      const all = new Set();
      for (const constant of this.currentConstants) all.add(constant);
      for (const constant of this.importedConstants) all.add(constant.key);
      return all.size;
    },
    extraConstants() {
      return this.constantCountAfterImport - this.maxConstantCount;
    },
    presetButtonText() {
      return this.ignorePresets ? "Will Ignore Presets" : "Will Import Presets";
    },
    constantButtonText() {
      return this.ignoreConstants ? "Will Ignore Constants" : "Will Import Constants";
    }
  },
  mounted() {
    this.$refs.input.select();
  },
  methods: {
    update() {
      // We need to sequentially parse full data and then single script data in order to handle both in the same modal.
      // Parsing order doesn't matter due to the fact that export formatting means it's only ever one or the other.
      let parsed = AutomatorBackend.parseFullScriptData(this.input);
      if (parsed) this.hasExtraData = true;
      else {
        parsed = AutomatorBackend.parseScriptContents(this.input);
        this.hasExtraData = false;
      }
      if (!parsed) {
        this.isValid = false;
        return;
      }

      // Some of these may be undefined for single script importing (ie. no additional data attached) or for scripts
      // with errors. These cases are checked elsewhere
      this.scriptName = parsed.name;
      this.scriptContent = parsed.content;
      this.importedPresets = parsed.presets;
      this.importedConstants = parsed.constants;
      this.lineCount = this.scriptContent.split("\n").length;
      this.hasErrors = hasCompilationErrors(this.scriptContent);
      this.isValid = true;
    },
    importSave() {
      if (!this.isValid) return;
      if (this.hasExtraData) {
        AutomatorBackend.importFullScriptData(this.input, {
          presets: this.ignorePresets,
          constants: this.ignoreConstants
        });
      } else {
        AutomatorBackend.importScriptContents(this.input);
      }
      this.emitClose();
    },
  },
};
</script>

<template>
  <ModalWrapperChoice
    :show-cancel="!isValid"
    :show-confirm="isValid"
    @confirm="importSave"
  >
    <template #header>
      Import Automator Script Data
    </template>
    {{ $t('ade.6a866091b17c5430') }}
    <span v-if="isImportingExtraData">{{ $t('ade.48d3602872ee07df') }}</span>
    <input
      ref="input"
      v-model="input"
      type="text"
      class="c-modal-input c-modal-import__input"
      @keyup.enter="importSave"
      @keyup.esc="emitClose"
    >
    <div v-if="isValid">
      {{ $t('ade.59ff1122f104872c', { p0: _s(scriptName) }) }}
      <br>
      {{ $t('ade.7e5e313a46128d55', { p0: $legacyText(_s(lineCount)) }) }}
      <div v-if="hasPresets">
        <br>
        Study Presets:
        <span
          v-for="(preset, id) in importedPresets"
          :key="id"
          class="c-import-data-name"
        >
          <span v-if="preset.name">{{ $t('ade.7015703be905cda2', { p0: $legacyText(_s(preset.name)), p1: $legacyText(_s(preset.id+1)) }) }}</span>
          <span v-else>{{ $t('ade.8a27d80fd0dc12a6', { p0: $legacyText(_s(preset.id+1)) }) }}</span>
        </span>
        <div
          v-if="!ignorePresets && overwrittenPresetCount > 0"
          class="l-has-errors"
        >
          {{ $t('ade.acc3e4cd8297e089', { p0: $legacyText(_s(formatInt(overwrittenPresetCount))) }) }}
        </div>
        <br>
        <button
          class="o-primary-btn"
          @click="ignorePresets = !ignorePresets"
        >
          {{ $legacyText(_s(presetButtonText)) }}
        </button>
      </div>
      <div v-if="hasConstants">
        <br>
        {{ $t('ade.41572b6194f9a179') }}
        <span
          v-for="(constant, id) in importedConstants"
          :key="id + 10"
          class="c-import-data-name"
        >
          "{{ $legacyText(_s(constant.key)) }}"
        </span>
        <div
          v-if="!ignoreConstants && (willOverwriteConstant || extraConstants > 0)"
          class="l-has-errors"
        >
          <span v-if="willOverwriteConstant">{{ $t('ade.4cb291e0a4cd492b') }}</span>
          <br v-if="willOverwriteConstant && extraConstants > 0">
          <span v-if="extraConstants > 0">
            {{ $t('ade.55e5593e29475500', { p0: $legacyText(_s(quantifyInt("constant",extraConstants))), p1: $legacyText(_s(maxConstantCount)) }) }}
          </span>
        </div>
        <br>
        <button
          class="o-primary-btn"
          @click="ignoreConstants = !ignoreConstants"
        >
          {{ $legacyText(_s(constantButtonText)) }}
        </button>
      </div>
      <br>
      <div
        v-if="hasErrors"
        class="l-has-errors"
      >
        {{ $t('ade.6d83fbfec0fffd2d') }}
      </div>
      <div v-if="hasErrors && isImportingExtraData">
        <i>{{ $t('ade.0aeaddc6becacbd3') }}</i>
      </div>
    </div>
    <div v-else-if="input.length !== 0">
      {{ $t('ade.b609825c10dabd7e') }}
    </div>
    <template #confirm-text>
      Import
    </template>
  </ModalWrapperChoice>
</template>

<style scoped>
.l-has-errors {
  color: red;
}

.c-import-data-name {
  padding: 0 1rem;
}
</style>
