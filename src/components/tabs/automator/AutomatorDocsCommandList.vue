<script>
import AutomatorDocsManPage from "./AutomatorDocsManPage";

export default {
  name: "AutomatorDocsCommandList",
  components: {
    AutomatorDocsManPage
  },
  data() {
    return {
      selectedCommand: -1,
    };
  },
  computed: {
    categoryNames: () => GameDatabase.reality.automator.categoryNames,
    commands: () => GameDatabase.reality.automator.commands,
  },
  methods: {
    commandsInCategory(category) {
      return this.commands.filter(c => c.category === category && c.isUnlocked());
    }
  }
};
</script>

<template>
  <div>
    <div v-if="selectedCommand !== -1">
      <button
        class="c-automator-docs--button l-return-button fas fa-arrow-left"
        @click="selectedCommand = -1"
      />
      {{ $t('ade.8bc0ba2fcd6829e9') }}
    </div>
    <AutomatorDocsManPage
      v-if="selectedCommand !== -1"
      :command="commands[selectedCommand]"
    />
    <div
      v-else
      class="c-automator-docs-page"
    >
      {{ $t('ade.2d4808df46ad7118') }}
      <br>
      <br>
      <span>{{ $t('ade.a8243d18ac560861') }}</span>
      <br>
      <div
        v-for="(category, i) in categoryNames"
        :key="i"
      >
        {{ $t('ade.9bc8e750dee9935c', { p0: $legacyText(_s(category)), p1: $legacyText(_s(commandsInCategory(i).length)) }) }}
        <div
          v-for="command in commandsInCategory(i)"
          :key="command.id"
          class="c-automator-docs-page__link l-command-group"
          @click="selectedCommand = command.id"
        >
          <span v-if="command.isUnlocked()">
            {{ $legacyText(_s(command.keyword)) }}
          </span>
        </div>
      </div>
      <br>
      <span>
        {{ $t('ade.22a36123117b9362') }} <u>{{ $t('ade.ecf342d6d69d2465') }}</u> {{ $t('ade.02a1658707bc4427') }} <i>{{ $t('ade.c27a54b559e5eacd') }}</i> {{ $t('ade.7f2e46ce9db8a812') }} <i>{{ $t('ade.16e5f1b6c6fd4e01') }}</i> {{ $t('ade.de3afddf95829e72') }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.l-command-group {
  display: flex;
  flex-direction: column;
  padding-left: 1rem;
}

.l-return-button {
  width: 4rem;
  height: 2.6rem;
  font-size: 1.8rem;
  margin-left: 2rem;
}
</style>
