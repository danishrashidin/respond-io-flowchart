<template>
  <div
    class="flex flex-col gap-2 p-3 max-w-24 relative"
    @mouseenter="isHover = true"
    @mouseleave="isHover = false"
  >
    <FileIcon class="w-full" />
    <p :title="file" class="text-center text-xs font-normal text-neutral-500 truncate">
      {{ fileName }}
    </p>
    <div v-if="isHover" class="absolute inset-0 z-10 flex items-center justify-center">
      <button
        type="button"
        :aria-label="`Remove ${fileName}`"
        class="cursor-pointer bg-destructive size-10 rounded-full flex items-center justify-center"
        @click="emit('delete', file)"
      >
        <Trash class="text-white size-5" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { FileIcon, Trash } from '@lucide/vue'
import { computed, ref } from 'vue'

const props = defineProps({
  file: { type: String, required: true },
})

const fileName = computed(() => props.file.split(/[\\/]/).pop().split(/[?#]/)[0])

const emit = defineEmits(['delete'])

const isHover = ref(false)
</script>
