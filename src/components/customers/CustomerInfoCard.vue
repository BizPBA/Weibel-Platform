<script setup lang="ts">
import { useLanguageStore } from '../../stores/languageStore'

interface Customer {
  id: number;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  status: string;
  employees: string[];
  notes?: string;
  createdAt: string;
}

const props = defineProps<{
  customer: Customer;
}>()

const languageStore = useLanguageStore()
</script>

<template>
  <div class="card">
    <div class="border-b border-gray-200 px-6 py-4">
      <h3 class="text-lg font-medium text-gray-900">{{ languageStore.t('customerInformation') }}</h3>
    </div>
    
    <div class="px-6 py-4">
      <div class="space-y-4">
        <!-- Status badge -->
        <div>
          <span 
            v-if="customer.status === 'active'" 
            class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800"
          >
            {{ languageStore.t('active') }}
          </span>
          <span 
            v-else 
            class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
          >
            {{ languageStore.t('inactive') }}
          </span>
        </div>
        
        <!-- Contact person -->
        <div>
          <p class="text-sm font-medium text-gray-700">{{ languageStore.t('contactPerson') }}</p>
          <p class="mt-1 text-sm text-gray-900">{{ customer.contactPerson }}</p>
        </div>
        
        <!-- Contact information -->
        <div>
          <p class="text-sm font-medium text-gray-700">{{ languageStore.t('contactInformation') }}</p>
          <div class="mt-1 space-y-1">
            <p class="text-sm text-gray-900 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              {{ customer.email }}
            </p>
            <p class="text-sm text-gray-900 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              {{ customer.phone }}
            </p>
          </div>
        </div>
        
        <!-- Address -->
        <div>
          <p class="text-sm font-medium text-gray-700">{{ languageStore.t('address') }}</p>
          <p class="mt-1 text-sm text-gray-900">{{ customer.address }}</p>
        </div>
        
        <!-- Responsible employees -->
        <div>
          <p class="text-sm font-medium text-gray-700">{{ languageStore.t('responsibleEmployees') }}</p>
          <div class="mt-1 flex flex-wrap gap-2">
            <span 
              v-for="(employee, index) in customer.employees" 
              :key="index"
              class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-800"
            >
              {{ employee }}
            </span>
            <button class="text-xs text-primary-600 hover:text-primary-800 ml-1">
              + {{ languageStore.t('addEmployee') }}
            </button>
          </div>
        </div>
        
        <!-- Notes -->
        <div v-if="customer.notes">
          <p class="text-sm font-medium text-gray-700">{{ languageStore.t('notes') }}</p>
          <p class="mt-1 text-sm text-gray-900">{{ customer.notes }}</p>
        </div>
      </div>
    </div>
  </div>
</template>