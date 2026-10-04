<template>
  <div
    class="flex flex-col gap-2 p-3 max-w-24 relative"
    @mouseenter="isHover = true"
    @mouseleave="isHover = false"
  >
    <FileIcon class="w-full" />
    <p class="text-center text-xs font-normal text-neutral-500 truncate">{{ file.name }}</p>
    <div v-if="isHover" class="absolute inset-0 z-10 flex items-center justify-center">
      <div
        class="cursor-pointer bg-destructive size-10 rounded-full flex items-center justify-center"
        @click="emit('delete', file.name)"
      >
        <Trash class="text-white size-5" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { FileIcon, Trash } from '@lucide/vue'
import { ref } from 'vue'

const props = defineProps<{
  file: File
}>()

const emit = defineEmits<{
  (e: 'delete', id: string): void
}>()

const isHover = ref(false)
</script>
