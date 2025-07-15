<script setup lang="ts">
import { computed } from 'vue'
import { useLanguageStore } from '../../stores/languageStore'

interface Project {
  id: number;
  name: string;
  status: string;
  location: string;
  startDate: string;
  endDate: string;
  thumbnailUrl?: string;
}

const props = defineProps<{
  project: Project;
}>()

const languageStore = useLanguageStore()

// Status badge class and text
const statusInfo = computed(() => {
  switch (props.project.status) {
    case 'in-progress':
      return {
        class: 'bg-accent-100 text-accent-800',
        text: languageStore.t('inProgress')
      };
    case 'completed':
      return {
        class: 'bg-success-100 text-success-800',
        text: languageStore.t('completed')
      };
    case 'planned':
      return {
        class: 'bg-primary-100 text-primary-800',
        text: languageStore.t('planned')
      };
    default:
      return {
        class: 'bg-gray-100 text-gray-800',
        text: props.project.status
      };
  }
})

// Format date
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  })
}

// Default thumbnail
const defaultThumbnail = 'https://images.pexels.com/photos/1216589/pexels-photo-1216589.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
</script>

<template>
  <div 
    class="card h-full transition-all duration-200 hover:shadow-md cursor-pointer"
    @click="$emit('click')"
  >
    <!-- Project thumbnail -->
    <div class="h-40 w-full overflow-hidden">
      <img 
        :src="project.thumbnailUrl || defaultThumbnail" 
        :alt="project.name"
        class="w-full h-full object-cover object-center transition-transform duration-300 hover:scale-105"
      />
    </div>
    
    <!-- Project info -->
    <div class="p-4">
      <div class="flex items-center justify-between mb-2">
        <span 
          class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
          :class="statusInfo.class"
        >
          {{ statusInfo.text }}
        </span>
      </div>
      
      <h3 class="text-lg font-medium text-gray-900 mb-1 line-clamp-2">{{ project.name }}</h3>
      
      <p class="text-sm text-gray-600 mb-3 flex items-start">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1 mt-0.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span class="line-clamp-2">{{ project.location }}</span>
      </p>
      
      <div class="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-100 flex justify-between">
        <span>{{ languageStore.t('startDate') }}: {{ formatDate(project.startDate) }}</span>
        <span>{{ languageStore.t('endDate') }}: {{ formatDate(project.endDate) }}</span>
      </div>
    </div>
  </div>
</template>