<script>
export default {
  name: "AutomatorDocsIntroPage",
};
</script>

<template>
  <div>
    {{ $t('ade.bf36aca0aa666faa') }}
    <br>
    <br>
    {{ $t('ade.5a0c96006d356e75') }}
    <br>
    <br>
    <b>{{ $t('ade.01dba020c7fc5259') }}</b> {{ $t('ade.db74be56801219bd') }} <div class="fas fa-list c-automator-button-icon" /> {{ $t('ade.ea8814c8813af8d9') }}
    <div class="fas fa-book c-automator-button-icon" /> {{ $t('ade.f37968dd1df366bf') }}
    <br>
    <br>
    <b>{{ $t('ade.add464d968a64261') }}</b> {{ $t('ade.638b4d7bdf0711d0') }}
    <div class="fas fa-expand-arrows-alt c-automator-button-icon" /> {{ $t('ade.59b6b9cc2295ce07') }}
    <br>
    <br>
    <b>{{ $t('ade.717149b4bb4750e1') }}</b> {{ $t('ade.d10ec88e1f0a91e5') }}
    <br>
    <br>
    <b>{{ $t('ade.4df79921917fe3a4') }}</b> {{ $t('ade.eead2337dec48543') }}
    <div class="fas fa-edit c-automator-button-icon" /> {{ $t('ade.422710640e6d2069') }}
    <div class="fas fa-trash c-automator-button-icon" /> {{ $t('ade.7793495e2f198ebd') }}
    <br>
    <br>
    <b>{{ $t('ade.6d529771695d7800') }}</b> {{ $t('ade.97cd9bd6ca4bcaa3') }}
    <div class="fas fa-cubes c-automator-button-icon" />{{ $t('ade.d91b342dfeb1c11d') }} <div class="fas fa-file-code c-automator-button-icon" />{{ $t('ade.09b6a1f2a5e7ba65') }} <div class="fas fa-arrow-rotate-left c-automator-button-icon" /> {{ $t('ade.a3559db683680b55') }}
    <div class="fas fa-arrow-rotate-right c-automator-button-icon" />{{ $t('ade.8c4fd8813540e33e') }}
    <br>
    <br>
    <b>{{ $t('ade.a801e93833cdb22d') }}</b> {{ $t('ade.f1b778c2184162a9') }}
    <div class="fas fa-exclamation-triangle c-automator-button-icon" /> {{ $t('ade.b20f4ed76b7b9d56') }} <div class="fas fa-eye c-automator-button-icon" /> {{ $t('ade.b27af426e0dd0517') }}
    <br>
    <br>
    <b>{{ $t('ade.dda1a8f4064209d9') }}</b> {{ $t('ade.85b0409670670844') }}
    <div class="fas fa-file-export c-automator-button-icon" /> {{ $t('ade.422710640e6d2069') }}
    <div class="fas fa-file-import c-automator-button-icon" /> {{ $t('ade.947a771c6b536991') }} <div class="fas fa-window-restore c-automator-button-icon" /> {{ $t('ade.8e81bf26f787989d') }}
    <br>
    <br>
    <b>{{ $t('ade.f00e1837f1749015') }}</b> {{ $t('ade.5b7f536ec2cd6795') }}
  </div>
</template>

<style scoped>
.c-automator-button-icon {
  padding: 0.3rem 0.8rem;
  width: 3.3rem;
  border: var(--var-border-width, 0.2rem) solid var(--color-automator-controls-border);
  border-radius: var(--var-border-radius, 0.3rem);
  color: var(--color-automator-docs-font);
  background-color: var(--color-automator-controls-inactive);
}
</style>
