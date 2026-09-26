<script setup lang="ts">
import { computed } from 'vue'

// メンバー紹介のカード。img は public/ からのパス（例: /members/xxx.png）。中身（担当したもの）はスロットで渡す
const props = defineProps<{ login: string; img: string; role: string }>()
const src = computed(() => import.meta.env.BASE_URL + props.img.replace(/^\//, ''))
</script>

<template>
  <div class="member">
    <img :src="src" :alt="`@${login} のアイコン`" class="member-avatar">
    <div class="member-login">@{{ login }}</div>
    <span class="role">{{ role }}</span>
    <div class="member-body">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.member {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1.2rem 1rem 1rem;
  border-radius: 1.4rem;
  background: var(--lt-card);
}
.member-avatar {
  width: 76px;
  height: 76px;
  border: 3px solid var(--lt-sunny);
  border-radius: 50%;
  background: #fff;
  object-fit: cover;
}
.member-login {
  margin: 0.55rem 0 0.3rem;
  font-size: 1.05rem;
  font-weight: 900;
}
.member-body {
  align-self: stretch;
  margin-top: 0.4rem;
  font-size: 0.78rem;
}
.member-body :deep(li) {
  margin: 0.35rem 0;
  line-height: 1.5;
}
</style>
