<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../../lib/supabase'

const router = useRouter()
const isLoading = ref(false)
const errorMessage = ref('')
const customers = ref<any[]>([])

const form = ref({
  customerId: '',
  name: '',
  description: '',
  location: '',
  status: 'planned',
  startDate: '',
  endDate: ''
})

onMounted(async () => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('id, name')
      .order('name')

    if (error) throw error
    customers.value = data || []
  } catch (error: any) {
    errorMessage.value = 'Failed to load customers'
  }
})

const createProject = async () => {
  try {
    isLoading.value = true
    errorMessage.value = ''

    const { data, error } = await supabase
      .from('projects')
      .insert([{
        customer_id: form.value.customerId,
        name: form.value.name,
        description: form.value.description,
        location: form.value.location,
        status: form.value.status,
        start_date: form.value.startDate,
        end_date: form.value.endDate
      }])
      .select()
      .single()

    if (error) throw error

    // Navigate to the new project's detail page
    router.push(`/projects/${data.id}`)
  } catch (error: any) {
    errorMessage.value = error.message || 'Failed to create Location'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div>
    <div class="mb-6">
      <button 
        class="flex items-center text-sm text-primary-600 hover:text-primary-700 mb-4"
        @click="router.push('/projects')"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Locations
      </button>
      
      <h1 class="text-2xl font-semibold text-gray-900">Create New Location</h1>
    </div>
    
    <div class="card max-w-2xl">
      <form @submit.prevent="createProject" class="p-6">
        <div v-if="errorMessage" class="mb-4 p-3 text-sm text-error-700 bg-error-100 rounded-md">
          {{ errorMessage }}
        </div>
        
        <div class="space-y-6">
          <div>
            <label for="customer" class="form-label">Customer</label>
            <select
              id="customer"
              v-model="form.customerId"
              required
              class="input"
            >
              <option value="">Select a customer</option>
              <option
                v-for="customer in customers"
                :key="customer.id"
                :value="customer.id"
              >
                {{ customer.name }}
              </option>
            </select>
          </div>
          
          <div>
            <label for="name" class="form-label">Location Name</label>
            <input
              id="name"
              v-model="form.name"
              type="text"
              required
              class="input"
            />
          </div>
          
          <div>
            <label for="description" class="form-label">Description</label>
            <textarea
              id="description"
              v-model="form.description"
              rows="3"
              class="input"
            ></textarea>
          </div>
          
          <div>
            <label for="location" class="form-label">Location</label>
            <input
              id="location"
              v-model="form.location"
              type="text"
              class="input"
            />
          </div>
          
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label for="startDate" class="form-label">Start Date</label>
              <input
                id="startDate"
                v-model="form.startDate"
                type="date"
                class="input"
              />
            </div>
            
            <div>
              <label for="endDate" class="form-label">End Date</label>
              <input
                id="endDate"
                v-model="form.endDate"
                type="date"
                class="input"
              />
            </div>
          </div>
          
          <div>
            <label for="status" class="form-label">Status</label>
            <select
              id="status"
              v-model="form.status"
              class="input"
            >
              <option value="planned">Planned</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
        
        <div class="mt-8 flex justify-end">
          <button
            type="button"
            class="btn-secondary mr-3"
            @click="router.push('/projects')"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="btn-primary"
            :disabled="isLoading"
          >
            <svg
              v-if="isLoading"
              class="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Create Location
          </button>
        </div>
      </form>
    </div>
  </div>
</template>