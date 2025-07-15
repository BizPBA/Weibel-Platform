<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useLanguageStore } from '../../stores/languageStore'
import CustomerListItem from '../../components/customers/CustomerListItem.vue'
import CustomerFilterBar from '../../components/customers/CustomerFilterBar.vue'

const router = useRouter()
const languageStore = useLanguageStore()
const isLoading = ref(true)
const searchQuery = ref('')
const filterStatus = ref('all')
const currentPage = ref(1)
const itemsPerPage = 10

// Mock data for customers
const customersData = ref([
  {
    id: 1,
    name: 'Jensen Construction A/S',
    contactPerson: 'Lars Jensen',
    email: 'lars@jensenconstruction.dk',
    phone: '+45 22 33 44 55',
    address: 'Nørrebrogade 120, 2200 København N',
    status: 'active',
    employees: ['Anders Jensen', 'Mads Larsen'],
    projectCount: 4
  },
  {
    id: 2,
    name: 'Copenhagen Builders',
    contactPerson: 'Marie Hansen',
    email: 'marie@copenhagenbuilders.dk',
    phone: '+45 33 44 55 66',
    address: 'Vesterbrogade 45, 1620 København V',
    status: 'active',
    employees: ['Lise Nielsen'],
    projectCount: 2
  },
  {
    id: 3,
    name: 'Frederiksberg Development',
    contactPerson: 'Peter Madsen',
    email: 'peter@frederiksbergdev.dk',
    phone: '+45 44 55 66 77',
    address: 'Gammel Kongevej 88, 1850 Frederiksberg C',
    status: 'inactive',
    employees: ['Anders Jensen', 'Thomas Hansen'],
    projectCount: 0
  },
  {
    id: 4,
    name: 'Østerbro Enterprises',
    contactPerson: 'Sofia Andersen',
    email: 'sofia@oesterbro.dk',
    phone: '+45 55 66 77 88',
    address: 'Østerbrogade 76, 2100 København Ø',
    status: 'active',
    employees: ['Mads Larsen', 'Emma Nielsen'],
    projectCount: 3
  },
  {
    id: 5,
    name: 'Amager Construction Group',
    contactPerson: 'Thomas Nielsen',
    email: 'thomas@amagergroup.dk',
    phone: '+45 66 77 88 99',
    address: 'Amagerbrogade 150, 2300 København S',
    status: 'active',
    employees: ['Lars Jensen'],
    projectCount: 2
  },
  {
    id: 6,
    name: 'Valby Builders Co.',
    contactPerson: 'Anna Petersen',
    email: 'anna@valbybuilders.dk',
    phone: '+45 77 88 99 00',
    address: 'Valby Langgade 25, 2500 Valby',
    status: 'inactive',
    employees: ['Peter Hansen'],
    projectCount: 0
  },
  {
    id: 7,
    name: 'Nordvest Development',
    contactPerson: 'Michael Berg',
    email: 'michael@nordvest.dk',
    phone: '+45 88 99 00 11',
    address: 'Frederikssundsvej 88, 2400 København NV',
    status: 'active',
    employees: ['Sofia Jensen', 'Lars Nielsen'],
    projectCount: 5
  },
  {
    id: 8,
    name: 'Sydhavn Construction',
    contactPerson: 'Emma Larsen',
    email: 'emma@sydhavn.dk',
    phone: '+45 99 00 11 22',
    address: 'Sydhavns Plads 4, 2450 København SV',
    status: 'active',
    employees: ['Thomas Hansen'],
    projectCount: 2
  },
  {
    id: 9,
    name: 'Islands Brygge Projects',
    contactPerson: 'Oliver Hansen',
    email: 'oliver@islandsbrygge.dk',
    phone: '+45 00 11 22 33',
    address: 'Islands Brygge 32, 2300 København S',
    status: 'inactive',
    employees: ['Anna Jensen'],
    projectCount: 1
  },
  {
    id: 10,
    name: 'Vesterbro Renovation',
    contactPerson: 'Isabella Møller',
    email: 'isabella@vesterbro.dk',
    phone: '+45 11 22 33 44',
    address: 'Vesterbrogade 120, 1620 København V',
    status: 'active',
    employees: ['Michael Nielsen'],
    projectCount: 3
  },
  {
    id: 11,
    name: 'Nørrebro Housing',
    contactPerson: 'William Thomsen',
    email: 'william@norrebrohousing.dk',
    phone: '+45 22 33 44 55',
    address: 'Nørrebrogade 200, 2200 København N',
    status: 'active',
    employees: ['Sofia Andersen', 'Lars Jensen'],
    projectCount: 4
  },
  {
    id: 12,
    name: 'Christianshavn Builders',
    contactPerson: 'Victoria Poulsen',
    email: 'victoria@christianshavn.dk',
    phone: '+45 33 44 55 66',
    address: 'Torvegade 45, 1400 København K',
    status: 'active',
    employees: ['Thomas Nielsen'],
    projectCount: 2
  }
])

// Sort and filter customers
const filteredCustomers = computed(() => {
  let result = [...customersData.value]

  // Sort by status (active first)
  result.sort((a, b) => {
    if (a.status === 'active' && b.status !== 'active') return -1
    if (a.status !== 'active' && b.status === 'active') return 1
    return a.name.localeCompare(b.name)
  })

  // Filter by status if not set to 'all'
  if (filterStatus.value !== 'all') {
    result = result.filter(customer => customer.status === filterStatus.value)
  }

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(customer => 
      customer.name.toLowerCase().includes(query) || 
      customer.contactPerson.toLowerCase().includes(query) ||
      customer.email.toLowerCase().includes(query) ||
      customer.address.toLowerCase().includes(query)
    )
  }

  return result
})

// Paginate customers
const paginatedCustomers = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredCustomers.value.slice(start, end)
})

// Calculate total pages
const totalPages = computed(() => 
  Math.ceil(filteredCustomers.value.length / itemsPerPage)
)

// Navigate to customer detail page
const viewCustomer = (id: number) => {
  router.push(`/customers/${id}`)
}

// Create a new customer
const createCustomer = () => {
  router.push('/customers/create')
}

// Handle page change
const changePage = (page: number) => {
  currentPage.value = page
}

// Simulate data loading
setTimeout(() => {
  isLoading.value = false
}, 800)
</script>

<template>
  <div>
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
      <h1 class="text-2xl font-semibold text-gray-900 mb-4 sm:mb-0">{{ languageStore.t('customers') }}</h1>
      
      <button 
        class="btn-primary"
        @click="createCustomer"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        {{ languageStore.t('addNewCustomer') }}
      </button>
    </div>
    
    <!-- Filter and search bar -->
    <CustomerFilterBar 
      v-model:search="searchQuery"
      v-model:status="filterStatus"
      :total-count="customersData.length"
      :filtered-count="filteredCustomers.length"
    />
    
    <!-- Customer list -->
    <div class="card mt-6">
      <div class="border-b border-gray-200 px-6 py-4">
        <h3 class="text-lg font-medium text-gray-900">{{ languageStore.t('customers') }}</h3>
      </div>
      
      <div v-if="isLoading" class="px-6 py-4 animate-pulse space-y-6">
        <div v-for="i in 5" :key="i" class="flex flex-col space-y-3">
          <div class="h-5 bg-gray-200 rounded w-1/3"></div>
          <div class="flex space-x-4">
            <div class="h-4 bg-gray-200 rounded w-1/4"></div>
            <div class="h-4 bg-gray-200 rounded w-1/4"></div>
          </div>
          <div class="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
        </div>
      </div>
      
      <div v-else-if="filteredCustomers.length === 0" class="px-6 py-12 text-center">
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
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
        <h3 class="mt-2 text-lg font-medium text-gray-900">{{ languageStore.t('noCustomersFound') }}</h3>
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
        <ul class="divide-y divide-gray-200">
          <li v-for="customer in paginatedCustomers" :key="customer.id" class="animate-fade-in">
            <CustomerListItem 
              :customer="customer"
              @view="viewCustomer(customer.id)"
            />
          </li>
        </ul>

        <!-- Pagination -->
        <div class="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div class="text-sm text-gray-700">
            Showing {{ (currentPage - 1) * itemsPerPage + 1 }} to {{ Math.min(currentPage * itemsPerPage, filteredCustomers.length) }} of {{ filteredCustomers.length }} customers
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