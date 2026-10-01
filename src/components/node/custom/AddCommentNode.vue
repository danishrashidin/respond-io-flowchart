<template>
  <BaseNode :title="props.data.name" description="Conversation Opened">
    <template #icon>
      <MessageSquareText class="h-5 text-blue-600" />
    </template>
  </BaseNode>
</template>

<script setup lang="ts">
import type { NodeProps } from '@vue-flow/core'
import BaseNode from '../BaseNode.vue'
import { MessageSquareText } from '@lucide/vue'
import type { CustomData } from '@/lib/node.ts'

const props = defineProps<NodeProps<CustomData>>()
</script>
