<script setup lang="ts">
// This layout is used for authentication pages
</script>

<template>
  <div class="min-h-screen bg-primary-50 flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <div class="text-center mb-8">
        <img src="/src/assets/weibel-logo.svg" alt="Weibel Logo" class="h-12 mx-auto mb-4" />
        <h1 class="text-2xl font-semibold text-primary-800">Weibel Platform</h1>
      </div>
      
      <div class="bg-white rounded-lg shadow-lg overflow-hidden">
        <slot />
      </div>
    </div>
  </div>
</template>