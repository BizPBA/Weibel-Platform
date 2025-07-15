<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import UserDropdown from './UserDropdown.vue'

defineEmits(['toggle-sidebar'])

const router = useRouter()
const isSearchOpen = ref(false)

const navigateToHome = () => {
  router.push('/')
}

const toggleSearch = () => {
  isSearchOpen.value = !isSearchOpen.value
}
</script>

<template>
  <header class="bg-primary-600 shadow-sm fixed top-0 left-0 right-0 z-10 h-16 flex items-center">
    <div class="w-full px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between">
        <!-- Left section -->
        <div class="flex items-center">
          <button 
            class="mr-2 p-2 rounded-md text-white/70 hover:text-white hover:bg-primary-700 lg:hidden"
            @click="$emit('toggle-sidebar')"
            aria-label="Toggle sidebar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          <div class="flex-shrink-0 flex items-center cursor-pointer" @click="navigateToHome">
            <img src="/src/assets/weibel-logo.svg" alt="Weibel Logo" class="h-8 w-auto" />
          </div>
        </div>
        
        <!-- Right section -->
        <div class="flex items-center space-x-4">
          <button 
            class="p-2 rounded-md text-white/70 hover:text-white hover:bg-primary-700"
            @click="toggleSearch"
            aria-label="Search"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
          
          <UserDropdown />
        </div>
      </div>
    </div>
    
    <!-- Search bar (hidden by default) -->
    <div 
      v-if="isSearchOpen" 
      class="absolute top-16 left-0 right-0 bg-white shadow-md animate-fade-in"
    >
      <div class="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div class="relative">
          <input 
            type="text" 
            placeholder="Search customers or locations..." 
            class="input pr-10"
            autofocus
          />
          <button 
            class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            @click="toggleSearch"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </header>
</template>