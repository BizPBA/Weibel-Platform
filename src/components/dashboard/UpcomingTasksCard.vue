<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  isLoading?: boolean;
}>()

// Mock data for upcoming tasks
const tasks = ref([
  {
    id: 1,
    title: 'Site inspection',
    project: 'Nørrebro Building Renovation',
    dueDate: 'Today',
    priority: 'high'
  },
  {
    id: 2,
    title: 'Material order approval',
    project: 'Vesterbro Office Complex',
    dueDate: 'Tomorrow',
    priority: 'medium'
  },
  {
    id: 3,
    title: 'Safety document review',
    project: 'Copenhagen Housing Project',
    dueDate: 'Wednesday',
    priority: 'high'
  },
  {
    id: 4,
    title: 'Client meeting',
    project: 'Amager Residential Plumbing',
    dueDate: 'Thursday',
    priority: 'medium'
  },
  {
    id: 5,
    title: 'Electrical inspection',
    project: 'Frederiksberg Restaurant',
    dueDate: 'Friday',
    priority: 'low'
  }
])

// Get priority color class based on priority level
const getPriorityClass = (priority: string) => {
  switch (priority) {
    case 'high':
      return 'bg-error-100 text-error-800';
    case 'medium':
      return 'bg-warning-100 text-warning-800';
    case 'low':
      return 'bg-success-100 text-success-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}
</script>

<template>
  <div class="card">
    <div class="border-b border-gray-200 px-6 py-4">
      <h3 class="text-lg font-medium text-gray-900">Upcoming Tasks</h3>
    </div>
    
    <div class="px-6 py-4">
      <div v-if="isLoading" class="animate-pulse space-y-4">
        <div v-for="i in 5" :key="i" class="space-y-2">
          <div class="h-4 bg-gray-200 rounded w-3/4"></div>
          <div class="h-3 bg-gray-200 rounded w-1/2"></div>
          <div class="h-3 bg-gray-200 rounded w-1/4 mb-4"></div>
        </div>
      </div>
      
      <div v-else>
        <ul class="space-y-4">
          <li 
            v-for="task in tasks" 
            :key="task.id"
            class="border-l-4 pl-3 py-2 group animate-fade-in"
            :class="{
              'border-error-500': task.priority === 'high',
              'border-warning-500': task.priority === 'medium',
              'border-success-500': task.priority === 'low'
            }"
          >
            <div class="flex items-start justify-between">
              <div>
                <h4 class="text-sm font-medium text-gray-900">{{ task.title }}</h4>
                <p class="text-xs text-gray-600 mt-1">{{ task.project }}</p>
              </div>
              <div class="flex-shrink-0 ml-2">
                <span 
                  class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                  :class="getPriorityClass(task.priority)"
                >
                  {{ task.priority }}
                </span>
              </div>
            </div>
            
            <div class="mt-2 flex items-center justify-between">
              <p class="text-xs text-gray-500">Due: {{ task.dueDate }}</p>
              
              <div class="opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                <button class="p-1 text-gray-400 hover:text-primary-600 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                </button>
                <button class="p-1 text-gray-400 hover:text-error-600 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </li>
        </ul>
        
        <div class="mt-6">
          <button class="btn-secondary w-full text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Add New Task
          </button>
        </div>
      </div>
    </div>
  </div>
</template>