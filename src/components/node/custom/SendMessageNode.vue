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

<script setup>
import BaseNode from '../BaseNode.vue'
import { SendHorizontal } from '@lucide/vue'

const props = defineProps({
  id: { type: String, required: true },
  type: { type: null, required: true },
  selected: { type: Boolean, required: true },
  connectable: { type: [Boolean, Number, String, Function], required: true },
  position: { type: Object, required: true },
  dimensions: { type: Object, required: true },
  label: { type: null, required: false },
  isValidTargetPos: { type: Function, required: false },
  isValidSourcePos: { type: Function, required: false },
  parent: { type: String, required: false },
  parentNodeId: { type: String, required: false },
  dragging: { type: Boolean, required: true },
  resizing: { type: Boolean, required: true },
  zIndex: { type: Number, required: true },
  targetPosition: { type: String, required: false },
  sourcePosition: { type: String, required: false },
  dragHandle: { type: String, required: false },
  data: { type: Object, required: true },
  events: { type: null, required: true },
})
</script>
