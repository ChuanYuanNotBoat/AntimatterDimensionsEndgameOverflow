<script>
import EffectDisplay from "@/components/EffectDisplay";

export default {
  name: "AlchemyResourceInfo",
  components: {
    EffectDisplay
  },
  props: {
    resource: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      amount: 0,
      cap: 0,
      capped: false,
      flow: 0,
      isReactionActive: false,
      reactionProduction: 0,
      isUnlocked: false,
      unlockRequirement: ""
    };
  },
  computed: {
    classObject() {
      return {
        "c-alchemy-resource-info": true,
        "c-alchemy-resource-info--locked": !this.isUnlocked
      };
    },
    reaction() {
      return this.resource.reaction;
    },
    isBaseResource() {
      return this.resource.isBaseResource;
    },
    reactionText() {
      if (this.resource === AlchemyResource.reality) return this.realityReactionText;
      const reagents = this.reaction.reagents
        .map(r => `${format(r.cost)}${r.resource.symbol}`)
        .join(" + ");
      return `${reagents} ➜ ${format(this.reactionProduction, 2, 2)}${this.resource.symbol}`;
    },
    realityReactionText() {
      const reagents = this.reaction.reagents
        .map(r => r.resource.symbol)
        .join(" + ");
      return `${reagents} ➜ ${this.resource.symbol}`;
    },
    effectConfig() {
      const resource = this.resource;
      return {
        effect: () => resource.effectValue,
        formatEffect: resource.config.formatEffect
      };
    },
    resourceAmount() {
      return formatHybridFloat(this.amount, 1);
    },
    resourceCap() {
      return formatHybridFloat(this.cap, 1);
    },
    formattedFlow() {
      const sign = this.flow >= 0 ? "+" : "-";
      if (Math.abs(this.flow) < 0.01) return "None";
      const resourceText = `${sign}${format(Math.abs(this.flow), 2, 2)}/sec`;
      const color = this.flow > 0 ? "9CCC65" : "CC6666";
      return `<span style="color:#${color}">${resourceText}</span>`;
    },
    isDoomed() {
      return Pelle.isDoomed && this.resource.destroyed;
    }
  },
  methods: {
    update() {
      const resource = this.resource;
      this.amount = resource.amount;
      this.cap = resource.cap;
      this.capped = resource.capped;
      this.flow = resource.flow;
      this.isUnlocked = resource.isUnlocked;
      this.unlockRequirement = resource.lockText;
      if (!this.isBaseResource) {
        this.isReactionActive = !this.isDoomed && this.reaction.isActive;
        this.reactionProduction = this.reaction.reactionProduction;
      }
    }
  }
};
</script>

<template>
  <div
    v-if="isUnlocked"
    :class="classObject"
  >
    <span class="c-alchemy-resource-info__title">
      {{ $legacyText(_s(resource.symbol)) }} {{ $legacyText(_s(resource.name)) }} {{ $legacyText(_s(resource.symbol)) }}
    </span>
    <span v-if="isDoomed">
      {{ $t('ade.b597f1eb6bca762f') }}
    </span>
    <span v-else>
      {{ $t('ade.8d78d72ef7f2ec39', { p0: $legacyText(_s(capped?"Capped":"Current")), p1: $legacyText(_s(resourceAmount)), p2: $legacyText(_s(resourceCap)) }) }} <span v-html="$legacyHtml(formattedFlow)" />)
    </span>
    <span v-if="isBaseResource">{{ $t('ade.51f45ea25e8df212') }}</span>
    <span v-else>{{ $t('ade.98b7e45c8ad1e2c4', { p0: $legacyText(_s(isReactionActive?"Active":"Inactive")), p1: $legacyText(_s(reactionText)) }) }}</span>
    <span :class="{ 'o-pelle-disabled': isDoomed }">
      <EffectDisplay
        :label="$t('ade.08a065501690937f')"
        :config="effectConfig"
      />
    </span>
  </div>
  <div
    v-else
    :class="classObject"
  >
    {{ $t('ade.fdb472239bac2bec', { p0: $legacyText(_s(unlockRequirement)) }) }}
  </div>
</template>

<style scoped>

</style>
