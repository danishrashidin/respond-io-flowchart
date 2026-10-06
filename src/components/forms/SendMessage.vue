<template>
  <div class="flex flex-col gap-4">
    <p
      class="inline-flex flex-row items-center gap-2 text-left text-lg font-semibold text-neutral-900"
    >
      <SendHorizontal class="h-5 text-emerald-600" />
      Send Message
    </p>
    <Separator />

    <Field :data-invalid="!!form.formErrors.value.message">
      <FieldLabel for="message">Message</FieldLabel>
      <Textarea
        v-model="message"
        id="message"
        type="text"
        :aria-invalid="!!form.formErrors.value.message"
        placeholder="Write message here"
      />
      <FieldError v-if="form.formErrors.value.message">{{
        form.formErrors.value.message
      }}</FieldError>
    </Field>
    <Field :data-invalid="!!form.formErrors.value.files">
      <div class="flex flex-row items-center gap-3">
        <FieldLabel for="attachments" class="flex-auto">Attachments</FieldLabel>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          :aria-invalid="!!form.formErrors.value.files"
          @click="selectFile"
        >
          <Plus />
          Upload File
        </Button>
      </div>
      <input
        class="hidden"
        id="attachments"
        type="file"
        multiple
        ref="input"
        :aria-invalid="!!form.formErrors.value.files"
        @change="handleFileUpload"
      />
      <FieldError v-if="form.formErrors.value.files">{{ form.formErrors.value.files }}</FieldError>
    </Field>

    <div v-if="attachments.length" class="grid grid-flow-row grid-cols-4">
      <Attachment
        v-for="(file, index) of attachments"
        :key="index"
        :file="file"
        @delete="handleFileDelete"
      />
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
import { Field, FieldError, FieldLabel } from '../ui/field'
import { Textarea } from '../ui/textarea'
import Attachment from './sendMessage/Attachment.vue'
import { Button } from '../ui/button/index.js'
import { useSendMessageForm } from '@/composables/useSendMessageForm'

const message = defineModel('message', {
  type: String,
  default: () => '',
})
const attachments = defineModel('files', {
  type: Array,
  default: () => [],
})

const form = useSendMessageForm()

defineExpose({
  validate: () => {
    form.validate({
      message: message.value,
      files: attachments.value,
    })
    return Object.keys(form.formErrors.value).length === 0
  },
})

const fileInputRef = useTemplateRef('input')

const selectFile = () => {
  fileInputRef.value?.click()
}

const handleFileUpload = (e) => {
  const inputFiles = e.target?.files
  if (!inputFiles?.length) return

  const newAttachments = []
  // ponytail: blob URLs last for this browser session; persistent URLs need an upload endpoint.
  for (let i = 0; i < inputFiles.length; i++) {
    const file = inputFiles?.item(i)
    if (file) newAttachments.push(URL.createObjectURL(file))
  }
  attachments.value = [...attachments.value, ...newAttachments]

  nextTick(() => {
    if (fileInputRef.value) fileInputRef.value.value = ''
  })
}

const handleFileDelete = (id) => {
  attachments.value = attachments.value.filter((file) => file !== id)
}
</script>
