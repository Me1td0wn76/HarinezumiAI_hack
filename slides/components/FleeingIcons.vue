<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import type { LtIconName } from '../lib/lt-icons'

/**
 * アプリの fleeing-shapes.tsx を移植したもの。カーソルが近づくと、くるっと回りながら逃げ、離れるとばねのように戻る。
 * 位置は動かない外側の枠を基準に測る。OS の「視差効果を減らす」設定では動かさない
 */
const props = withDefaults(
  defineProps<{ icons: LtIconName[]; size?: number; reach?: number; push?: number }>(),
  { size: 52, reach: 240, push: 0.5 },
)

const inner = ref<HTMLElement[]>([])
let frame = 0

function onMove(e: MouseEvent) {
  cancelAnimationFrame(frame)
  frame = requestAnimationFrame(() => {
    const allowed = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    for (const el of inner.value) {
      if (!el?.parentElement) continue
      const box = el.parentElement.getBoundingClientRect()
      const dx = e.clientX - (box.left + box.width / 2)
      const dy = e.clientY - (box.top + box.height / 2)
      const d = Math.hypot(dx, dy) || 1
      if (allowed && d < props.reach) {
        const k = (props.reach - d) * props.push
        el.style.transform = `translate(${(-dx / d) * k}px, ${(-dy / d) * k}px) rotate(360deg)`
      } else {
        el.style.transform = ''
      }
    }
  })
}

onMounted(() => window.addEventListener('mousemove', onMove))
onBeforeUnmount(() => {
  window.removeEventListener('mousemove', onMove)
  cancelAnimationFrame(frame)
})
</script>

<template>
  <div class="lt-flee-row" aria-hidden="true">
    <span v-for="(name, i) in icons" :key="`${name}-${i}`" class="lt-flee-slot" :style="{ width: `${size}px`, height: `${size}px` }">
      <span ref="inner" class="lt-flee">
        <LtIcon :name="name" size="100%" />
      </span>
    </span>
  </div>
</template>

<style scoped>
.lt-flee-row {
  display: flex;
  align-items: center;
  gap: 1.1rem;
  pointer-events: none;
}
.lt-flee-slot {
  display: block;
}
.lt-flee {
  display: block;
  width: 100%;
  height: 100%;
  transition: transform 0.55s cubic-bezier(0.3, 1.6, 0.5, 1);
}
@media (prefers-reduced-motion: reduce) {
  .lt-flee {
    transition: none;
  }
}
</style>
