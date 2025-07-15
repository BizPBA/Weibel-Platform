<script setup lang="ts">
import { defineProps, defineEmits } from 'vue'
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
  projectCount: number;
}

const props = defineProps<{
  customer: Customer;
}>()

const languageStore = useLanguageStore()
const emit = defineEmits(['view', 'edit', 'delete'])
</script>

<template>
  <div class="px-6 py-4 hover:bg-gray-50 transition-colors duration-150">
    <div class="flex flex-col md:flex-row md:items-center md:justify-between">
      <div class="flex-1">
        <div class="flex items-center">
          <h4 class="text-lg font-medium text-gray-900">{{ customer.name }}</h4>
          <span 
            v-if="customer.status === 'active'" 
            class="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800"
          >
            {{ languageStore.t('active') }}
          </span>
          <span 
            v-else 
            class="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
          >
            {{ languageStore.t('inactive') }}
          </span>
        </div>
        
        <div class="mt-2 flex flex-col sm:flex-row sm:items-center text-sm text-gray-600">
          <div class="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            {{ customer.contactPerson }}
          </div>
          <span class="hidden sm:inline mx-2">•</span>
          <div class="flex items-center mt-1 sm:mt-0">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            {{ customer.email }}
          </div>
          <span class="hidden sm:inline mx-2">•</span>
          <div class="flex items-center mt-1 sm:mt-0">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            {{ customer.phone }}
          </div>
        </div>
        
        <div class="mt-2 text-sm text-gray-500 flex items-start">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1 mt-0.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {{ customer.address }}
        </div>
        
        <div class="mt-2 text-sm flex flex-wrap gap-2">
          <span class="text-gray-600">{{ languageStore.t('responsibleEmployees') }}:</span>
          <span 
            v-for="(employee, index) in customer.employees" 
            :key="index"
            class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-800"
          >
            {{ employee }}
          </span>
        </div>
      </div>
      
      <div class="flex items-center mt-4 md:mt-0">
        <span class="mr-4 text-sm text-gray-600">
          {{ customer.projectCount }} {{ customer.projectCount === 1 ? languageStore.t('location') : languageStore.t('locations') }}
        </span>
        
        <div class="flex space-x-2">
          <button 
            class="btn-secondary"
            @click="$emit('view', customer.id)"
          >
            {{ languageStore.t('viewDetails') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>