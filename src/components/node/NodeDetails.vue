<template>
  <p>{{ nodeId }}</p>
</template>

<script setup lang="ts">
import { useRouteParams } from '@vueuse/router'

const nodeId = useRouteParams('nodeId')
</script>
