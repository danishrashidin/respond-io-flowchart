<template>
  <BaseNode :title="props.data.name">
    <template #description>
      <p class="whitespace-pre-line truncate">
        Message: <br />
        <span v-for="data of props.data.payload" class="italic"
          >{{ data.type === 'text' ? data.text : data.attachment }}<br
        /></span>
      </p>
    </template>
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
import type { SendMessageData } from '@/lib/types.ts'

const props = defineProps<NodeProps<CustomData<SendMessageData>>>()
</script>
