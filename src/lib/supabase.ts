import { createClient } from '@supabase/supabase-js'
import { Database } from './database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

console.log('Supabase configuration check:')
console.log('- URL:', supabaseUrl || 'MISSING')
console.log('- Key exists:', !!supabaseAnonKey)
console.log('- Environment mode:', import.meta.env.MODE)

console.log('Environment check:', {
  NODE_ENV: import.meta.env.MODE,
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Present' : 'Missing',
  URL_FORMAT_VALID: import.meta.env.VITE_SUPABASE_URL?.startsWith('https://') && import.meta.env.VITE_SUPABASE_URL?.includes('.supabase.co'),
  FULL_URL: import.meta.env.VITE_SUPABASE_URL,
  KEY_LENGTH: import.meta.env.VITE_SUPABASE_ANON_KEY?.length
})

if (!supabaseUrl || !supabaseAnonKey) {
  const errorMsg = 'CRITICAL: Missing Supabase environment variables. Please click the "Connect to Supabase" button in the top right corner of the Bolt interface to configure your database connection.'
  console.error('CRITICAL:', errorMsg)
  console.error('- VITE_SUPABASE_URL:', supabaseUrl || 'MISSING')
  console.error('- VITE_SUPABASE_ANON_KEY exists:', !!supabaseAnonKey)
  throw new Error(errorMsg)
}

// Validate URL format
if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co')) {
  const errorMsg = 'CRITICAL: Invalid Supabase URL format. Please use the "Connect to Supabase" button to reconfigure your connection with a valid Supabase project URL.'
  console.error('CRITICAL:', errorMsg)
  console.error('- Current URL:', supabaseUrl)
  console.error('- Expected format: https://[project-id].supabase.co')
  throw new Error(errorMsg)
}

console.log('Creating Supabase client...')
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'x-client-info': 'weibel-platform@1.0.0',
    },
    fetch: (url, options = {}) => {
      // Create a timeout signal for 10 seconds
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)
      
      // Combine with any existing signal
      const existingSignal = options.signal
      if (existingSignal) {
        existingSignal.addEventListener('abort', () => controller.abort())
      }
      
      return fetch(url, {
        ...options,
        signal: controller.signal
      }).finally(() => {
        clearTimeout(timeoutId)
      })
    }
  }
})
console.log('Supabase client created successfully')