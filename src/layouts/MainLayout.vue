<script setup lang="ts">
import { ref } from 'vue'
import AppHeader from '../components/layout/AppHeader.vue'
import AppSidebar from '../components/layout/AppSidebar.vue'

const isSidebarOpen = ref(false)

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value
}

const closeSidebar = () => {
  isSidebarOpen.value = false
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex flex-col">
    <AppHeader @toggle-sidebar="toggleSidebar" />
    
    <div class="flex flex-1 pt-16">
      <AppSidebar 
        :is-open="isSidebarOpen" 
        @close="closeSidebar" 
      />
      
      <main class="flex-1 transition-all duration-200 ease-in-out lg:pl-64">
        <div class="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <slot />
        </div>
      </main>
    </div>
  </div>
</template>