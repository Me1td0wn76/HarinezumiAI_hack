<!-- 表紙・締めのスライド。アプリの HOME 上部と同じ、黄色の帯に淡い円と稲妻（frontmatter の mascot: hedgehog で、読み込み中の画面のハリネズミ） -->
<template>
  <div class="slidev-layout lt-hero">
    <div class="lt-hero-circle" aria-hidden="true">
      <LoadingHedgehog v-if="$frontmatter.mascot === 'hedgehog'" :scale="1.35" />
      <Bolt v-else :size="210" />
    </div>
    <div class="lt-hero-body">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.lt-hero {
  position: relative;
  display: flex;
  align-items: center;
  overflow: hidden;
  background: var(--lt-sunny);
}
.lt-hero-circle {
  position: absolute;
  top: 50%;
  right: -90px;
  display: grid;
  place-items: center;
  width: 470px;
  height: 470px;
  border-radius: 50%;
  background: #fff7cc;
  transform: translateY(-50%);
}
.lt-hero-body {
  position: relative;
  max-width: 600px;
}
</style>
