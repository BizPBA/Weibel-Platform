<script setup lang="ts">
import { ref } from 'vue'
import { useLanguageStore } from '../../stores/languageStore'

const props = defineProps<{
  isLoading?: boolean;
}>()

const languageStore = useLanguageStore()

// Mock data for recent activities
const activities = ref([
  {
    id: 1,
    type: 'customer',
    action: 'created',
    subject: 'Jensen Construction A/S',
    user: {
      name: 'Mads Larsen',
      avatar: 'https://images.pexels.com/photos/2269872/pexels-photo-2269872.jpeg?auto=compress&cs=tinysrgb&w=100'
    },
    timestamp: '2 hours ago'
  },
  {
    id: 2,
    type: 'location',
    action: 'updated',
    subject: 'Nørrebro Building Renovation',
    user: {
      name: 'Lise Nielsen',
      avatar: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=100'
    },
    timestamp: '3 hours ago'
  },
  {
    id: 3,
    type: 'comment',
    action: 'added',
    subject: 'Safety equipment requirements',
    project: 'Copenhagen Housing Project',
    user: {
      name: 'Anders Jensen',
      avatar: 'https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?auto=compress&cs=tinysrgb&w=100'
    },
    timestamp: '5 hours ago'
  },
  {
    id: 4,
    type: 'document',
    action: 'uploaded',
    subject: 'Site inspection photos',
    project: 'Vesterbro Office Complex',
    user: {
      name: 'Sofie Pedersen',
      avatar: 'https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?auto=compress&cs=tinysrgb&w=100'
    },
    timestamp: 'Yesterday'
  },
  {
    id: 5,
    type: 'location',
    action: 'completed',
    subject: 'Amager Residential Plumbing',
    user: {
      name: 'Thomas Hansen',
      avatar: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=100'
    },
    timestamp: 'Yesterday'
  }
])

// Icon path for activity types
const getIconPath = (type: string) => {
  switch (type) {
    case 'customer':
      return 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z';
    case 'location':
      return 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4';
    case 'comment':
      return 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z';
    case 'document':
      return 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z';
    default:
      return 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
  }
}

// Background color for activity icons
const getIconBgColor = (type: string) => {
  const baseColor = '#AA8066'
  return `style="background-color: ${baseColor}15; color: ${baseColor}"`
}
</script>

<template>
  <div class="card">
    <div class="border-b border-gray-200 px-6 py-4">
      <h3 class="text-lg font-medium text-gray-900">{{ languageStore.t('recentActivity') }}</h3>
    </div>
    
    <div class="px-6 py-4">
      <div v-if="isLoading" class="animate-pulse space-y-4">
        <div v-for="i in 4" :key="i" class="flex space-x-4">
          <div class="h-10 w-10 rounded-full bg-gray-200"></div>
          <div class="flex-1 space-y-2 py-1">
            <div class="h-4 bg-gray-200 rounded w-3/4"></div>
            <div class="h-3 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
      
      <div v-else>
        <ul class="divide-y divide-gray-200">
          <li v-for="activity in activities" :key="activity.id" class="py-4 animate-fade-in">
            <div class="flex items-start">
              <div class="flex-shrink-0 mr-4 mt-1">
                <div 
                  class="h-10 w-10 rounded-full p-2" 
                  :v-html="getIconBgColor(activity.type)"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    class="h-6 w-6" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      stroke-linecap="round" 
                      stroke-linejoin="round" 
                      stroke-width="2" 
                      :d="getIconPath(activity.type)" 
                    />
                  </svg>
                </div>
              </div>
              
              <div class="min-w-0 flex-1">
                <div class="flex items-center justify-between">
                  <p class="text-sm font-medium text-gray-900 truncate">
                    <span class="font-semibold" :style="{ color: '#AA8066' }">{{ languageStore.t(activity.action) }}</span> 
                    {{ activity.type === 'comment' ? languageStore.t('comment') + ' ' + languageStore.t('on') : '' }}
                    <span class="font-semibold">{{ activity.subject }}</span>
                    <span v-if="activity.project">
                      {{ languageStore.t('in') }} {{ activity.project }}
                    </span>
                  </p>
                  <p class="ml-2 flex-shrink-0 text-xs text-gray-500">
                    {{ activity.timestamp }}
                  </p>
                </div>
                
                <div class="mt-1 flex items-center">
                  <img 
                    :src="activity.user.avatar" 
                    :alt="activity.user.name" 
                    class="h-5 w-5 rounded-full mr-1"
                  />
                  <span class="text-xs text-gray-700 truncate">
                    {{ activity.user.name }}
                  </span>
                </div>
              </div>
            </div>
          </li>
        </ul>
        
        <div class="mt-4 text-center">
          <button 
            class="text-sm font-medium transition-colors duration-150"
            :style="{ color: '#AA8066', '&:hover': { opacity: 0.85 } }"
          >
            {{ languageStore.t('viewAll') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>