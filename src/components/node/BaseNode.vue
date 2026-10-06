<template>
  <div
    :class="
      cn(
        'w-52 flex flex-col divide-y divide-gray-300 bg-white rounded-xl border border-gray-300 shadow-md overflow-hidden transition-all',
        selected && 'border-(--node-selected-border) border-2',
      )
    "
    :style="{ '--node-selected-border': color }"
  >
    <!-- Header -->
    <div class="px-2 py-2 flex flex-row gap-1 items-center">
      <slot name="icon" />
      <p class="text-left text-xs font-semibold text-neutral-900">
        {{ title }}
      </p>
    </div>
    <!-- Content -->
    <div class="px-3 py-3 max-h-60">
      <slot name="description">
        <p class="text-xs font-normal text-neutral-500 line-clamp-4 leading-5 h-full">
          {{ description }}
        </p>
      </slot>
    </div>
  </div>
</template>

<script setup>
import { watch } from 'vue'
import { cn } from '@/lib/utils'
const props = defineProps({
  title: { type: String, required: true },
  description: { type: String, required: false, default: 'No description provided' },
  selected: { type: Boolean, required: false },
  color: { type: String, required: false },
})
</script>
