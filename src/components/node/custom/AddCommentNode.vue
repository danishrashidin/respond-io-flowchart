<template>
  <BaseNode
    :title="props.data.name"
    :description="props.data.description"
    color="var(--color-blue-600)"
    v-bind="props"
  >
    <template #icon>
      <MessageSquareText class="h-5 text-blue-600" />
    </template>
  </BaseNode>
</template>

<script setup>
import BaseNode from '../BaseNode.vue'
import { MessageSquareText } from '@lucide/vue'

const props = defineProps({
  data: { type: Object },
})
</script>
