<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AddCommentForm from '../../components/shared/AddCommentForm.vue'
import CommentList from '../../components/shared/CommentList.vue'

const route = useRoute()
const router = useRouter()
const projectId = computed(() => Number(route.params.id))
const isLoading = ref(true)
const activeTab = ref('details')

// Mock project data
const project = ref({
  id: 101,
  name: 'Nørrebro Apartment Complex Renovation',
  description: 'Complete renovation of a 5-story apartment building including electrical rewiring, plumbing upgrades, and structural improvements.',
  status: 'in-progress',
  location: 'Nørrebrogade 125, 2200 København N',
  startDate: '2023-06-15',
  endDate: '2023-12-20',
  customer: {
    id: 1,
    name: 'Jensen Construction A/S',
    contactPerson: 'Lars Jensen',
    email: 'lars@jensenconstruction.dk',
    phone: '+45 22 33 44 55'
  },
  employees: [
    { id: 1, name: 'Anders Jensen', role: 'Project Manager' },
    { id: 2, name: 'Mads Larsen', role: 'Electrician' }
  ],
  requirements: [
    { id: 1, title: 'Safety Equipment', description: 'Hard hat and safety shoes required at all times on site.' },
    { id: 2, title: 'Access', description: 'Building accessible through the side entrance on weekdays between 7:00-17:00.' },
    { id: 3, title: 'Noise Restrictions', description: 'No loud work before 8:00 or after 16:00 due to residential area regulations.' }
  ],
  images: [
    'https://images.pexels.com/photos/2219024/pexels-photo-2219024.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    'https://images.pexels.com/photos/4846097/pexels-photo-4846097.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    'https://images.pexels.com/photos/8134827/pexels-photo-8134827.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
  ]
})

// Mock comments data
const comments = ref([
  {
    id: 301,
    text: 'Inspection completed today. All electrical work is up to code and ready for the next phase.',
    author: {
      name: 'Mads Larsen',
      avatar: 'https://images.pexels.com/photos/2269872/pexels-photo-2269872.jpeg?auto=compress&cs=tinysrgb&w=100'
    },
    timestamp: '2023-10-05T14:25:00',
    attachments: [
      { name: 'inspection_report.pdf', type: 'pdf' }
    ]
  },
  {
    id: 302,
    text: 'New safety requirements have been posted at the entrance. Please make sure all team members are briefed before entering the site.',
    author: {
      name: 'Anders Jensen',
      avatar: 'https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?auto=compress&cs=tinysrgb&w=100'
    },
    timestamp: '2023-09-28T09:15:00',
    attachments: [
      { name: 'updated_safety_guidelines.pdf', type: 'pdf' }
    ]
  }
])

// Status badge class and text
const statusInfo = computed(() => {
  switch (project.value.status) {
    case 'in-progress':
      return {
        class: 'bg-accent-100 text-accent-800',
        text: 'In Progress'
      };
    case 'completed':
      return {
        class: 'bg-success-100 text-success-800',
        text: 'Completed'
      };
    case 'planned':
      return {
        class: 'bg-primary-100 text-primary-800',
        text: 'Planned'
      };
    default:
      return {
        class: 'bg-gray-100 text-gray-800',
        text: project.value.status
      };
  }
})

// Format date
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
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

// Navigate to customer detail
const viewCustomer = (customerId: number) => {
  router.push(`/customers/${customerId}`)
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
        @click="router.push('/projects')"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to locations
      </button>
      
      <div v-if="isLoading" class="animate-pulse">
        <div class="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div class="h-5 bg-gray-200 rounded w-1/3"></div>
      </div>
      
      <div v-else>
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 class="text-2xl font-semibold text-gray-900 mb-1">{{ project.name }}</h1>
            <div class="flex items-center">
              <span 
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mr-2"
                :class="statusInfo.class"
              >
                {{ statusInfo.text }}
              </span>
              <span class="text-sm text-gray-600">
                {{ formatDate(project.startDate) }} - {{ formatDate(project.endDate) }}
              </span>
            </div>
          </div>
          
          <div class="flex space-x-3">
            <button class="btn-secondary">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Edit
            </button>
            <button class="btn-primary">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Add Document
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Tabs -->
    <div class="border-b border-gray-200 mb-6">
      <nav class="-mb-px flex space-x-8">
        <button
          class="whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors"
          :class="activeTab === 'details' ? 'border-primary-600 text-primary-700' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
          @click="activeTab = 'details'"
        >
          Details
        </button>
        <button
          class="whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors"
          :class="activeTab === 'requirements' ? 'border-primary-600 text-primary-700' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
          @click="activeTab = 'requirements'"
        >
          Requirements
        </button>
        <button
          class="whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors"
          :class="activeTab === 'photos' ? 'border-primary-600 text-primary-700' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
          @click="activeTab = 'photos'"
        >
          Photos
        </button>
        <button
          class="whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors"
          :class="activeTab === 'activity' ? 'border-primary-600 text-primary-700' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
          @click="activeTab = 'activity'"
        >
          Activity
        </button>
      </nav>
    </div>
    
    <!-- Loading state -->
    <div v-if="isLoading" class="animate-pulse space-y-6">
      <div class="h-40 bg-gray-200 rounded"></div>
      <div class="space-y-2">
        <div class="h-4 bg-gray-200 rounded w-3/4"></div>
        <div class="h-4 bg-gray-200 rounded w-full"></div>
        <div class="h-4 bg-gray-200 rounded w-5/6"></div>
      </div>
    </div>
    
    <!-- Tab content -->
    <div v-else>
      <!-- Details tab -->
      <div v-if="activeTab === 'details'" class="animate-fade-in">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Location details -->
          <div class="card lg:col-span-2">
            <div class="border-b border-gray-200 px-6 py-4">
              <h3 class="text-lg font-medium text-gray-900">Location Details</h3>
            </div>
            
            <div class="px-6 py-4">
              <p class="text-gray-700 mb-4">{{ project.description }}</p>
              
              <div class="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <h4 class="text-sm font-medium text-gray-700 mb-1">Location</h4>
                  <p class="text-sm text-gray-900 flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1 mt-0.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {{ project.location }}
                  </p>
                </div>
                
                <div>
                  <h4 class="text-sm font-medium text-gray-700 mb-1">Timeframe</h4>
                  <p class="text-sm text-gray-900 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {{ formatDate(project.startDate) }} - {{ formatDate(project.endDate) }}
                  </p>
                </div>
                
                <div>
                  <h4 class="text-sm font-medium text-gray-700 mb-1">Status</h4>
                  <p class="text-sm text-gray-900">
                    <span 
                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                      :class="statusInfo.class"
                    >
                      {{ statusInfo.text }}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Customer info -->
          <div class="card">
            <div class="border-b border-gray-200 px-6 py-4">
              <h3 class="text-lg font-medium text-gray-900">Customer</h3>
            </div>
            
            <div class="px-6 py-4">
              <div class="flex justify-between items-start mb-4">
                <h4 class="text-lg font-medium text-gray-900">{{ project.customer.name }}</h4>
                <button 
                  class="text-sm text-primary-600 hover:text-primary-700"
                  @click="viewCustomer(project.customer.id)"
                >
                  View Profile
                </button>
              </div>
              
              <div class="space-y-3">
                <div>
                  <p class="text-sm font-medium text-gray-700">Contact Person</p>
                  <p class="text-sm text-gray-900">{{ project.customer.contactPerson }}</p>
                </div>
                
                <div>
                  <p class="text-sm font-medium text-gray-700">Email</p>
                  <p class="text-sm text-gray-900">{{ project.customer.email }}</p>
                </div>
                
                <div>
                  <p class="text-sm font-medium text-gray-700">Phone</p>
                  <p class="text-sm text-gray-900">{{ project.customer.phone }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Requirements tab -->
      <div v-else-if="activeTab === 'requirements'" class="animate-fade-in">
        <div class="card">
          <div class="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
            <h3 class="text-lg font-medium text-gray-900">Location Requirements</h3>
            <button class="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              Add Requirement
            </button>
          </div>
          
          <div class="divide-y divide-gray-200">
            <div 
              v-for="requirement in project.requirements" 
              :key="requirement.id"
              class="px-6 py-4"
            >
              <div class="flex justify-between items-start">
                <h4 class="text-lg font-medium text-gray-900">{{ requirement.title }}</h4>
                <div class="flex space-x-2">
                  <button class="text-gray-400 hover:text-gray-500 p-1">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button class="text-gray-400 hover:text-error-500 p-1">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <p class="mt-2 text-gray-700">{{ requirement.description }}</p>
            </div>
          </div>
        </div>
        
        <div class="mt-6">
          <AddCommentForm @submit="addComment" />
        </div>
      </div>
      
      <!-- Photos tab -->
      <div v-else-if="activeTab === 'photos'" class="animate-fade-in">
        <div class="card">
          <div class="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
            <h3 class="text-lg font-medium text-gray-900">Location Photos</h3>
            <button class="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Upload Photos
            </button>
          </div>
          
          <div class="p-6">
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div 
                v-for="(image, index) in project.images" 
                :key="index"
                class="group relative rounded-lg overflow-hidden h-48 shadow-sm border border-gray-200"
              >
                <img 
                  :src="image" 
                  :alt="`Location image ${index + 1}`"
                  class="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                />
                
                <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center">
                  <div class="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-2">
                    <button class="p-2 bg-white rounded-full text-gray-800 hover:text-primary-600">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                      </svg>
                    </button>
                    <button class="p-2 bg-white rounded-full text-gray-800 hover:text-error-600">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Activity tab -->
      <div v-else-if="activeTab === 'activity'" class="animate-fade-in">
        <div class="card">
          <div class="border-b border-gray-200 px-6 py-4">
            <h3 class="text-lg font-medium text-gray-900">Activity & Comments</h3>
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