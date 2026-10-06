<script setup>
import { cn } from '@/lib/utils'

const props = defineProps({
  class: { type: null, required: false },
})
</script>

<template>
  <div data-slot="sheet-footer" :class="cn('gap-2 p-6 mt-auto flex flex-col', props.class)">
    <slot />
  </div>
</template>
