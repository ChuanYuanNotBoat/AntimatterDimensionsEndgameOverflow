<script>
import PrimaryButton from "@/components/PrimaryButton";
import PrimaryToggleButton from "@/components/PrimaryToggleButton";

export default {
  name: "AutobuyerToggles",
  components: {
    PrimaryButton,
    PrimaryToggleButton
  },
  data() {
    return {
      isDoomed: false,
      autobuyersOn: false,
      showContinuum: false,
      disableContinuum: false,
      allAutobuyersDisabled: false,
      antimatterAutobuyersBuyMax: false,
      isFlipped: false
    };
  },
  watch: {
    autobuyersOn(newValue) {
      player.auto.autobuyersOn = newValue;
    },
    disableContinuum(newValue) {
      if (ImaginaryUpgrade(21).isLockingMechanics && !newValue) {
        ImaginaryUpgrade(21).tryShowWarningModal();
        return;
      }
      if (DualityUpgrade(21).isLockingMechanics && !newValue) {
        DualityUpgrade(21).tryShowWarningModal();
        return;
      }
      Laitela.setContinuum(!newValue);
    }
  },
  methods: {
    update() {
      this.isDoomed = Pelle.isDoomed;
      this.autobuyersOn = player.auto.autobuyersOn;
      this.showContinuum = Laitela.isUnlocked;
      this.disableContinuum = player.auto.disableContinuum;
      this.allAutobuyersDisabled = Autobuyers.unlocked.every(autobuyer => !autobuyer.isActive);
      this.antimatterAutobuyersBuyMax = Autobuyer.antimatterDimension.zeroIndexed.every(
        autobuyer => autobuyer.mode === AUTOBUYER_MODE.BUY_10
      );
      this.isFlipped = player.universes.current === 2;
    },
    toggleAllAutobuyers() {
      for (const autobuyer of Autobuyers.unlocked) {
        autobuyer.isActive = this.allAutobuyersDisabled;
      }
    },
    toggleAntimatterSingles() {
      for (const autobuyer of Autobuyer.antimatterDimension.zeroIndexed) {
        autobuyer.mode = this.antimatterAutobuyersBuyMax ? AUTOBUYER_MODE.BUY_SINGLE : AUTOBUYER_MODE.BUY_10;
      }
    }
  },
};
</script>

<template>
  <div class="c-subtab-option-container">
    <PrimaryToggleButton
      v-model="autobuyersOn"
      :on="$t('ade.786beb0e00462a6c')"
      :off="$t('ade.a3aa6880f4dbac76')"
      class="o-primary-btn--subtab-option"
    />
    <PrimaryButton
      class="o-primary-btn--subtab-option"
      @click="toggleAllAutobuyers()"
    >
      {{ $t('ade.f813e49e9d5c7a29', { p0: $legacyText(_s(allAutobuyersDisabled?"Enable":"Disable")) }) }}
    </PrimaryButton>
    <PrimaryButton
      class="o-primary-btn--subtab-option"
      @click="toggleAntimatterSingles()"
    >
      {{ $t('autobuyers.setDimensionMode', {
        dimension: isFlipped ? 'matter' : 'antimatter',
        mode: antimatterAutobuyersBuyMax ? 'singles' : 'max'
      }) }}
    </PrimaryButton>
    <span v-if="false">
      <PrimaryButton
        v-if="showContinuum"
        class="o-primary-btn--subtab-option"
      >
        {{ $t('ade.53815c2d338ef352') }}
      </PrimaryButton>
    </span>
    <span v-else>
      <PrimaryToggleButton
        v-if="showContinuum"
        v-model="disableContinuum"
        :on="$t('ade.eb24b792fa9a367f')"
        :off="$t('ade.a164cf8d1f4fdbb5')"
        class="o-primary-btn--subtab-option"
      />
    </span>
  </div>
</template>

<style scoped>

</style>
