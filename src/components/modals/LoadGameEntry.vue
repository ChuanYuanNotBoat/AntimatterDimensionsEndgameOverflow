<script>
import PrimaryButton from "@/components/PrimaryButton";

export default {
  name: "LoadGameEntry",
  components: {
    PrimaryButton
  },
  props: {
    saveId: {
      type: Number,
      required: true
    }
  },
  data() {
    const save = GameStorage.saves[this.saveId];
    return {
      antimatter: new Decimal(save ? save.antimatter || save.money : 10),
      fileName: save ? save.options.saveFileName : ""
    };
  },
  computed: {
    isSelected() {
      return GameStorage.currentSlot === this.saveId;
    }
  },
  methods: {
    load() {
      GameStorage.loadSlot(this.saveId);
    },
    formatAntimatter(antimatter) {
      return formatPostBreak(antimatter, 2, 1);
    },
    update() {
      if (this.isSelected) {
        this.antimatter.copyFrom(Currency.antimatter);
      }
    }
  },
};
</script>

<template>
  <div class="l-modal-options__save-record">
    <h3><LocalizedText id="ade.9aee3e2d945f1176">
    <template #p0>{{ $legacyText(_s(saveId+1)) }}</template>
    <template #p1><span v-if="isSelected"> {{ $t('ade.fbe8d7079206e46c') }}</span></template>
  </LocalizedText></h3>
    <span v-if="fileName">{{ $t('ade.84335e99a3158864', { p0: _s(fileName) }) }}</span>
    <span>{{ $t('ade.14d4b4ec75ed3e1b', { p0: $legacyText(_s(formatAntimatter(antimatter))) }) }}</span>
    <PrimaryButton
      class="o-primary-btn--width-medium"
      @click="load"
    >
      {{ $t('ade.860e35d0e1f97b24') }}
    </PrimaryButton>
  </div>
</template>
