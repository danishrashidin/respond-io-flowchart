<template>
  <div class="flex flex-col gap-8">
    <div class="flex flex-col">
      <p class="text-left text-2xl font-semibold text-neutral-900 tracking-tight">
        Create New Node
      </p>
      <p class="text-left text-sm font-normal text-neutral-500 mt-2">Enter node details below.</p>
      <FieldSet class="flex flex-col mt-6">
        <Field :data-invalid="!!form.formErrors.value.title">
          <FieldLabel for="title">Title</FieldLabel>
          <Input
            v-model="formState.title"
            id="title"
            type="text"
            :aria-invalid="!!form.formErrors.value.title"
            placeholder="Enter node title"
          />
          <FieldError v-if="form.formErrors.value.title">{{
            form.formErrors.value.title
          }}</FieldError>
        </Field>
        <Field :data-invalid="!!form.formErrors.value.description">
          <FieldLabel for="description">Description</FieldLabel>
          <Textarea
            v-model="formState.description"
            id="description"
            :aria-invalid="!!form.formErrors.value.description"
            placeholder="Enter node description"
          />
          <FieldError v-if="form.formErrors.value.description">{{
            form.formErrors.value.description
          }}</FieldError>
        </Field>
        <Field :data-invalid="!!form.formErrors.value.type">
          <FieldLabel for="type">Type of Node</FieldLabel>
          <Select v-model="formState.type" id="type">
            <SelectTrigger :aria-invalid="!!form.formErrors.value.type">
              <SelectValue placeholder="Choose node type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="type in nodeTypes" :key="type.value" :value="type.value">
                {{ type.name }}
              </SelectItem>
            </SelectContent>
          </Select>
          <FieldError v-if="form.formErrors.value.type">{{
            form.formErrors.value.type
          }}</FieldError>
        </Field>
      </FieldSet>
    </div>

    <template v-if="formState.type === 'businessHours'">
      <BusinessHoursForm ref="nodeTypeForm" v-model="businessHoursData" />
    </template>

    <template v-if="formState.type === 'addComment'">
      <AddCommentsForm ref="nodeTypeForm" v-model="commentData" />
    </template>

    <template v-if="formState.type === 'sendMessage'">
      <SendMessageForm
        ref="nodeTypeForm"
        v-model:message="sendMessageData.message"
        v-model:files="sendMessageData.files"
      />
    </template>

    <div class="flex flex-row items-center justify-end gap-2">
      <Button variant="secondary" @click="router.replace('/')">Cancel</Button>
      <Button variant="default" @click="handleCreateNode">Create</Button>
    </div>
  </div>
</template>

<script setup>
import { FieldSet, FieldLabel, Field, FieldError } from '../ui/field'
import { Input } from '../ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '../ui/button'
import { useRouter } from 'vue-router'
import { ref, useId, useTemplateRef } from 'vue'
import { useFlowStore } from '@/stores/flow'
import BusinessHoursForm from './BusinessHours.vue'
import AddCommentsForm from './AddComments.vue'
import SendMessageForm from './SendMessage.vue'
import { useCreateNodeForm } from '@/composables/useCreateNodeForm'

const nodeTypes = [
  {
    name: 'Send Message',
    value: 'sendMessage',
  },
  {
    name: 'Add Comments',
    value: 'addComment',
  },
  {
    name: 'Business Hours',
    value: 'businessHours',
  },
]

const form = useCreateNodeForm(nodeTypes)
const nodeTypeFormRef = useTemplateRef('nodeTypeForm')

const flow = useFlowStore()
const router = useRouter()
const formState = ref({
  title: '',
  description: '',
  type: 'addComment',
})

const businessHoursData = ref({
  times: [],
  timezone: 'UTC',
})
const commentData = ref('')
const sendMessageData = ref({
  message: '',
  files: [],
})

const handleCreateNode = () => {
  try {
    const result = form.validate(formState.value)
    const nodeTypeValid = nodeTypeFormRef.value?.validate() ?? false
    if (Object.keys(form.formErrors.value).length || !nodeTypeValid) return

    flow.addNode({
      id: crypto.randomUUID(),
      type: result.type === 'businessHours' ? 'dateTime' : result.type,
      position: { x: 0, y: 0 },
      data: {
        name: result.title,
        description: result.description || 'No description provided',
        ...(result.type === 'businessHours' && {
          times: businessHoursData.value.times,
          timezone: businessHoursData.value.timezone,
        }),
        ...(result.type === 'addComment' && {
          comment: commentData.value || 'No comment added',
        }),
        ...(result.type === 'sendMessage' && {
          payload: [
            ...(sendMessageData.value.message
              ? [{ type: 'text', text: sendMessageData.value.message }]
              : []),
            ...sendMessageData.value.files.map((attachment) => ({
              type: 'attachment',
              attachment,
            })),
          ],
        }),
      },
    })

    router.replace('/')
  } catch (error) {
    console.log(error)
  }
}
</script>
