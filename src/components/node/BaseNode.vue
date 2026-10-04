<template>
  <div
    class="w-52 flex flex-col divide-y divide-gray-300 bg-white rounded-xl border border-gray-300 shadow-md overflow-hidden"
  >
    <!-- Header -->
    <div class="px-2 py-2 flex flex-row gap-1 items-center">
      <slot name="icon" />
      <p class="text-left text-xs font-semibold text-neutral-900">{{ title }}</p>
    </div>
    <!-- Content -->
    <div class="px-3 py-3 text-xs font-normal text-neutral-500 truncate line-clamp-4 leading-5">
      <slot name="description">
        {{ description }}
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  title: string
  description?: string
}>()
</script>
