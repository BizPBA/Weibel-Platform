<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const goToHome = () => {
  router.push('/')
}
</script>

<template>
  <div class="min-h-[80vh] flex items-center justify-center p-4">
    <div class="text-center">
      <h1 class="text-6xl font-bold text-primary-600 mb-4">404</h1>
      <h2 class="text-2xl font-medium text-gray-900 mb-2">Page Not Found</h2>
      <p class="text-gray-600 mb-8 max-w-md mx-auto">
        The page you are looking for might have been removed, had its name changed, 
        or is temporarily unavailable.
      </p>
      <button class="btn-primary" @click="goToHome">
        Go to Home
      </button>
    </div>
  </div>
</template>