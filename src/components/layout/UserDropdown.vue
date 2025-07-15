<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { onClickOutside } from '@vueuse/core'
import { useLanguageStore } from '../../stores/languageStore'

const router = useRouter()
const languageStore = useLanguageStore()
const isOpen = ref(false)
const dropdownRef = ref(null)

// Mock user data - this would come from an auth store in a real app
const user = {
  name: 'Anders Jensen',
  email: 'anders.jensen@weibel.dk',
  avatar: 'https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?auto=compress&cs=tinysrgb&w=100'
}

const toggleDropdown = () => {
  isOpen.value = !isOpen.value
}

const closeDropdown = () => {
  isOpen.value = false
}

const logout = () => {
  // In a real app, this would call an auth service logout method
  closeDropdown()
  router.push('/login')
}

const switchLanguage = (lang: 'en' | 'da') => {
  languageStore.setLanguage(lang)
  closeDropdown()
}

// Close dropdown when clicking outside
onClickOutside(dropdownRef, closeDropdown)
</script>

<template>
  <div class="relative" ref="dropdownRef">
    <button 
      class="flex items-center text-sm focus:outline-none"
      @click="toggleDropdown"
      aria-expanded="false"
      aria-haspopup="true"
    >
      <span class="sr-only">Open user menu</span>
      <img 
        class="h-8 w-8 rounded-full object-cover border border-primary-700" 
        :src="user.avatar" 
        :alt="user.name" 
      />
      <span class="ml-2 text-white font-medium hidden md:block">{{ user.name }}</span>
      
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        class="ml-1 h-5 w-5 text-white/70 hidden md:block" 
        viewBox="0 0 20 20" 
        fill="currentColor"
      >
        <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
      </svg>
    </button>
    
    <!-- Dropdown menu -->
    <div 
      v-if="isOpen" 
      class="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 focus:outline-none z-10 animate-fade-in"
    >
      <div class="px-4 py-3">
        <p class="text-sm font-medium text-gray-900">{{ user.name }}</p>
        <p class="text-sm text-gray-500 truncate">{{ user.email }}</p>
      </div>
      
      <div class="py-1">
        <router-link 
          to="/profile" 
          class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          @click="closeDropdown"
        >
          {{ languageStore.t('profile') }}
        </router-link>
        <router-link 
          to="/settings" 
          class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          @click="closeDropdown"
        >
          {{ languageStore.t('settings') }}
        </router-link>
      </div>
      
      <div class="py-1">
        <p class="px-4 py-2 text-xs font-medium text-gray-500">
          {{ languageStore.t('language') }}
        </p>
        <button 
          class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          :class="{ 'font-medium text-primary-600': languageStore.currentLanguage === 'en' }"
          @click="switchLanguage('en')"
        >
          {{ languageStore.t('english') }}
        </button>
        <button 
          class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          :class="{ 'font-medium text-primary-600': languageStore.currentLanguage === 'da' }"
          @click="switchLanguage('da')"
        >
          {{ languageStore.t('danish') }}
        </button>
      </div>
      
      <div class="py-1">
        <button 
          class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          @click="logout"
        >
          {{ languageStore.t('signOut') }}
        </button>
      </div>
    </div>
  </div>
</template>