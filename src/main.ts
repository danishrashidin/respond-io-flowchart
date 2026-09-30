import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { VueQueryPlugin, type DefaultOptions } from '@tanstack/vue-query'

import App from './App.vue'
import router from './router'
import './style.css'

const app = createApp(App)

const defaultQueryOptions: DefaultOptions = {
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
