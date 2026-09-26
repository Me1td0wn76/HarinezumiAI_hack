<script setup lang="ts">
// アプリのロゴと同じ稲妻（apps/web/src/components/hero-shapes.tsx の BOLT）
withDefaults(defineProps<{ size?: number | string }>(), { size: 24 })
</script>

<template>
  <svg viewBox="0 0 24 24" :width="size" :height="size" aria-hidden="true" class="lt-bolt">
    <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" fill="#ffb86b" stroke="#e07a1f" stroke-width="0.6" stroke-linejoin="round" />
  </svg>
</template>

<style scoped>
.lt-bolt {
  display: inline-block;
  overflow: visible;
  vertical-align: -0.15em;
}
</style>
