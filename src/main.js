import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { VueQueryPlugin } from '@tanstack/vue-query'
import App from './App.vue'
import router from './router'
import './style.css'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
const app = createApp(App)
const defaultQueryOptions = {
  queries: {
    refetchOnWindowFocus: false,
    networkMode: 'always',
    staleTime: Infinity,
    gcTime: 60 * 60 * 1000,
  },
}
app.use(createPinia())
app.use(router)
app.use(VueQueryPlugin, {
  queryClientConfig: {
    defaultOptions: defaultQueryOptions,
  },
})
app.mount('#app')
