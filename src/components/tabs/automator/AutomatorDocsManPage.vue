<script>
export default {
  name: "AutomatorDocsManPage",
  props: {
    command: {
      type: Object,
      required: true
    }
  },
  computed: {
    description() {
      const desc = this.command.description;
      return typeof desc === "function" ? desc() : desc;
    }
  }
};
</script>

<template>
  <div class="c-automator-docs-page">
    <b>NAME</b>
    <div
      class="c-automator-docs-page__indented"
      v-html="$legacyHtml(command.keyword)"
    />
    <b>SYNTAX</b>
    <div
      class="c-automator-docs-page__indented"
      v-html="$legacyHtml(command.syntax)"
    />
    <template v-if="command.description">
      <b>DESCRIPTION</b>
      <div
        class="c-automator-docs-page__indented"
        v-html="$legacyHtml(description)"
      />
    </template>
    <template v-for="section in command.sections">
      <b :key="section.name">{{ $legacyText(_s(section.name)) }}</b>
      <template v-for="item in section.items">
        <div
          :key="item.header"
          class="c-automator-docs-page__indented"
        >
          <div v-html="$legacyHtml(item.header)" />
          <div
            class="c-automator-docs-page__indented"
            v-html="$legacyHtml(item.description)"
          />
        </div>
      </template>
    </template>
    <template v-if="command.examples">
      <b>USAGE EXAMPLES</b>
      <div
        v-for="example in command.examples"
        :key="example"
        class="c-automator-docs-page__indented"
        v-html="$legacyHtml(example)"
      />
    </template>
  </div>
</template>

<style scoped>

</style>
