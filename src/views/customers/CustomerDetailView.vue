<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLanguageStore } from '../../stores/languageStore'
import CustomerInfoCard from '../../components/customers/CustomerInfoCard.vue'
import AddCommentForm from '../../components/shared/AddCommentForm.vue'
import CommentList from '../../components/shared/CommentList.vue'

const route = useRoute()
const router = useRouter()
const languageStore = useLanguageStore()
const customerId = computed(() => Number(route.params.id))
const isLoading = ref(true)

// Mock customer data
const customer = ref({
  id: 1,
  name: 'Jensen Construction A/S',
  contactPerson: 'Lars Jensen',
  email: 'lars@jensenconstruction.dk',
  phone: '+45 22 33 44 55',
  address: 'Nørrebrogade 120, 2200 København N',
  status: 'active',
  employees: ['Anders Jensen', 'Mads Larsen'],
  notes: 'Large construction company specializing in residential buildings. Has been a client for 5+ years.',
  createdAt: '2020-05-12'
})

// Mock locations data
const locations = ref([
  {
    id: 101,
    name: 'Nørrebro Building Renovation',
    status: 'in-progress',
    location: 'Nørrebrogade 125, 2200 København N',
    startDate: '2023-06-15',
    endDate: '2023-12-20'
  },
  {
    id: 102,
    name: 'Office Building Electrical Upgrade',
    status: 'completed',
    location: 'Vester Farimagsgade 41, 1606 København',
    startDate: '2023-02-10',
    endDate: '2023-04-30'
  },
  {
    id: 103,
    name: 'Residential Plumbing Installation',
    status: 'planned',
    location: 'Østerbrogade 155, 2100 København Ø',
    startDate: '2024-01-10',
    endDate: '2024-03-15'
  }
])

// Mock comments data
const comments = ref([
  {
    id: 201,
    text: 'Client requested an update on the Nørrebro project timeline. I\'ve scheduled a meeting for next Tuesday.',
    author: {
      name: 'Anders Jensen',
      avatar: 'https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?auto=compress&cs=tinysrgb&w=100'
    },
    timestamp: '2023-10-05T14:25:00',
    attachments: []
  },
  {
    id: 202,
    text: 'Budget adjustment approved for the Office Building project. New documentation has been uploaded to the shared folder.',
    author: {
      name: 'Mads Larsen',
      avatar: 'https://images.pexels.com/photos/2269872/pexels-photo-2269872.jpeg?auto=compress&cs=tinysrgb&w=100'
    },
    timestamp: '2023-09-28T09:15:00',
    attachments: [
      { name: 'budget_approval.pdf', type: 'pdf' }
    ]
  }
])

// Handler for creating a new location
const createNewLocation = () => {
  router.push('/projects/create')
}

// Handler for adding a comment
const addComment = (data: any) => {
  const newComment = {
    id: Date.now(),
    text: data.text,
    author: {
      name: 'Anders Jensen',
      avatar: 'https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?auto=compress&cs=tinysrgb&w=100'
    },
    timestamp: new Date().toISOString(),
    attachments: data.attachments || []
  }
  
  comments.value.unshift(newComment)
}

// Navigate to a location
const viewLocation = (locationId: number) => {
  router.push(`/projects/${locationId}`)
}

// Get status badge class
const getStatusClass = (status: string) => {
  switch (status) {
    case 'in-progress':
      return 'bg-accent-100 text-accent-800'
    case 'completed':
      return 'bg-success-100 text-success-800'
    case 'planned':
      return 'bg-primary-100 text-primary-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

// Format date
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString()
}

// Simulate data loading
onMounted(() => {
  setTimeout(() => {
    isLoading.value = false
  }, 800)
})
</script>

<template>
  <div>
    <!-- Header with back button -->
    <div class="mb-6">
      <button 
        class="flex items-center text-sm text-primary-600 hover:text-primary-700 mb-4"
        @click="router.push('/customers')"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        {{ languageStore.t('back') }}
      </button>
      
      <div v-if="isLoading" class="animate-pulse">
        <div class="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
        <div class="h-4 bg-gray-200 rounded w-1/4"></div>
      </div>
      
      <div v-else class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl font-semibold text-gray-900 mb-1">{{ customer.name }}</h1>
          <p class="text-sm text-gray-600">{{ languageStore.t('customerSince') }} {{ new Date(customer.createdAt).toLocaleDateString() }}</p>
        </div>
        
        <div class="mt-4 sm:mt-0 flex space-x-3">
          <button class="btn-secondary">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            {{ languageStore.t('edit') }}
          </button>
          <button class="btn-primary" @click="createNewLocation">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            {{ languageStore.t('addNewLocation') }}
          </button>
        </div>
      </div>
    </div>
    
    <!-- Main content -->
    <div v-if="isLoading" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-1 animate-pulse">
        <div class="bg-white rounded-lg shadow-sm h-64 p-6 space-y-4">
          <div class="h-5 bg-gray-200 rounded w-1/3"></div>
          <div class="space-y-2">
            <div class="h-4 bg-gray-200 rounded w-full"></div>
            <div class="h-4 bg-gray-200 rounded w-full"></div>
            <div class="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
      
      <div class="lg:col-span-2 animate-pulse">
        <div class="bg-white rounded-lg shadow-sm h-64 p-6 space-y-4">
          <div class="h-5 bg-gray-200 rounded w-1/3"></div>
          <div class="space-y-6">
            <div class="h-24 bg-gray-200 rounded w-full"></div>
            <div class="h-24 bg-gray-200 rounded w-full"></div>
          </div>
        </div>
      </div>
    </div>
    
    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Customer info card -->
      <div class="lg:col-span-1">
        <CustomerInfoCard :customer="customer" />
      </div>
      
      <div class="lg:col-span-2 space-y-6">
        <!-- Locations section -->
        <div class="card">
          <div class="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
            <h3 class="text-lg font-medium text-gray-900">{{ languageStore.t('locations') }}</h3>
            <button 
              class="text-sm text-[#AA8066] hover:text-[#997366] font-medium flex items-center"
              @click="createNewLocation"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              {{ languageStore.t('addNewLocation') }}
            </button>
          </div>
          
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {{ languageStore.t('locationName') }}
                  </th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {{ languageStore.t('address') }}
                  </th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {{ languageStore.t('status') }}
                  </th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {{ languageStore.t('dates') }}
                  </th>
                  <th scope="col" class="relative px-6 py-3 w-[120px]">
                    <span class="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="location in locations" :key="location.id" class="hover:bg-gray-50">
                  <td class="px-6 py-4">
                    <div class="text-sm font-medium text-gray-900">{{ location.name }}</div>
                  </td>
                  <td class="px-6 py-4">
                    <div class="text-sm text-gray-900">{{ location.location }}</div>
                  </td>
                  <td class="px-6 py-4">
                    <span 
                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                      :class="getStatusClass(location.status)"
                    >
                      {{ languageStore.t(location.status === 'in-progress' ? 'inProgress' : location.status) }}
                    </span>
                  </td>
                  <td class="px-6 py-4">
                    <div class="text-sm text-gray-900">
                      {{ formatDate(location.startDate) }} - {{ formatDate(location.endDate) }}
                    </div>
                  </td>
                  <td class="px-6 py-4 text-right whitespace-nowrap w-[120px]">
                    <button 
                      class="text-[#AA8066] hover:text-[#997366] font-medium text-sm"
                      @click="viewLocation(location.id)"
                    >
                      {{ languageStore.t('viewDetails') }}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        <!-- Comments section -->
        <div class="card">
          <div class="border-b border-gray-200 px-6 py-4">
            <h3 class="text-lg font-medium text-gray-900">{{ languageStore.t('activityAndComments') }}</h3>
          </div>
          
          <div class="px-6 py-4">
            <AddCommentForm @submit="addComment" />
            
            <div class="mt-6">
              <CommentList :comments="comments" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>