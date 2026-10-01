<template>
  <Badge variant="default" class="rounded-sm px-2 py-3 bg-blue-100">
    <p class="text-center text-xs font-semibold text-blue-600 capitalize">
      {{ props.data.connectorType }}
    </p>
  </Badge>
</template>

<script setup lang="ts">
import { Badge } from '@/components/ui/badge'
import type { NodeProps } from '@vue-flow/core'
import type { CustomData } from '@/lib/node.ts'

const props = defineProps<NodeProps<CustomData>>()
</script>
