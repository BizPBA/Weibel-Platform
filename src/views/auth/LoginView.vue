<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const isLoading = ref(false)
const form = ref({
  email: '',
  password: '',
  rememberMe: false
})
const errorMessage = ref('')

const handleSubmit = async () => {
  errorMessage.value = ''
  isLoading.value = true
  
  try {
    // Simulate login - in a real app, this would call an API
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Navigate to dashboard on success
    router.push('/dashboard')
  } catch (error) {
    errorMessage.value = 'Invalid email or password. Please try again.'
  } finally {
    isLoading.value = false
  }
}

const handleMicrosoftLogin = () => {
  isLoading.value = true
  
  // In a real app, this would redirect to Microsoft OAuth
  setTimeout(() => {
    router.push('/dashboard')
  }, 1500)
}
</script>

<template>
  <div class="p-6 sm:p-8">
    <h2 class="text-2xl font-bold text-center text-gray-900 mb-6">
      Sign in to your account
    </h2>
    
    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Error message -->
      <div v-if="errorMessage" class="p-3 text-sm text-red-700 bg-red-100 rounded-md">
        {{ errorMessage }}
      </div>
      
      <!-- Email field -->
      <div>
        <label for="email" class="form-label">Email address</label>
        <input
          id="email"
          type="email"
          v-model="form.email"
          class="input"
          required
          autocomplete="email"
        />
      </div>
      
      <!-- Password field -->
      <div>
        <div class="flex items-center justify-between">
          <label for="password" class="form-label">Password</label>
          <a href="#" class="text-sm font-medium text-primary-600 hover:text-primary-500">
            Forgot password?
          </a>
        </div>
        <input
          id="password"
          type="password"
          v-model="form.password"
          required
          class="input"
          autocomplete="current-password"
        />
      </div>
      
      <!-- Remember me -->
      <div class="flex items-center">
        <input
          id="remember-me"
          type="checkbox"
          v-model="form.rememberMe"
          class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
        />
        <label for="remember-me" class="ml-2 block text-sm text-gray-700">
          Remember me
        </label>
      </div>
      
      <!-- Submit button -->
      <div>
        <button
          type="submit"
          class="btn-primary w-full flex justify-center"
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
          Sign in
        </button>
      </div>
      
      <!-- Divider -->
      <div class="relative my-6">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-gray-300"></div>
        </div>
        <div class="relative flex justify-center text-sm">
          <span class="px-2 bg-white text-gray-500">Or sign in with</span>
        </div>
      </div>
      
      <!-- Microsoft login button -->
      <button
        type="button"
        @click="handleMicrosoftLogin"
        class="w-full flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        :disabled="isLoading"
      >
        <svg class="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M11.4 2H2V11.4H11.4V2Z" fill="#F25022"/>
          <path d="M11.4 12.6H2V22H11.4V12.6Z" fill="#00A4EF"/>
          <path d="M22 2H12.6V11.4H22V2Z" fill="#7FBA00"/>
          <path d="M22 12.6H12.6V22H22V12.6Z" fill="#FFB900"/>
        </svg>
        Sign in with Microsoft
      </button>
    </form>
  </div>
</template>