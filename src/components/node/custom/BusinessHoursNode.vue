<template>
  <BaseNode :title="props.data.name" :description="`Business Hours - ${props.data.timezone}`">
    <template #icon>
      <CalendarDays class="h-5 text-orange-600" />
    </template>
  </BaseNode>
</template>

<script setup lang="ts">
import BaseNode from '../BaseNode.vue'
import { CalendarDays } from '@lucide/vue'
import type { NodeProps } from '@vue-flow/core'
import type { CustomData } from '@/lib/node.ts'
import type { BusinessHoursData } from '@/lib/types.ts'

const props = defineProps<NodeProps<CustomData<BusinessHoursData>>>()
</script>
