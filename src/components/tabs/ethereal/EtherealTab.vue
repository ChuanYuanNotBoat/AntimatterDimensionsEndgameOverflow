<script>
import StarContainer from "./StarContainer";

export default {
  name: "EtherealTab",
  components: {
    StarContainer
  },
  data() {
    return {
      etherealPower: new Decimal(),
      etherealPowerPerSecond: new Decimal(),
      cosmicSector: 0,
      nextSectorAt: new Decimal(),
      sectorBoost: new Decimal(),
      isExtended: false,
      canExtend: false,
      isBetter: false,
      nextStarReq: 0,
      stellarProd: new Decimal(),
      allStarsUnlocked: false,
      isStarPowerUnlocked: false,
      canUnlockStarPower: false,
      starPower: new Decimal(),
      starPowerPerSecond: new Decimal(),
      starBoost: new Decimal(),
      nextGeneration: new Decimal(),
      allGenerationsUnlocked: false,
      starGen: []
    };
  },
  computed: {
    etherealPowerDisplay() {
      if (this.etherealPower.lt(1)) return `${format(this.etherealPower, 3, 3)}`;
      if (this.etherealPower.lt(10)) return `${format(this.etherealPower, 2, 2)}`;
      if (this.etherealPower.lt(100)) return `${format(this.etherealPower, 1, 1)}`;
      return `${formatHybridLarge(this.etherealPower, 3)}`;
    },
    extraPowerDisplay() {
      return `It is also based on Galactic Power amounts above ${format(DC.NUMMAX, 2, 2)}.`;
    },
    etherealClassObject() {
      return {
        "o-ethereal-button": true,
        "c-ethereal-btn": true,
        "o-ethereal-button--available": true
      };
    },
    etherealCoolClassObject() {
      return {
        "o-cool-ethereal-button": true,
        "c-cool-ethereal-btn": true,
        "o-cool-ethereal-button--available": true
      };
    },
    stars() {
      return Object.values(GameDatabase.endgame.stars)
        .sort((a, b) => a.dmReq - b.dmReq)
        .map(config => new EtherealStarState(config));
    },
    rows() {
      return Math.ceil(this.stars.length / 3);
    },
    nextStarText() {
      if (this.allStarsUnlocked) return `All stars have been unlocked`;
      return `The next star unlocks at ${format(this.nextStarReq, 2, 2)} Dual Machines`;
    },
    etherealPowerTimeEstimate() {
      return TimeSpan.fromSeconds(Decimal.sub(this.nextSectorAt, this.etherealPower)
        .div(this.etherealPowerPerSecond)).toTimeEstimate();
    },
    starPowerReqText() {
      return `Reach a Stellar Product of ${format(DC.NUMMAX, 2, 2)} to unlock Star Power.`;
    },
    starPowerDisplay() {
      if (this.starPower.lt(1000)) return `${format(this.starPower, 2, 2)}`;
      return `${formatHybridLarge(this.starPower, 3)}`;
    },
    nextGenerationText() {
      if (this.allGenerationsUnlocked) return `All Star Power rewards have been unlocked`;
      return `You will get a new Star Power reward at ${format(this.nextGeneration, 2, 2)} Star Power`;
    },
    starTexts() {
      let arr = [];
      let starName = ["Red", "Orange", "Yellow", "Green", "Blue", "Purple", "White", "Black", "Gray"];
      for (let t = 0; t < 9; t++) {
        if (Ethereal.starGeneration(t).neq(0)) {
          arr.push(`Star Power is currently generating ${formatDecimalPercents(this.starGen[t], 2)} of pending ${starName[t]} Stars per second`);
        }
      }
      return arr;
    }
  },
  methods: {
    update() {
      this.etherealPower.copyFrom(Currency.etherealPower.value);
      this.etherealPowerPerSecond.copyFrom(getEtherealPowerGainPerSecond());
      this.cosmicSector = Ethereal.cosmicSector;
      this.nextSectorAt.copyFrom(Ethereal.sectorThreshold);
      this.sectorBoost.copyFrom(Ethereal.sectorBoost);
      this.isExtended = player.endgame.ethereal.isExtended;
      this.canExtend = this.etherealPower.gte(1e25);
      this.isBetter = Alpha.isDestroyed;
      this.nextStarReq = Ethereal.nextStarDMReq;
      this.stellarProd.copyFrom(Ethereal.stellarProduct);
      this.allStarsUnlocked = !this.nextStarReq;
      this.isStarPowerUnlocked = Ethereal.isStarPowerUnlocked;
      this.canUnlockStarPower = this.stellarProd.gte(DC.NUMMAX);
      this.starPower.copyFrom(Ethereal.starPower);
      this.starPowerPerSecond.copyFrom(getStarPowerGainPerSecond());
      this.starBoost.copyFrom(Ethereal.allStarBoost);
      this.nextGeneration.copyFrom(!Ethereal.nextGeneration ? new Decimal(Infinity) : Ethereal.nextGeneration);
      this.allGenerationsUnlocked = this.nextGeneration.eq(Infinity);
      this.starGen = [];
      for (let t = 0; t < 9; t++) {
        this.starGen.push(Ethereal.starGeneration(t));
      }
    },
    extendEthereal() {
      return player.endgame.ethereal.isExtended = true;
    },
    getStar(row, column) {
      return () => this.stars[(row - 1) * 3 + column - 1];
    },
    unlockStarPower() {
      return player.endgame.ethereal.isStarPowerUnlocked = true;
    }
  }
};
</script>

<template>
  <div class="l-ethereal-tab">
    <div>
      <div>
        <span class="c-normal-ethereal-text">{{ $t('ade.9f717812b3aa8e61') }} </span>
        <span class="c-really-cool-ethereal-text">{{ $legacyText(_s(etherealPowerDisplay)) }}</span>
        <span class="c-normal-ethereal-text"> {{ $t('ade.514306886ac99fcd') }} </span>
        <span class="c-really-cool-ethereal-text">{{ $t('ade.7401cbf5f86d95e0', { p0: $legacyText(_s(format(etherealPowerPerSecond,3,3))) }) }}</span>
      </div>
      <div>
        <span class="c-normal-ethereal-text">
          {{ $t('ade.a062ed942472b350') }}
        </span>
        <span
          v-if="isBetter"
          class="c-normal-ethereal-text"
        >
          {{ $legacyText(_s(extraPowerDisplay)) }}
        </span>
      </div>
      <div>
        <span class="c-normal-ethereal-text">{{ $t('ade.dafc381a83700d7a') }} </span>
        <span class="c-really-cool-ethereal-text">{{ $legacyText(_s(formatInt(cosmicSector))) }}</span>
        <span class="c-normal-ethereal-text">{{ $t('ade.3d15a3f93f454829') }} </span>
        <span class="c-really-cool-ethereal-text">{{ $legacyText(_s(formatX(sectorBoost, 3))) }}</span><span class="c-normal-ethereal-text">.</span>
      </div>
      <div>
        <span class="c-normal-ethereal-text">{{ $t('ade.bbf4a1f9a6b0b94b') }} </span>
        <span
          class="c-really-cool-ethereal-text"
          :ach-tooltip="$legacyText(etherealPowerTimeEstimate)"
        >{{ $legacyText(_s(formatHybridLarge(nextSectorAt, 3))) }}</span>
        <span class="c-normal-ethereal-text"> {{ $t('ade.514306886ac99fcd') }}</span>
      </div>
    </div>
    <br>
    <div
      v-if="!isExtended"
      class="l-ethereal-extension-unlock"
    >
      <div v-if="!canExtend">
        <span class="c-normal-ethereal-text">{{ $t('ade.fc75a718e69fb1c6', { p0: $legacyText(_s(format(1e25,2,2))) }) }}</span>
      </div>
      <div v-if="canExtend">
        <button
          :class="etherealClassObject"
          @click="extendEthereal"
        >
          {{ $t('ade.87f3f74c389965d8') }}
        </button>
      </div>
    </div>
    <div
      v-if="isExtended"
      class="l-star-grid"
    >
      <div>
        <span class="c-stellar-glow">{{ $t('ade.7113d09c4a3d6255') }} </span>
        <span class="c-cooler-stellar-glow">{{ $legacyText(_s(format(stellarProd, 2, 2))) }}</span><span class="c-stellar-glow">.</span>
      </div>
      <br>
      <div
        v-for="row in rows"
        :key="row"
        class="l-star-grid__row"
      >
        <StarContainer
          v-for="column in 3"
          :key="row * 3 + column"
          :get-star="getStar(row, column)"
          class="l-star-grid__cell"
        />
      </div>
      <br>
      <span class="c-normal-ethereal-text">
        {{ $legacyText(_s(nextStarText)) }}
      </span>
    </div>
    <br>
    <div
      v-if="!isStarPowerUnlocked && allStarsUnlocked"
      class="l-ethereal-extension-unlock"
    >
      <div v-if="!canUnlockStarPower">
        <span class="c-stellar-glow">{{ $legacyText(_s(starPowerReqText)) }}</span>
      </div>
      <div v-if="canUnlockStarPower">
        <button
          :class="etherealCoolClassObject"
          @click="unlockStarPower"
        >
          {{ $t('ade.787dce09f50c6349') }}
        </button>
      </div>
    </div>
    <div
      v-if="isStarPowerUnlocked"
      class="l-star-grid"
    >
      <div>
        <span class="c-stellar-glow">{{ $t('ade.9f717812b3aa8e61') }} </span>
        <span class="c-cooler-stellar-glow">{{ $legacyText(_s(starPowerDisplay)) }}</span>
        <span class="c-stellar-glow"> {{ $t('ade.194dcf979a5b02bd') }} </span>
        <span class="c-cooler-stellar-glow">{{ $t('ade.7401cbf5f86d95e0', { p0: $legacyText(_s(format(starPowerPerSecond,3,3))) }) }}</span>
      </div>
      <div>
        <span class="c-stellar-glow">{{ $t('ade.0ed4a7aa83629af0') }} </span>
        <span class="c-cooler-stellar-glow">{{ $legacyText(_s(formatX(starBoost, 3, 3))) }}</span><span class="c-stellar-glow">.</span>
      </div>
      <br>
      <span
        class="c-stellar-glow"
        v-for="(line, index) in starTexts"
        :key="index"
      >
        {{ $legacyText(_s(line)) }} <br>
      </span>
      <br>
      <span class="c-stellar-glow">
        {{ $legacyText(_s(nextGenerationText)) }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.l-ethereal-tab {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.l-ethereal-extension-unlock {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
}

.c-normal-ethereal-text {
  font-size: 2rem;
  color: #0000ff;
  animation: a-ethereal-text-glow 5s infinite;
}

.c-really-cool-ethereal-text {
  font-size: 3rem;
  font-weight: bold;
  background: linear-gradient(90deg, cyan, blue, cyan, blue, cyan, blue, cyan);
  background-size: 300% 100%;
  background-clip: text;
  text-shadow: 0 0 1.5rem #0000ff;
  animation: a-ethereal-gradient-cycle 5s linear infinite;

  -webkit-text-fill-color: transparent;
}

.c-really-cool-ethereal-text::before{
  text-shadow: 0 0 white;
}

@keyframes a-ethereal-gradient-cycle {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 50% 50%;
  }
  100% {
    background-position: 100% 50%;
  }
}

@keyframes a-ethereal-text-glow {
  0% { color: #0000ff; }
  50% { color: #00ffff; }
  100% { color: #0000ff; }
}

.c-stellar-glow {
  font-size: 2rem;
  animation: a-galactic-power-amount-cycle 12s infinite;
}

.c-cooler-stellar-glow {
  font-size: 3rem;
  font-weight: bold;
  animation: a-galactic-power-amount-cycle 12s infinite;
}
</style>
