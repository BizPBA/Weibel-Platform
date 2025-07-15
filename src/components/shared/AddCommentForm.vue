<script setup lang="ts">
import { ref } from 'vue'
import { useLanguageStore } from '../../stores/languageStore'

const languageStore = useLanguageStore()
const emit = defineEmits(['submit'])

const text = ref('')
const isLoading = ref(false)
const attachments = ref<Array<any>>([])

const submitForm = () => {
  if (!text.value.trim()) return
  
  isLoading.value = true
  
  // Simulate API call
  setTimeout(() => {
    emit('submit', {
      text: text.value,
      attachments: attachments.value
    })
    
    // Reset form
    text.value = ''
    attachments.value = []
    isLoading.value = false
  }, 500)
}

const handleFileUpload = (event: Event) => {
  const fileInput = event.target as HTMLInputElement
  
  if (!fileInput.files?.length) return
  
  // In a real app, this would upload files to a server
  // Here we'll just simulate attachment metadata
  const file = fileInput.files[0]
  
  attachments.value.push({
    name: file.name,
    type: file.type.split('/')[1] || 'file'
  })
  
  // Reset file input
  fileInput.value = ''
}

const removeAttachment = (index: number) => {
  attachments.value.splice(index, 1)
}
</script>

<template>
  <form @submit.prevent="submitForm">
    <div class="border border-gray-300 rounded-lg overflow-hidden focus-within:border-primary-500 focus-within:ring-1 focus-within:ring-primary-500">
      <textarea
        v-model="text"
        rows="3"
        :placeholder="languageStore.t('writeComment')"
        class="block w-full border-0 py-3 px-4 resize-none focus:ring-0 focus:outline-none text-sm"
      ></textarea>
      
      <!-- Attachments -->
      <div 
        v-if="attachments.length > 0" 
        class="border-t border-gray-200 px-4 py-2 space-y-2"
      >
        <div 
          v-for="(attachment, index) in attachments" 
          :key="index"
          class="flex items-center justify-between text-sm px-2 py-1 bg-gray-50 rounded"
        >
          <div class="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-400 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
            <span>{{ attachment.name }}</span>
          </div>
          
          <button 
            type="button"
            class="text-gray-400 hover:text-error-500"
            @click="removeAttachment(index)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      
      <!-- Actions -->
      <div class="border-t border-gray-200 px-4 py-2 flex justify-between items-center">
        <div>
          <label class="cursor-pointer text-primary-600 hover:text-primary-700 p-1 rounded hover:bg-primary-50 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
            <input
              type="file"
              class="hidden"
              @change="handleFileUpload"
            />
          </label>
        </div>
        
        <button
          type="submit"
          class="btn-primary text-sm px-3 py-1"
          :disabled="!text.trim() || isLoading"
        >
          <svg
            v-if="isLoading"
            class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
          {{ languageStore.t('addComment') }}
        </button>
      </div>
    </div>
  </form>
</template>