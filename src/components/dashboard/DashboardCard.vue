<script setup lang="ts">
import { computed } from 'vue'
import { useLanguageStore } from '../../stores/languageStore'

const props = defineProps<{
  title: string;
  value: number;
  change?: number;
  changeType?: 'increase' | 'decrease';
  icon?: string;
  isLoading?: boolean;
}>()

const languageStore = useLanguageStore()

// Compute the icon path based on the icon name
const iconPath = computed(() => {
  switch (props.icon) {
    case 'users':
      return 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z';
    case 'building':
      return 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4';
    case 'clock':
      return 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z';
    case 'clipboard':
      return 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2';
    default:
      return 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
  }
})

// Compute color classes based on change type
const changeColorClass = computed(() => {
  return props.changeType === 'increase' 
    ? 'text-success-600' 
    : 'text-error-600';
})

// Compute change icon based on change type
const changeIconPath = computed(() => {
  return props.changeType === 'increase'
    ? 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6'
    : 'M13 17h8m0 0V9m0 8l-8-8-4 4-6-6';
})
</script>

<template>
  <div class="card p-6 transition-all duration-300">
    <div v-if="isLoading" class="animate-pulse flex flex-col">
      <div class="h-5 bg-gray-200 rounded w-1/2 mb-4"></div>
      <div class="h-8 bg-gray-300 rounded w-1/3 mb-2"></div>
      <div class="h-4 bg-gray-200 rounded w-2/3"></div>
    </div>
    
    <div v-else>
      <div class="flex items-center justify-between mb-2">
        <h3 class="text-lg font-medium text-gray-700">{{ languageStore.t(title) }}</h3>
        <div class="p-2 rounded-lg bg-primary-50">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            class="h-6 w-6 text-primary-600" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="iconPath" />
          </svg>
        </div>
      </div>
      
      <div class="flex items-baseline">
        <p class="text-2xl font-semibold text-gray-900">{{ value }}</p>
        <span v-if="change" class="ml-2 flex items-center text-sm font-medium" :class="changeColorClass">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            class="h-3 w-3 mr-1" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="changeIconPath" />
          </svg>
          {{ change }}%
        </span>
      </div>
      
      <p class="text-sm text-gray-500 mt-1">{{ languageStore.t('comparedToLastMonth') }}</p>
    </div>
  </div>
</template>