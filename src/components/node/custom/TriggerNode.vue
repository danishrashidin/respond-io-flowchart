<template>
  <BaseNode
    title="Trigger"
    description="Conversation Opened"
    color="var(--color-pink-600)"
    v-bind="$props"
  >
    <template #icon>
      <Zap class="h-5 text-pink-600" />
    </template>
  </BaseNode>
</template>

<script setup>
import BaseNode from '../BaseNode.vue'
import { Zap } from '@lucide/vue'
</script>
