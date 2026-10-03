<script>
import HiddenTabGroup from "@/components/modals/options/hidden-tabs/HiddenTabGroup";
import ModalWrapperOptions from "@/components/modals/options/ModalWrapperOptions";
import PrimaryButton from "@/components/PrimaryButton";

export default {
  name: "HiddenTabsModal",
  components: {
    HiddenTabGroup,
    ModalWrapperOptions,
    PrimaryButton,
  },
  data() {
    return {
      isEnslaved: false,
      isAlmostEnd: false,
    };
  },
  computed: {
    tabs: () => Tabs.currentUIFormat,
  },
  methods: {
    update() {
      this.isEnslaved = Enslaved.isRunning;
      this.isAlmostEnd = Pelle.hasGalaxyGenerator;
    },
    showAllTabs() {
      for (const tab of this.tabs) {
        tab.unhideTab();
        for (const subtab of tab.subtabs)
          subtab.unhideTab();
      }
    }
  },
};
</script>

<template>
  <ModalWrapperOptions class="l-wrapper">
    <template #header>
      Modify Visible Tabs
    </template>
    <div class="c-modal--short">
      {{ $t('ade.2153515cc6e7138b') }}
      <br>
      {{ $t('ade.07faf31eaa6ae2bc') }}
      <br>
      {{ $t('ade.eb39badf88e7318c') }}
      <br>
      <div v-if="isAlmostEnd">
        {{ $t('ade.23799e403eb90775') }}
      </div>
      <div v-if="isEnslaved">
        <LocalizedText id="ade.ed879b2d650a4a41">
    <template #p0><br></template>
    <template #p1><i>{{ $t('ade.b83bed7a444e7dbb') }}</i></template>
    <template #p2><br></template>
  </LocalizedText>
      </div>
      <PrimaryButton
        @click="showAllTabs"
      >
        {{ $t('ade.b36f4a79e2284a69') }}
      </PrimaryButton>
      <HiddenTabGroup
        v-for="(tab, index) in tabs"
        :key="index"
        :tab="tab"
        :change-enabled="!isEnslaved && !isAlmostEnd"
        class="l-hide-modal-tab-container"
      />
    </div>
  </ModalWrapperOptions>
</template>

<style scoped>
.l-wrapper {
  width: 62rem;
}

.t-s12 .l-wrapper {
  width: 65rem;
}
</style>