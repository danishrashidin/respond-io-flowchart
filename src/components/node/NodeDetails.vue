<template>
  <p>{{ params }}</p>
</template>

<script setup lang="ts">
import { watchEffect } from 'vue'
import { useRoute } from 'vue-router'

const { params } = useRoute() // Expect "nodeId"

watchEffect(() => {
  console.log(params)
})
</script>
