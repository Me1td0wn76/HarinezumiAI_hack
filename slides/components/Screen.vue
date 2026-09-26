<script setup lang="ts">
import { computed } from 'vue'

// スクリーンショットをブラウザの枠に入れて見せる。src は public/ からのパス（例: /screens/home.png）
// height を渡すと、その高さで上端から切り取って見せる（縦横比の違う画像を並べるとき用）
const props = withDefaults(defineProps<{ src: string; alt: string; url?: string; height?: string }>(), { url: 'localhost:3000' })
const resolved = computed(() => import.meta.env.BASE_URL + props.src.replace(/^\//, ''))
</script>

<template>
  <figure class="lt-screen">
    <div class="lt-screen-bar" aria-hidden="true">
      <i /><i /><i />
      <span>{{ url }}</span>
    </div>
    <img :src="resolved" :alt="alt" :style="height ? { height, objectFit: 'cover', objectPosition: 'top left' } : undefined">
  </figure>
</template>

<style scoped>
.lt-screen {
  margin: 0;
  overflow: hidden;
  border: 2px solid #f0de9a;
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 18px 40px -18px rgba(122, 90, 0, 0.45);
}
.lt-screen-bar {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 10px;
  background: #fff9db;
  border-bottom: 2px solid #f0de9a;
}
.lt-screen-bar i {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #f3e3a0;
}
.lt-screen-bar span {
  margin-left: 8px;
  padding: 1px 10px;
  border-radius: 999px;
  background: #fff;
  color: #74633a;
  font-size: 9px;
  line-height: 1.5;
}
.lt-screen img {
  display: block;
  width: 100%;
  height: auto;
}
</style>
