import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { createRouter, createWebHistory } from 'vue-router'
import './style.css'
import App from './App.vue'
import routes from './router/routes'

// Create pinia store
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

// Create router
const router = createRouter({
  history: createWebHistory(),
  routes
})

// Create and mount app
const app = createApp(App)
app.use(pinia)
app.use(router)
app.mount('#app')