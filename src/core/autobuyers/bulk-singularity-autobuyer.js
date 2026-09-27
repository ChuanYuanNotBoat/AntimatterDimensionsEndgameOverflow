import { AutobuyerState } from "./autobuyer";
import { boundedPositiveSum } from "../finite-decimal";

export class BulkSingularityAutobuyerState extends AutobuyerState {
  get data() {
    return player.auto.bulkSingularity;
  }

  get name() {
    return `Bulk Singularity`;
  }

  get isUnlocked() {
    return ExpansionPack.laitelaPack.isBought && !player.disablePostReality;
  }

  get lowerBound() {
    return this.data.lowerBound;
  }

  set lowerBound(value) {
    this.data.lowerBound = value;
  }

  get upperBound() {
    return this.data.upperBound;
  }

  set upperBound(value) {
    this.data.upperBound = value;
  }

  get hasLowerBound() {
    return this.data.hasLowerBound;
  }

  set hasLowerBound(value) {
    this.data.hasLowerBound = value;
  }

  get hasUpperBound() {
    return this.data.hasUpperBound;
  }

  set hasUpperBound(value) {
    this.data.hasUpperBound = value;
  }

  get bulk() {
    return 0;
  }

  tick() {
    if (player.celestials.laitela.singularities.lte(10)) {
      player.celestials.laitela.singularityCapIncreases = DC.E1;
    }

    if (player.celestials.laitela.singularities.gt(10)) {
      if (Singularity.timePerCondense.gt(this.upperBound) && this.data.hasUpperBound && player.celestials.laitela.singularityCapIncreases.gt(0)) {
        const bulk = Decimal.floor(Decimal.log10(Singularity.timePerCondense.div(this.upperBound))).add(1);
        player.celestials.laitela.singularityCapIncreases = Decimal.max(player.celestials.laitela.singularityCapIncreases.sub(bulk), 0);
      }

      if (Singularity.timePerCondense.lt(this.lowerBound) && this.data.hasLowerBound) {
        // Do not derive the bulk amount from timePerCondense itself here. At extreme production rates
        // cap / production can underflow to zero even though both operands and the required adjustment
        // are still representable. In particular, treating that zero as "buy BEMAX increases" instantly
        // saturates Singularity cap increases and then poisons game speed on the following tick.
        //
        // We want floor(log10(lowerBound / timePerCondense)) + 1. Since
        // timePerCondense = cap / production, evaluate the same expression entirely in log space:
        // log10(lowerBound) + log10(production) - log10(cap).
        const logRatio = Decimal.log10(this.lowerBound)
          .add(Decimal.log10(Currency.darkEnergy.productionPerSecond))
          .sub(Decimal.log10(Singularity.cap));
        const bulk = Decimal.max(Decimal.floor(logRatio).add(1), 0);
        player.celestials.laitela.singularityCapIncreases = boundedPositiveSum(
          player.celestials.laitela.singularityCapIncreases, bulk);
      }
    }
  }
}
