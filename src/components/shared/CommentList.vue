<script setup lang="ts">
import { computed } from 'vue'
import { formatDistanceToNow } from 'date-fns'
import { useLanguageStore } from '../../stores/languageStore'

interface Comment {
  id: number;
  text: string;
  author: {
    name: string;
    avatar: string;
  };
  timestamp: string;
  attachments: Array<{
    name: string;
    type: string;
  }>;
}

const props = defineProps<{
  comments: Comment[];
}>()

const languageStore = useLanguageStore()

// Format relative time from now
const getRelativeTime = (timestamp: string) => {
  try {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true })
  } catch {
    return languageStore.t('recently')
  }
}

// Get icon for attachment type
const getAttachmentIcon = (type: string) => {
  switch (type) {
    case 'pdf':
      return 'M14 3v4a1 1 0 001 1h4v10a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2h7z';
    case 'image':
    case 'jpg':
    case 'jpeg':
    case 'png':
      return 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z';
    case 'doc':
    case 'docx':
      return 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z';
    default:
      return 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z';
  }
}

const sortedComments = computed(() => {
  return [...props.comments].sort((a, b) => {
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  })
})
</script>

<template>
  <div>
    <div v-if="sortedComments.length === 0" class="text-center py-4">
      <p class="text-gray-500 text-sm">{{ languageStore.t('noComments') }}</p>
    </div>
    
    <ul v-else class="space-y-4">
      <li 
        v-for="comment in sortedComments" 
        :key="comment.id"
        class="animate-fade-in"
      >
        <div class="flex space-x-3">
          <img 
            :src="comment.author.avatar" 
            :alt="comment.author.name"
            class="h-10 w-10 rounded-full"
          />
          
          <div class="flex-1 overflow-hidden">
            <div class="flex items-center justify-between">
              <h4 class="text-sm font-medium text-gray-900">
                {{ comment.author.name }}
              </h4>
              <p class="text-xs text-gray-500">
                {{ getRelativeTime(comment.timestamp) }}
              </p>
            </div>
            
            <div class="mt-1 text-sm text-gray-700 whitespace-pre-line">
              {{ comment.text }}
            </div>
            
            <!-- Attachments -->
            <div 
              v-if="comment.attachments && comment.attachments.length > 0"
              class="mt-2 flex flex-wrap gap-2"
            >
              <a 
                v-for="(attachment, index) in comment.attachments" 
                :key="index"
                href="#"
                class="inline-flex items-center px-2.5 py-1.5 rounded-md text-xs font-medium bg-gray-100 text-gray-800 hover:bg-gray-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="getAttachmentIcon(attachment.type)" />
                </svg>
                {{ attachment.name }}
              </a>
            </div>
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>