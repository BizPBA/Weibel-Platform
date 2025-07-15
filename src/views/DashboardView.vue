<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useLanguageStore } from '../stores/languageStore'
import DashboardCard from '../components/dashboard/DashboardCard.vue'
import RecentActivityCard from '../components/dashboard/RecentActivityCard.vue'

const router = useRouter()
const languageStore = useLanguageStore()
const isLoading = ref(true)

// Mock data for dashboard statistics
const stats = ref([
  { title: 'activeCustomers', value: 84, change: 12, changeType: 'increase', icon: 'users' },
  { title: 'activeLocations', value: 36, change: 4, changeType: 'increase', icon: 'building' },
  { title: 'openWorkOrders', value: 15, change: 5, changeType: 'increase', icon: 'clipboard' }
])

// Simulate data loading
onMounted(() => {
  setTimeout(() => {
    isLoading.value = false
  }, 800)
})

// Navigation
const navigateToCustomers = () => {
  router.push('/customers')
}

const navigateToLocations = () => {
  router.push('/projects')
}
</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-semibold text-gray-900 mb-0">{{ languageStore.t('dashboard') }}</h1>
      <div class="flex space-x-3">
        <button 
          class="btn-secondary"
          @click="navigateToCustomers"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          {{ languageStore.t('viewCustomers') }}
        </button>
        <button 
          class="btn-primary"
          @click="navigateToLocations"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          {{ languageStore.t('viewLocations') }}
        </button>
      </div>
    </div>
    
    <!-- Stats cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      <DashboardCard
        v-for="(stat, index) in stats"
        :key="index"
        :title="stat.title"
        :value="stat.value"
        :change="stat.change"
        :change-type="stat.changeType"
        :icon="stat.icon"
        :is-loading="isLoading"
      />
    </div>
    
    <!-- Recent activity -->
    <RecentActivityCard :is-loading="isLoading" />
  </div>
</template>