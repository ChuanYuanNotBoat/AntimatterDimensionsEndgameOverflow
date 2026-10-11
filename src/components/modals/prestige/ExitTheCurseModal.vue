<script>
import ModalWrapperChoice from "@/components/modals/ModalWrapperChoice";

export default {
  name: "ExitTheCurseModal",
  components: {
    ModalWrapperChoice
  },
  computed: {
    message() {
      return `You really thought you could escape from me? Think again. This was all part of my plan, after all. You cannot
      escape. You will remain here as my eternal prisoner. Accept your fate.`;
    },
  },
  methods: {
    handleYesClick() {
      player.celestials.slabdrill.isGoodbye = true;
    },
  },
};
</script>

<template>
  <ModalWrapperChoice
    @confirm="handleYesClick"
  >
    <template #header>
      {{ $t('ade.82a215e9c0023cca') }}
    </template>
    <div class="c-modal-message__text">
      {{ $legacyText(_s(message)) }}
    </div>
    <template #confirm-text>
      {{ $t('slabdrill.exitTheCurse.confirm') }}
    </template>
  </ModalWrapperChoice>
</template>
