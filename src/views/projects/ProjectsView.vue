<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useLanguageStore } from '../../stores/languageStore'
import CustomerFilterBar from '../../components/customers/CustomerFilterBar.vue'

const router = useRouter()
const languageStore = useLanguageStore()
const isLoading = ref(true)
const searchQuery = ref('')
const filterStatus = ref('all')
const currentPage = ref(1)
const itemsPerPage = 10

// Sorting
const sortBy = ref('name')
const sortDirection = ref<'asc' | 'desc'>('asc')

// Mock data for locations
const locationsData = ref([
  {
    id: 101,
    name: 'Nørrebro Building Renovation',
    status: 'in-progress',
    location: 'Nørrebrogade 125, 2200 København N',
    startDate: '2023-06-15',
    endDate: '2023-12-20',
    customer: 'Jensen Construction A/S',
    contactPerson: 'Lars Jensen',
    phone: '+45 22 33 44 55'
  },
  {
    id: 102,
    name: 'Office Building Electrical Upgrade',
    status: 'completed',
    location: 'Vester Farimagsgade 41, 1606 København',
    startDate: '2023-02-10',
    endDate: '2023-04-30',
    customer: 'Copenhagen Builders',
    contactPerson: 'Marie Hansen',
    phone: '+45 33 44 55 66'
  },
  {
    id: 103,
    name: 'Residential Plumbing Installation',
    status: 'planned',
    location: 'Østerbrogade 155, 2100 København Ø',
    startDate: '2024-01-10',
    endDate: '2024-03-15',
    customer: 'Amager Housing Cooperative',
    contactPerson: 'Sofie Pedersen',
    phone: '+45 55 66 77 88'
  },
  {
    id: 104,
    name: 'Østerbro Commercial Complex',
    status: 'in-progress',
    location: 'Østerbrogade 120, 2100 København Ø',
    startDate: '2023-09-01',
    endDate: '2024-06-30',
    customer: 'Østerbro Enterprises',
    contactPerson: 'Sofia Andersen',
    phone: '+45 55 66 77 88'
  },
  {
    id: 105,
    name: 'Amager Shopping Center Renovation',
    status: 'planned',
    location: 'Amagerbrogade 200, 2300 København S',
    startDate: '2024-03-15',
    endDate: '2024-12-31',
    customer: 'Amager Construction Group',
    contactPerson: 'Thomas Nielsen',
    phone: '+45 66 77 88 99'
  },
  {
    id: 106,
    name: 'Nordvest Residential Complex',
    status: 'in-progress',
    location: 'Frederikssundsvej 150, 2400 København NV',
    startDate: '2023-07-01',
    endDate: '2024-04-30',
    customer: 'Nordvest Development',
    contactPerson: 'Michael Berg',
    phone: '+45 88 99 00 11'
  },
  {
    id: 107,
    name: 'Sydhavn Office Tower',
    status: 'planned',
    location: 'Sydhavns Plads 10, 2450 København SV',
    startDate: '2024-02-01',
    endDate: '2025-03-31',
    customer: 'Sydhavn Construction',
    contactPerson: 'Emma Larsen',
    phone: '+45 99 00 11 22'
  },
  {
    id: 108,
    name: 'Islands Brygge Waterfront',
    status: 'completed',
    location: 'Islands Brygge 50, 2300 København S',
    startDate: '2023-01-15',
    endDate: '2023-11-30',
    customer: 'Islands Brygge Projects',
    contactPerson: 'Oliver Hansen',
    phone: '+45 00 11 22 33'
  },
  {
    id: 109,
    name: 'Vesterbro Cultural Center',
    status: 'in-progress',
    location: 'Vesterbrogade 150, 1620 København V',
    startDate: '2023-08-15',
    endDate: '2024-05-31',
    customer: 'Vesterbro Renovation',
    contactPerson: 'Isabella Møller',
    phone: '+45 11 22 33 44'
  },
  {
    id: 110,
    name: 'Nørrebro Community Hub',
    status: 'planned',
    location: 'Nørrebrogade 250, 2200 København N',
    startDate: '2024-04-01',
    endDate: '2025-02-28',
    customer: 'Nørrebro Housing',
    contactPerson: 'William Thomsen',
    phone: '+45 22 33 44 55'
  },
  {
    id: 111,
    name: 'Christianshavn Canal Houses',
    status: 'in-progress',
    location: 'Torvegade 80, 1400 København K',
    startDate: '2023-10-01',
    endDate: '2024-08-31',
    customer: 'Christianshavn Builders',
    contactPerson: 'Victoria Poulsen',
    phone: '+45 33 44 55 66'
  },
  {
    id: 112,
    name: 'Copenhagen Metro Extension',
    status: 'planned',
    location: 'Multiple Locations, Copenhagen',
    startDate: '2024-05-01',
    endDate: '2025-12-31',
    customer: 'Copenhagen Builders',
    contactPerson: 'Marie Hansen',
    phone: '+45 33 44 55 66'
  }
])

// Handle sorting
const toggleSort = (field: string) => {
  if (sortBy.value === field) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortBy.value = field
    sortDirection.value = 'asc'
  }
}

const getSortIcon = (field: string) => {
  if (sortBy.value !== field) return '↕'
  return sortDirection.value === 'asc' ? '↑' : '↓'
}

// Filter, sort and search locations
const filteredLocations = computed(() => {
  let result = [...locationsData.value]

  // Filter by status if not set to 'all'
  if (filterStatus.value !== 'all') {
    result = result.filter(location => location.status === filterStatus.value)
  }

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(location => 
      location.name.toLowerCase().includes(query) || 
      location.location.toLowerCase().includes(query) ||
      location.customer.toLowerCase().includes(query)
    )
  }

  // Sort results
  result.sort((a, b) => {
    let compareA, compareB

    switch (sortBy.value) {
      case 'name':
        compareA = a.name
        compareB = b.name
        break
      case 'location':
        compareA = a.location
        compareB = b.location
        break
      case 'customer':
        compareA = a.customer
        compareB = b.customer
        break
      case 'status':
        compareA = a.status
        compareB = b.status
        break
      case 'date':
        compareA = new Date(a.startDate).getTime()
        compareB = new Date(b.startDate).getTime()
        break
      default:
        compareA = a.name
        compareB = b.name
    }

    if (sortDirection.value === 'asc') {
      return compareA > compareB ? 1 : -1
    } else {
      return compareA < compareB ? 1 : -1
    }
  })

  return result
})

// Paginate locations
const paginatedLocations = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredLocations.value.slice(start, end)
})

// Calculate total pages
const totalPages = computed(() => 
  Math.ceil(filteredLocations.value.length / itemsPerPage)
)

// Navigate to location detail page
const viewLocation = (id: number) => {
  router.push(`/projects/${id}`)
}

// Create a new location
const createLocation = () => {
  router.push('/projects/create')
}

// Handle page change
const changePage = (page: number) => {
  currentPage.value = page
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
setTimeout(() => {
  isLoading.value = false
}, 800)
</script>

<template>
  <div>
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
      <h1 class="text-2xl font-semibold text-gray-900 mb-4 sm:mb-0">{{ languageStore.t('locations') }}</h1>
      
      <button 
        class="btn-primary"
        @click="createLocation"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        {{ languageStore.t('addNewLocation') }}
      </button>
    </div>
    
    <!-- Filter and search bar -->
    <CustomerFilterBar 
      v-model:search="searchQuery"
      v-model:status="filterStatus"
      :total-count="locationsData.length"
      :filtered-count="filteredLocations.length"
    />
    
    <!-- Locations table -->
    <div class="card mt-6">
      <div class="border-b border-gray-200 px-6 py-4">
        <h3 class="text-lg font-medium text-gray-900">{{ languageStore.t('locations') }}</h3>
      </div>
      
      <div v-if="isLoading" class="px-6 py-4 animate-pulse space-y-6">
        <div v-for="i in 3" :key="i" class="space-y-3">
          <div class="h-4 bg-gray-200 rounded w-3/4"></div>
          <div class="h-4 bg-gray-200 rounded w-1/2"></div>
          <div class="h-4 bg-gray-200 rounded w-1/4"></div>
        </div>
      </div>
      
      <div v-else-if="filteredLocations.length === 0" class="px-6 py-12 text-center">
        <svg
          class="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        </svg>
        <h3 class="mt-2 text-lg font-medium text-gray-900">{{ languageStore.t('noLocationsFound') }}</h3>
        <p class="mt-1 text-sm text-gray-500">
          {{ languageStore.t('adjustSearch') }}
        </p>
        <div class="mt-6">
          <button 
            class="btn-secondary"
            @click="searchQuery = ''; filterStatus = 'all';"
          >
            {{ languageStore.t('clearFilters') }}
          </button>
        </div>
      </div>
      
      <div v-else>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th 
                  scope="col" 
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  @click="toggleSort('name')"
                >
                  <div class="flex items-center space-x-1">
                    <span>{{ languageStore.t('locationName') }}</span>
                    <span class="text-gray-400">{{ getSortIcon('name') }}</span>
                  </div>
                </th>
                <th 
                  scope="col" 
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  @click="toggleSort('location')"
                >
                  <div class="flex items-center space-x-1">
                    <span>{{ languageStore.t('address') }}</span>
                    <span class="text-gray-400">{{ getSortIcon('location') }}</span>
                  </div>
                </th>
                <th 
                  scope="col" 
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  @click="toggleSort('customer')"
                >
                  <div class="flex items-center space-x-1">
                    <span>{{ languageStore.t('customer') }}</span>
                    <span class="text-gray-400">{{ getSortIcon('customer') }}</span>
                  </div>
                </th>
                <th 
                  scope="col" 
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  @click="toggleSort('status')"
                >
                  <div class="flex items-center space-x-1">
                    <span>{{ languageStore.t('status') }}</span>
                    <span class="text-gray-400">{{ getSortIcon('status') }}</span>
                  </div>
                </th>
                <th 
                  scope="col" 
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  @click="toggleSort('date')"
                >
                  <div class="flex items-center space-x-1">
                    <span>{{ languageStore.t('dates') }}</span>
                    <span class="text-gray-400">{{ getSortIcon('date') }}</span>
                  </div>
                </th>
                <th scope="col" class="relative px-6 py-3 w-[120px]">
                  <span class="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="location in paginatedLocations" :key="location.id" class="hover:bg-gray-50">
                <td class="px-6 py-4">
                  <div class="text-sm font-medium text-gray-900">{{ location.name }}</div>
                </td>
                <td class="px-6 py-4">
                  <div class="text-sm text-gray-900">{{ location.location }}</div>
                </td>
                <td class="px-6 py-4">
                  <div class="text-sm text-gray-900">{{ location.customer }}</div>
                  <div class="text-sm text-gray-500">
                    {{ location.contactPerson }} • {{ location.phone }}
                  </div>
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

        <!-- Pagination -->
        <div class="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div class="text-sm text-gray-700">
            Showing {{ (currentPage - 1) * itemsPerPage + 1 }} to {{ Math.min(currentPage * itemsPerPage, filteredLocations.length) }} of {{ filteredLocations.length }} locations
          </div>
          <div class="flex space-x-2">
            <button
              v-for="page in totalPages"
              :key="page"
              class="px-3 py-1 rounded text-sm font-medium"
              :class="page === currentPage ? 'bg-primary-600 text-white' : 'text-gray-700 hover:bg-gray-100'"
              @click="changePage(page)"
            >
              {{ page }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>