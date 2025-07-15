<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import MainLayout from './layouts/MainLayout.vue'
import AuthLayout from './layouts/AuthLayout.vue'

const router = useRouter()
const currentRoute = computed(() => router.currentRoute.value)

// Determine which layout to use based on route
const isAuthRoute = computed(() => {
  return currentRoute.value.meta.layout === 'auth'
})
</script>

<template>
  <component :is="isAuthRoute ? AuthLayout : MainLayout">
    <router-view v-slot="{ Component }">
      <transition 
        name="page" 
        mode="out-in"
        appear
      >
        <component :is="Component" />
      </transition>
    </router-view>
  </component>
</template>

<style>
.page-enter-active,
.page-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.page-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>