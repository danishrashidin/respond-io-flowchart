<template>
  <p>{{ nodeId }}</p>
</template>

<script setup>
import { useRouteParams } from '@vueuse/router'

const nodeId = useRouteParams('nodeId')
</script>
