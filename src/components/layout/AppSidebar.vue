<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useLanguageStore } from '../../stores/languageStore'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits(['close'])
const router = useRouter()
const languageStore = useLanguageStore()
const currentRoute = computed(() => router.currentRoute.value)

// Navigation items
const navItems = [
  { 
    key: 'dashboard', 
    path: '/dashboard',
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'
  },
  { 
    key: 'customers', 
    path: '/customers',
    icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z'
  },
  { 
    key: 'locations', 
    path: '/projects',
    icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'
  }
]

// Handle navigation
const navigate = (path: string) => {
  router.push(path)
  if (window.innerWidth < 1024) {
    emit('close')
  }
}

// Check if a nav item is active
const isActive = (path: string) => {
  return currentRoute.value.path === path || currentRoute.value.path.startsWith(`${path}/`)
}
</script>

<template>
  <!-- Mobile sidebar backdrop -->
  <div 
    v-if="isOpen" 
    class="fixed inset-0 bg-gray-600 bg-opacity-75 z-20 lg:hidden transition-opacity"
    @click="$emit('close')"
  ></div>
  
  <!-- Sidebar -->
  <aside 
    class="fixed top-16 left-0 bottom-0 lg:flex flex-col w-64 bg-primary-600 z-30 transform transition-transform duration-200 ease-in-out"
    :class="[isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0']"
  >
    <nav class="flex-1 pt-5 pb-4 px-2 space-y-1 overflow-y-auto">
      <div v-for="item in navItems" :key="item.key" class="mb-1">
        <button 
          class="w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-150 group"
          :class="[
            isActive(item.path) 
              ? 'bg-primary-700 text-white' 
              : 'text-white/70 hover:text-white hover:bg-primary-700'
          ]"
          @click="navigate(item.path)"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            class="flex-shrink-0 w-5 h-5 mr-3"
            :class="[
              isActive(item.path) 
                ? 'text-white' 
                : 'text-white/70 group-hover:text-white'
            ]"
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="item.icon" />
          </svg>
          {{ languageStore.t(item.key) }}
        </button>
      </div>
    </nav>
    
    <div class="p-4 border-t border-primary-700">
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <img src="/src/assets/support.svg" alt="Support" class="h-10 w-10" />
        </div>
        <div class="ml-3">
          <p class="text-sm font-medium text-white">{{ languageStore.t('needHelp') }}</p>
          <a href="#" class="text-xs text-white/70 hover:text-white">{{ languageStore.t('contactSupport') }}</a>
        </div>
      </div>
    </div>
  </aside>
</template>