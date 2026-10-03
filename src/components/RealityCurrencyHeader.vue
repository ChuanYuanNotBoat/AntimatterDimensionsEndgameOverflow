<script>
export default {
  name: "RealityCurrencyHeader",
  data() {
    return {
      isDoomed: false,
      currencyValue: new Decimal(),
      currencyName: "",
    };
  },
  methods: {
    update() {
      this.isDoomed = Pelle.isDoomed;
      if (this.isDoomed) {
        const shards = Currency.realityShards.value;
        this.currencyValue = format(shards, 2, 2);
        this.currencyName = pluralize("Reality Shard", shards);
      } else {
        const rm = Currency.realityMachines.value;
        this.currencyValue = formatMachines(rm, Currency.imaginaryMachines.value, Currency.dualMachines.value);
        this.currencyName = pluralize("Reality Machine", rm);
      }
    },
    resourceClass() {
      return {
        "c-reality-tab__reality-machines": true,
        "c-shard-color": this.isDoomed
      };
    }
  }
};
</script>

<template>
  <div class="c-reality-currency">
    <LocalizedText id="ade.cd1ff500c8f2ac78">
      <template #p0><b :class="resourceClass()">
      {{ $legacyText(_s(currencyValue)) }}
    </b></template>
      <template #p1>{{ $legacyText(_s(currencyName)) }}</template>
    </LocalizedText>
  </div>
</template>

<style scoped>
.c-reality-currency {
  font-size: 1.2rem;
  margin-bottom: 1rem;
}

.c-shard-color {
  color: var(--color-pelle--base);
}
</style>
