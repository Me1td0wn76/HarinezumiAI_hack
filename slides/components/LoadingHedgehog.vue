<script setup lang="ts">
import { useId } from 'vue'
import '../lib/lt-loading.css'

/**
 * アプリの読み込み中の画面（apps/web/src/components/loading-screen.tsx）と同じハリネズミ。
 * 頭の上でロゴの稲妻が下から充電され、満タンでキラッと光ってハリネズミが跳ねる。動きは lib/lt-loading.css
 */
withDefaults(defineProps<{ label?: string; scale?: number }>(), { scale: 1 })
// 同じスライドを複数描く（概要表示・印刷）ときに clipPath の id がぶつからないようにする
const clipId = `lt-loading-charge-${useId()}`
</script>

<template>
  <div class="lt-hh-wrap" :style="{ zoom: scale }" aria-hidden="true">
    <div class="lt-loading-stage">
      <span class="lt-loading-halo" />
      <span class="lt-loading-shadow" />
      <svg class="lt-loading-bolt" viewBox="0 0 24 24">
        <defs>
          <clipPath :id="clipId">
            <rect class="lt-loading-level" x="0" y="0" width="24" height="24" />
          </clipPath>
        </defs>
        <path class="lt-bolt-empty" d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" />
        <path class="lt-bolt-full" d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" :clip-path="`url(#${clipId})`" />
        <path class="lt-bolt-line" d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" />
        <g class="lt-bolt-sparks">
          <path d="M20.5 3.5l2.2-1.6" />
          <path d="M3.2 8.2l-2.4-.6" />
          <path d="M20.4 17.6l2.3 1.1" />
          <path d="M6 21l-1.7 1.8" />
        </g>
      </svg>
      <svg class="lt-loading-hh" viewBox="0 0 170 130">
        <ellipse class="lt-hh-foot" cx="58" cy="115" rx="9" ry="5.5" />
        <ellipse class="lt-hh-foot" cx="100" cy="115" rx="9" ry="5.5" />
        <g class="lt-hh-back">
          <path class="lt-hh-spikes" d="M33 100L18 96L29 86L16 77L30 71L21 59L36 58L31 44L46 47L46 31L60 39L64 24L75 35L83 22L90 36L102 26L105 41L120 35L117 50L133 48L126 62L141 65L131 76L144 83L130 90L110 100L46 100Z" />
          <path class="lt-hh-quills" d="M50 54l-6-6M70 42l-2-8M92 42l4-7M40 74l-8-3" />
        </g>
        <path class="lt-hh-belly" d="M32 100c4-8 24-12 50-12s44 5 46 13c1 9-20 15-48 15s-50-6-48-16z" />
        <path class="lt-hh-line" d="M33 104c6 8 24 12 47 12s40-4 46-12" />
        <path class="lt-hh-skin" d="M98 58c-2-9 6-15 13-11 5 3 5 10 1 14" />
        <path class="lt-hh-skin" d="M96 54c22-2 42 12 52 30 3 5 1 10-5 11-10 2-16 12-30 16-16 4-34-2-38-16-4-14 2-38 21-41z" />
        <path class="lt-hh-ear-in" d="M102 56c0-4 4-6 7-4" />
        <ellipse class="lt-hh-cheek" cx="122" cy="90" rx="7" ry="4" />
        <g class="lt-hh-eye">
          <ellipse cx="118" cy="74" rx="4" ry="4.8" />
          <circle cx="119.5" cy="72.2" r="1.4" />
        </g>
        <path class="lt-hh-happy" d="M113 76q5-7 10 0" />
        <circle class="lt-hh-nose" cx="147" cy="88" r="4.6" />
        <path class="lt-hh-mouth" d="M136 95q4 3 8-1" />
      </svg>
    </div>
    <p v-if="label" class="lt-loading-label">
      {{ label }}
      <span class="lt-loading-dots"><span /><span /><span /></span>
    </p>
  </div>
</template>

<style scoped>
.lt-hh-wrap {
  --lt-cycle: 2.4s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
}
.lt-hh-wrap .lt-loading-label {
  margin: 0;
}
</style>
