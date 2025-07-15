<script setup lang="ts">
import { useLanguageStore } from '../../stores/languageStore'

const props = defineProps<{
  search: string;
  status: string;
  totalCount: number;
  filteredCount: number;
}>()

const languageStore = useLanguageStore()
const emit = defineEmits(['update:search', 'update:status'])

const updateSearch = (event: Event) => {
  emit('update:search', (event.target as HTMLInputElement).value)
}

const updateStatus = (event: Event) => {
  emit('update:status', (event.target as HTMLSelectElement).value)
}
</script>

<template>
  <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
    <div class="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
      <!-- Search input -->
      <div class="relative flex-1">
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          :value="search"
          @input="updateSearch"
          :placeholder="languageStore.t('searchCustomers')"
          class="input pl-10"
        />
      </div>
      
      <!-- Status filter -->
      <div class="w-full sm:w-48">
        <select
          :value="status"
          @change="updateStatus"
          class="input"
        >
          <option value="all">{{ languageStore.t('allStatuses') }}</option>
          <option value="active">{{ languageStore.t('active') }}</option>
          <option value="inactive">{{ languageStore.t('inactive') }}</option>
        </select>
      </div>
    </div>
    
    <!-- Results summary -->
    <div class="mt-3 text-sm text-gray-600">
      {{ languageStore.t('showingCustomers').replace('{filtered}', filteredCount.toString()).replace('{total}', totalCount.toString()) }}
    </div>
  </div>
</template>