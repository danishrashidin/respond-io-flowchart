<template>
  <Badge variant="default" class="rounded-sm px-2 py-3 bg-blue-100">
    <p class="text-center text-xs font-semibold text-blue-600 capitalize">
      {{ props.data.connectorType }}
    </p>
  </Badge>
</template>

<script setup>
import { Badge } from '@/components/ui/badge'

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
