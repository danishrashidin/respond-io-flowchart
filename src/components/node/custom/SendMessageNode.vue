<template>
  <BaseNode
    :title="props.data.name"
    :description="props.data.description"
    color="var(--color-emerald-600)"
    v-bind="props"
  >
    <!-- <template #description>
      <p class="whitespace-pre-line truncate">
        Message: <br />
        <span v-for="data of props.data.payload" class="italic"
          >{{ data.type === 'text' ? data.text : data.attachment }}<br
        /></span>
      </p>
    </template> -->
    <template #icon>
      <SendHorizontal class="h-5 text-emerald-600" />
    </template>
  </BaseNode>
</template>

<script setup>
import BaseNode from '../BaseNode.vue'
import { SendHorizontal } from '@lucide/vue'

const props = defineProps({
  data: { type: Object },
})
</script>
