<!-- 各スライドの下の帯（表紙・締めでは出さない） -->
<template>
  <footer v-if="$frontmatter.layout !== 'hero'" class="lt-footer">
    <span class="lt-footer-brand"><Bolt :size="13" /> LT会支援アプリ</span>
    <span>{{ $page }} / {{ $nav.total }}</span>
  </footer>
</template>

<style scoped>
.lt-footer {
  position: absolute;
  right: 3.5rem;
  bottom: 0.9rem;
  left: 3.5rem;
  display: flex;
  justify-content: space-between;
  color: var(--lt-subtle);
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.04em;
}
.lt-footer-brand {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
}
</style>
