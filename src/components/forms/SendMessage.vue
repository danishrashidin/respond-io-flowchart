<template>
  <div class="flex flex-col gap-4">
    <p
      class="inline-flex flex-row items-center gap-2 text-left text-lg font-semibold text-neutral-900"
    >
      <SendHorizontal class="h-5 text-emerald-600" />
      Send Message
    </p>
    <Separator />

    <Field>
      <FieldLabel for="message">Message</FieldLabel>
      <Textarea v-model="message" id="message" type="text" placeholder="Write message here" />
    </Field>
    <Field orientation="horizontal">
      <FieldLabel for="attachments">Attachments</FieldLabel>
      <Button variant="ghost" size="sm" @click="selectFile">
        <Plus />
        Upload File
      </Button>
      <input class="hidden" id="attachments" type="file" ref="input" @change="handleFileUpload" />
    </Field>

    <div v-if="attachments.length" class="grid grid-flow-row grid-cols-4">
      <Attachment v-for="file of files" :file="file" @delete="handleFileDelete" />
    </div>
    <div v-else class="h-24 w-full px-10 flex items-center justify-center">
      <p class="text-center text-xs font-normal text-neutral-500">No attachments</p>
    </div>
  </div>
</template>

<script setup>
import { useTemplateRef, nextTick } from 'vue'
import { Plus, SendHorizontal } from '@lucide/vue'
import { Separator } from '../ui/separator'
import { Field, FieldLabel } from '../ui/field'
import { Textarea } from '../ui/textarea'
import Attachment from './sendMessage/Attachment.vue'
import { Button } from '../ui/button/index.js'

const message = defineModel('message', {
  type: String,
  default: () => '',
})
const attachments = defineModel('files', {
  type: Array,
  default: () => [],
})

const fileInputRef = useTemplateRef('input')

const selectFile = () => {
  fileInputRef.value?.click()
}

const handleFileUpload = (e) => {
  const inputFiles = e.target?.files
  if (!inputFiles?.length) return

  for (let i = 0; i < inputFiles.length; i++) {
    const file = inputFiles?.item(i)
    if (file) attachments.value = [...attachments.value, file]
  }

  nextTick(() => {
    if (fileInputRef.value) fileInputRef.value.value = ''
  })
}

const handleFileDelete = (id) => {
  attachments.value = attachments.value.filter((file) => file.name !== id)
}
</script>
