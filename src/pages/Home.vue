<template>
  <p>Hello World, {{ isLoading ? 'Loading data' : 'Data loaded' }}</p>
  <RouterView />
</template>

<script setup lang="ts">
import useInitialFlow from '@/composables/useInitialFlow'
import { watchEffect } from 'vue'

const { data, isLoading } = useInitialFlow()

watchEffect(() => {
  console.log(data.value?.data)
})
</script>
