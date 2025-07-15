<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../../lib/supabase'

const router = useRouter()
const isLoading = ref(false)
const errorMessage = ref('')

const form = ref({
  name: '',
  contactPerson: '',
  email: '',
  phone: '',
  address: '',
  status: 'active'
})

const createCustomer = async () => {
  try {
    isLoading.value = true
    errorMessage.value = ''

    const { data, error } = await supabase
      .from('customers')
      .insert([{
        name: form.value.name,
        contact_person: form.value.contactPerson,
        email: form.value.email,
        phone: form.value.phone,
        address: form.value.address,
        status: form.value.status
      }])
      .select()
      .single()

    if (error) throw error

    // Navigate to the new customer's detail page
    router.push(`/customers/${data.id}`)
  } catch (error: any) {
    errorMessage.value = error.message || 'Failed to create customer'
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
        @click="router.push('/customers')"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to customers
      </button>
      
      <h1 class="text-2xl font-semibold text-gray-900">Create New Customer</h1>
    </div>
    
    <div class="card max-w-2xl">
      <form @submit.prevent="createCustomer" class="p-6">
        <div v-if="errorMessage" class="mb-4 p-3 text-sm text-error-700 bg-error-100 rounded-md">
          {{ errorMessage }}
        </div>
        
        <div class="space-y-6">
          <div>
            <label for="name" class="form-label">Company Name</label>
            <input
              id="name"
              v-model="form.name"
              type="text"
              required
              class="input"
            />
          </div>
          
          <div>
            <label for="contactPerson" class="form-label">Contact Person</label>
            <input
              id="contactPerson"
              v-model="form.contactPerson"
              type="text"
              required
              class="input"
            />
          </div>
          
          <div>
            <label for="email" class="form-label">Email</label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              class="input"
            />
          </div>
          
          <div>
            <label for="phone" class="form-label">Phone</label>
            <input
              id="phone"
              v-model="form.phone"
              type="tel"
              class="input"
            />
          </div>
          
          <div>
            <label for="address" class="form-label">Address</label>
            <textarea
              id="address"
              v-model="form.address"
              rows="3"
              class="input"
            ></textarea>
          </div>
          
          <div>
            <label for="status" class="form-label">Status</label>
            <select
              id="status"
              v-model="form.status"
              class="input"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
        
        <div class="mt-8 flex justify-end">
          <button
            type="button"
            class="btn-secondary mr-3"
            @click="router.push('/customers')"
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
            Create Customer
          </button>
        </div>
      </form>
    </div>
  </div>
</template>