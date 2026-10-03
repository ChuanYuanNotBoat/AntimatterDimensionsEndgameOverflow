<script>
export default {
  name: "AutomatorDataTransferSingleEntry",
  props: {
    script: {
      type: Object,
      required: true,
    }
  },
  data() {
    return {
      presets: [],
      constants: [],
      hidePresets: true,
      hideConstants: true,
    };
  },
  computed: {
    presetData: () => player.timestudy.presets,
    constantData: () => player.reality.automator.constants,
    hasPresets() {
      return (this.presets?.length ?? 0) !== 0;
    },
    hasConstants() {
      return (this.constants?.length ?? 0) !== 0;
    },
  },
  methods: {
    update() {
      this.presets = AutomatorBackend.getUsedPresets(this.script.id);
      this.constants = AutomatorBackend.getUsedConstants(this.script.id);
    },
    iconClass(state) {
      return state ? "far fa-plus-square" : "far fa-minus-square";
    },
    exportData(id) {
      const toExport = AutomatorBackend.exportFullScriptData(id);
      if (toExport) {
        copyToClipboard(toExport);
        GameUI.notify.automator(`Exported all data associated with "${this.script.name}" to your clipboard`, 6000);
      } else {
        GameUI.notify.error("Could not export data from blank Automator script!");
      }
    }
  }
};
</script>

<template>
  <div class="l-entry-padding">
    <button
      v-tooltip="$legacyTooltip('Export Full Script Data')"
      class="l-button-margin fas fa-file-export"
      @click="exportData(script.id)"
    />
    <b>{{ $t('ade.59ff1122f104872c', { p0: _s(script.name) }) }}</b>
    <br>
    <span v-if="hasPresets">
      <span
        :class="iconClass(hidePresets)"
        @click="hidePresets = !hidePresets"
      />
      {{ $t('ade.d900706fc8193f1d', { p0: $legacyText(_s(quantifyInt("recognized study preset",presets.length))) }) }}
      <span v-if="!hidePresets">
        <div
          v-for="id in presets"
          :key="id"
        >
          <span v-if="presetData[id].name">{{ $t('ade.1d7a50f8cea51aba', { p0: $legacyText(_s(presetData[id].name)), p1: $legacyText(_s(id+1)) }) }}</span>
          <span v-else>{{ $t('ade.f2e1ead874505141', { p0: $legacyText(_s(id+1)) }) }}</span>
          <br>
          <div class="l-value-padding">
            <span v-if="presetData[id].studies">{{ $legacyText(_s(presetData[id].studies)) }}</span>
            <i v-else>{{ $t('ade.503e55bc4d637db7') }}</i>
          </div>
        </div>
      </span>
    </span>
    <span v-else>
      {{ $t('ade.d710eef22c0e2e6d') }}
    </span>
    <br>
    <span v-if="hasConstants">
      <span
        :class="iconClass(hideConstants)"
        @click="hideConstants = !hideConstants"
      />
      {{ $t('ade.d900706fc8193f1d', { p0: $legacyText(_s(quantifyInt("defined constant",constants.length))) }) }}
      <span v-if="!hideConstants">
        <div
          v-for="name in constants"
          :key="name"
        >
          "{{ $legacyText(_s(name)) }}":
          <br>
          <div class="l-value-padding">
            {{ $legacyText(_s(constantData[name])) }}
          </div>
        </div>
      </span>
    </span>
    <span v-else>
      {{ $t('ade.187e0f359865d651') }}
    </span>
  </div>
</template>

<style scoped>
.l-entry-padding {
  border: solid 0.1rem var(--color-automator-docs-font);
  border-radius: var(--var-border-radius, 0.5rem);
  overflow-wrap: break-word;
  padding: 1rem 1.5rem;
}

.l-value-padding {
  padding-left: 1.5rem;
}

.l-button-margin {
  margin-right: 1rem;
}
</style>
