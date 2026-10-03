<script>
import ModalWrapperChoice from "@/components/modals/ModalWrapperChoice";

export default {
  name: "ResetModal",
  components: {
    ModalWrapperChoice,
  },
  props: {
    header: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    gainedResources: {
      type: String,
      required: true
    },
    startingResources: {
      type: String,
      required: false,
      default: undefined
    },
    confirmOption: {
      type: String,
      required: false,
      default: undefined
    },
    confirmFn: {
      type: Function,
      required: true
    },
    alternateText: {
      type: String,
      required: false,
      default: undefined
    },
    alternateCondition: {
      type: Boolean,
      required: false,
      default: false
    }
  },
};
</script>

<template>
  <ModalWrapperChoice
    :option="confirmOption"
    @confirm="confirmFn"
  >
    <template #header>
      {{ header }}
    </template>
    <div v-if="!alternateCondition">
      <div class="c-modal-message__text">
        {{ $legacyText(_s(message)) }}
        <br>
      </div>
      <br>
      <div class="c-modal-message__text">
        {{ $legacyText(_s(gainedResources)) }}
      </div>
      <br>
      <div
        v-if="startingResources"
        class="c-modal-message__text"
      >
        {{ $legacyText(_s(startingResources)) }}
      </div>
    </div>
    <div v-else>
      <div class="c-modal-message__text">
        {{ $legacyText(_s(alternateText)) }}
      </div>
    </div>
  </ModalWrapperChoice>
</template>