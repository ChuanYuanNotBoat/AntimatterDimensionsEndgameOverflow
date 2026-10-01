import {
  boundedPositivePower, boundedPositiveProduct, boundedPositiveQuotient, boundedPositiveSum, boundedPositiveValue
} from "./finite-decimal";

/**
 * @abstract
 */
export class EndgameSkillPurchaseType {
  /**
  * @abstract
  */
  get amount() { throw new NotImplementedError(); }

  /**
  * @abstract
  */
  set amount(value) { throw new NotImplementedError(); }

  add(amount) { this.amount = boundedPositiveSum(this.amount, amount); }

  /**
  * @abstract
  */
  get currency() { throw new NotImplementedError(); }

  get cost() { return boundedPositiveProduct(this.costBase, boundedPositivePower(this.costIncrement, this.amount)); }

  /**
   * @abstract
   */
  get costBase() { throw new NotImplementedError(); }

  /**
   * @abstract
   */
  get costIncrement() { throw new NotImplementedError(); }

  get bulkPossible() {
    return boundedPositiveValue(Decimal.affordGeometricSeries(this.currency.value, this.cost, this.costIncrement, 0));
  }

  bulkCost(amount) {
    if (amount.lte(0)) return DC.D0;
    const series = boundedPositiveQuotient(boundedPositivePower(this.costIncrement, amount).sub(1),
      this.costIncrement.sub(1));
    return boundedPositiveProduct(this.cost, series);
  }

  purchaseAmount(amount) {
    const target = boundedPositiveSum(this.amount, amount);
    const gained = target.sub(this.amount);
    // At high Decimal layers adding one may not change the count. Do not award
    // skills repeatedly when the purchase cannot advance its stored price.
    if (gained.lte(0)) return false;
    const price = gained.eq(1) ? this.cost : this.bulkCost(gained);
    if (price.lte(0) || !this.currency.purchase(price)) return false;
    this.amount = target;
    Currency.endgameSkills.add(gained);
    return true;
  }

  purchase(bulk) {
    if (!this.canAfford) return false;
    let purchased = false;
    if (bulk) {
      // Leave the last purchase separate to absorb rounding in the inverse.
      let amount = this.bulkPossible.sub(1);
      // Near a layer boundary the inverse can still overshoot after subtracting
      // one. Find an affordable, representable count instead of falling back to
      // buying only a single skill out of an enormous budget.
      if (amount.gt(0) && this.bulkCost(boundedPositiveSum(this.amount, amount).sub(this.amount))
        .gt(this.currency.value)) {
        let low = DC.D0;
        let high = amount;
        for (let i = 0; i < 64; i++) {
          const mid = boundedPositiveSum(low, high.sub(low).div(2)).floor();
          if (mid.lte(low) || mid.gte(high)) break;
          const gained = boundedPositiveSum(this.amount, mid).sub(this.amount);
          if (this.bulkCost(gained).lte(this.currency.value)) low = mid;
          else high = mid;
        }
        amount = low;
      }
      if (amount.gt(0)) purchased = this.purchaseAmount(amount);
    }
    if (this.purchaseAmount(DC.D1)) purchased = true;
    return purchased;
  }

  get canAfford() {
    return this.currency.gte(this.cost) && player.endgames > 0;
  }

  reset() {
    this.amount = DC.D0;
  }
}

EndgameSkillPurchaseType.gg = new class extends EndgameSkillPurchaseType {
  get amount() { return player.endgameMasteries.ggBought; }
  set amount(value) { player.endgameMasteries.ggBought = value; }

  get currency() { return Currency.galaxyGeneratorGalaxies; }
  get costBase() { return DC.E10; }
  get costIncrement() { return DualityUpgrade(27).isBought ? new Decimal(1.1) : DC.E2; }
}();

EndgameSkillPurchaseType.cp = new class extends EndgameSkillPurchaseType {
  get amount() { return player.endgameMasteries.cpBought; }
  set amount(value) { player.endgameMasteries.cpBought = value; }

  get currency() { return Currency.celestialPoints; }
  get costBase() { return DC.D1; }
  get costIncrement() { return DC.E1; }
}();

EndgameSkillPurchaseType.dp = new class extends EndgameSkillPurchaseType {
  get amount() { return player.endgameMasteries.dpBought; }
  set amount(value) { player.endgameMasteries.dpBought = value; }

  get currency() { return Currency.doomedParticles; }
  get costBase() { return DC.D1; }
  get costIncrement() { return DC.E1; }
}();

export const EndgameSkills = {
  checkForBuying(auto) {
    if (CelestialDimension(1).baseAmount.gt(0)) return true;
    if (!auto) Modal.message.show(`You need to buy at least ${formatInt(1)} Celestial Dimension before you can purchase
      Endgame Skills. You also need to be outside Doom to prevent
      ${player.universes.current === 2 ? "M" : "AM"} overflow.`, { closeEvent: GAME_EVENT.ENDGAME_RESET_AFTER });
    return false;
  },

  buyOne(auto = false, type) {
    if (!this.checkForBuying(auto)) return 0;
    if (!EndgameSkillPurchaseType[type].purchase(false)) return 0;
    return 1;
  },

  // This is only called via automation and there's no manual use-case, so we assume auto is true and simplify a bit
  buyOneOfEach() {
    if (!this.checkForBuying(true)) return 0;
    const esGG = this.buyOne(true, "gg");
    const esCP = this.buyOne(true, "cp");
    const esDP = this.buyOne(true, "dp");
    return esGG + esCP + esDP;
  },

  buyMax(auto = false) {
    if (!this.checkForBuying(auto)) return 0;
    const esGG = EndgameSkillPurchaseType.gg.purchase(true);
    const esCP = EndgameSkillPurchaseType.cp.purchase(true);
    const esDP = EndgameSkillPurchaseType.dp.purchase(true);
    return esGG + esCP + esDP;
  },

  totalPurchased() {
    return boundedPositiveSum(boundedPositiveSum(EndgameSkillPurchaseType.gg.amount,
      EndgameSkillPurchaseType.cp.amount), EndgameSkillPurchaseType.dp.amount);
  },

  calculateEndgameMasteriesCost() {
    const list = EndgameMastery.permaMasteries.isBought
      ? EndgameMastery.boughtEM().filter(m => m.id >= 180 && m.id < 280)
      : EndgameMastery.boughtEM().filter(m => m.id < 280);
    let totalCost = list.map(em => em.cost).reduce(Number.sumReducer, 0);
    totalCost += masteryIncrease.entanglementCost();
    return totalCost;
  }
};
