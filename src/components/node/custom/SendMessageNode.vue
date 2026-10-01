<template>
  <BaseNode :title="props.data.name" description="Conversation Opened">
    <template #icon>
      <SendHorizontal class="h-5 text-emerald-600" />
    </template>
  </BaseNode>
</template>

<script setup lang="ts">
import BaseNode from '../BaseNode.vue'
import { SendHorizontal } from '@lucide/vue'
import type { NodeProps } from '@vue-flow/core'
import type { CustomData } from '@/lib/node.ts'

const props = defineProps<NodeProps<CustomData>>()
</script>
