<template>
  <div class="flex flex-col gap-8">
    <div class="flex flex-col">
      <p class="text-left text-2xl font-semibold text-neutral-900 tracking-tight">
        Create New Node
      </p>
      <p class="text-left text-sm font-normal text-neutral-500 mt-2">Enter node details below.</p>
      <FieldSet class="flex flex-col mt-6">
        <Field>
          <FieldLabel for="title">Title</FieldLabel>
          <Input v-model="formState.title" id="title" type="text" placeholder="Enter node title" />
        </Field>
        <Field>
          <FieldLabel for="description">Description</FieldLabel>
          <Textarea
            v-model="formState.description"
            id="description"
            placeholder="Enter node description"
          />
        </Field>
        <Field>
          <FieldLabel for="type">Type of Node</FieldLabel>
          <Select v-model="formState.type" id="type">
            <SelectTrigger>
              <SelectValue placeholder="Choose node type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="type in nodeTypes" :value="type.value">
                {{ type.name }}
              </SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </FieldSet>
    </div>

    <template v-if="formState.type === 'businessHours'">
      <BusinessHoursForm v-model="businessHoursData" />
    </template>

    <template v-if="formState.type === 'addComment'">
      <AddCommentsForm v-model="commentData" />
    </template>

    <template v-if="formState.type === 'sendMessage'">
      <SendMessageForm
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
import z from 'zod'
import { FieldSet, FieldLabel, Field } from '../ui/field'
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
import { ref, useId } from 'vue'
import { useFlowStore } from '@/stores/flow'
import BusinessHoursForm from './BusinessHours.vue'
import AddCommentsForm from './AddComments.vue'
import SendMessageForm from './SendMessage.vue'

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

const nodeSchema = z.object({
  title: z.string(),
  description: z.string(),
  type: z.enum(nodeTypes.map((types) => types.value)),
})

const flow = useFlowStore()
const router = useRouter()
const formState = ref({
  title: '',
  description: '',
  type: 'addComment',
})
const newNodeId = useId()

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
    const result = nodeSchema.parse(formState.value)

    flow.nodes.push({
      id: newNodeId,
      type: result.type === 'businessHours' ? 'dateTime' : result.type,
      position: { x: 0, y: 0 },
      data: {
        name: result.title,
        description: result.description,
        ...(result.type === 'businessHours' && {
          times: businessHoursData.value.times,
          timezone: businessHoursData.value.timezone,
        }),
        ...(result.type === 'addComment' && {
          comment: commentData.value || 'No comment added',
        }),
        ...(result.type === 'sendMessage' && {
          payload: [],
        }),
      },
    })

    router.replace('/')
  } catch (error) {
    console.log(error)
  }
}
</script>
