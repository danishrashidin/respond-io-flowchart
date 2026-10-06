<template>
  <BaseNode
    :title="props.data.name"
    :description="`Business Hours - ${props.data.timezone}`"
    color="var(--color-orange-600)"
    v-bind="props"
  >
    <template #icon>
      <CalendarDays class="h-5 text-orange-600" />
    </template>
  </BaseNode>
</template>

<script setup>
import BaseNode from '../BaseNode.vue'
import { CalendarDays } from '@lucide/vue'

const props = defineProps({
  data: { type: Object },
})
</script>
