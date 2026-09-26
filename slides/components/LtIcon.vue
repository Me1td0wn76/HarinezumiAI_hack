<script setup lang="ts">
import { computed } from 'vue'
import { LT_ICONS, type LtIconName } from '../lib/lt-icons'

// アプリの見出し横のアイコン（apps/web/src/components/lt-icons.ts）と同じ絵
const props = withDefaults(defineProps<{ name: LtIconName; size?: number | string }>(), { size: 56 })
const paths = computed(() => LT_ICONS[props.name])
</script>

<template>
  <svg viewBox="0 0 60 60" :width="size" :height="size" aria-hidden="true" style="overflow: visible">
    <path
      v-for="(p, i) in paths"
      :key="i"
      :d="p.d"
      :fill="p.fill"
      stroke="#e07a1f"
      stroke-width="3"
      stroke-linejoin="round"
      stroke-linecap="round"
    />
  </svg>
</template>
