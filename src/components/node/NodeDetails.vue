<script setup>
import { computed, ref, shallowRef, useTemplateRef, watch } from 'vue'
import { useRouteParams } from '@vueuse/router'
import { useRouter } from 'vue-router'
import { useFlowStore } from '@/stores/flow'
import { useCreateNodeForm } from '@/composables/useCreateNodeForm'
import { FieldSet, FieldLabel, Field, FieldError } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import BusinessHoursForm from '@/components/forms/BusinessHours.vue'
import AddCommentsForm from '@/components/forms/AddComments.vue'
import SendMessageForm from '@/components/forms/SendMessage.vue'

const nodeId = useRouteParams('nodeId')
const router = useRouter()
const flow = useFlowStore()
const node = computed(() => flow.nodes.find((item) => String(item.id) === String(nodeId.value)))
const nodeTypes = [
  { name: 'Send Message', value: 'sendMessage' },
  { name: 'Add Comments', value: 'addComment' },
  { name: 'Business Hours', value: 'dateTime' },
  { name: 'Trigger', value: 'trigger' },
]
const nodeTypeName = computed(
  () => nodeTypes.find((type) => type.value === node.value?.type)?.name || node.value?.type,
)
const form = useCreateNodeForm(nodeTypes)
const nodeTypeFormRef = useTemplateRef('nodeTypeForm')
const formState = ref({ title: '', description: '' })
const commentData = ref('')
const businessHoursData = ref({ times: [], timezone: 'UTC' })
const sendMessageData = ref({ message: '', files: [] })
const isConfirmingDelete = shallowRef(false)
const deleteButtonRef = useTemplateRef('deleteButton')
const cancelDeletionButtonRef = useTemplateRef('cancelDeletionButton')

watch(
  isConfirmingDelete,
  (confirming) => {
    const button = confirming ? cancelDeletionButtonRef : deleteButtonRef
    button.value?.$el.focus()
  },
  { flush: 'post' },
)

watch(
  node,
  (current) => {
    isConfirmingDelete.value = false
    form.formErrors.value = {}
    const data = current?.data || {}
    formState.value = {
      title: data.name || (current?.type === 'trigger' ? 'Trigger' : ''),
      description: data.description || '',
    }
    commentData.value = data.comment || ''
    businessHoursData.value = {
      times: (data.times || []).map((time) => ({ ...time })),
      timezone: data.timezone || 'UTC',
    }
    sendMessageData.value = {
      message: data.payload?.find((item) => item.type === 'text')?.text || '',
      files: (data.payload || [])
        .filter((item) => item.type === 'attachment')
        .map((item) => item.attachment),
    }
  },
  { immediate: true },
)

const handleSubmit = () => {
  if (!node.value || isConfirmingDelete.value) return
  const result = form.validate({ ...formState.value, type: node.value.type })
  const nodeTypeValid = nodeTypeFormRef.value?.validate() ?? true
  if (Object.keys(form.formErrors.value).length || !nodeTypeValid) return

  const data = {
    ...node.value.data,
    name: result.title,
    description: result.description || 'No description provided',
  }
  if (node.value.type === 'addComment') data.comment = commentData.value || 'No comment added'
  if (node.value.type === 'dateTime') {
    data.times = businessHoursData.value.times
    data.timezone = businessHoursData.value.timezone
  }
  if (node.value.type === 'sendMessage') {
    const textPayload = data.payload?.find((item) => item.type === 'text')
    data.payload = [
      ...(sendMessageData.value.message
        ? [{ ...textPayload, type: 'text', text: sendMessageData.value.message }]
        : []),
      ...sendMessageData.value.files.map((attachment) => ({ type: 'attachment', attachment })),
    ]
    delete data.files
  }
  flow.beginHistory()
  node.value.data = data
  flow.commitHistory()
  router.replace('/')
}

const handleDelete = () => {
  if (!node.value || !isConfirmingDelete.value) return
  const id = String(node.value.id)
  flow.deleteNodes([id])
  router.replace('/')
}
</script>

<template>
  <form v-if="node" :key="node.id" class="flex flex-col gap-8" @submit.prevent="handleSubmit">
    <div class="flex flex-col">
      <p class="text-left text-2xl font-semibold text-neutral-900 tracking-tight">Node Details</p>
      <p class="text-left text-sm font-normal text-neutral-500 mt-2">Update node details below.</p>
      <FieldSet class="flex flex-col mt-6">
        <Field :data-invalid="!!form.formErrors.value.title">
          <FieldLabel for="title">Title</FieldLabel>
          <Input
            id="title"
            v-model="formState.title"
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
            id="description"
            v-model="formState.description"
            :aria-invalid="!!form.formErrors.value.description"
            placeholder="Enter node description"
          />
          <FieldError v-if="form.formErrors.value.description">{{
            form.formErrors.value.description
          }}</FieldError>
        </Field>
      </FieldSet>
      <dl class="flex flex-col gap-4 mt-6 text-sm">
        <div>
          <dt class="font-medium">Type of Node</dt>
          <dd class="mt-1 text-neutral-500">{{ nodeTypeName }}</dd>
          <FieldError v-if="form.formErrors.value.type">{{
            form.formErrors.value.type
          }}</FieldError>
        </div>
        <div>
          <dt class="font-medium">Node ID</dt>
          <dd class="mt-1 text-neutral-500 break-words">{{ node.id }}</dd>
        </div>
      </dl>
    </div>

    <BusinessHoursForm
      v-if="node.type === 'dateTime'"
      ref="nodeTypeForm"
      v-model="businessHoursData"
    />
    <AddCommentsForm
      v-else-if="node.type === 'addComment'"
      ref="nodeTypeForm"
      v-model="commentData"
    />
    <SendMessageForm
      v-else-if="node.type === 'sendMessage'"
      ref="nodeTypeForm"
      v-model:message="sendMessageData.message"
      v-model:files="sendMessageData.files"
    />

    <div
      v-if="isConfirmingDelete"
      role="alert"
      aria-labelledby="delete-confirmation-title"
      class="flex flex-col gap-4 rounded-xl border border-destructive/30 bg-destructive/5 p-4"
    >
      <div class="flex flex-col gap-2">
        <p id="delete-confirmation-title" class="font-semibold break-words">
          Delete “{{ node.data.name || nodeTypeName }}”?
        </p>
        <p class="text-sm text-neutral-500">
          This removes the node and its connected edges. Other nodes will remain.
        </p>
      </div>
      <div class="flex flex-wrap items-center justify-end gap-2">
        <Button
          ref="cancelDeletionButton"
          type="button"
          variant="secondary"
          @click="isConfirmingDelete = false"
        >
          Cancel deletion
        </Button>
        <Button type="button" variant="destructive" @click="handleDelete">
          Confirm deletion
        </Button>
      </div>
    </div>
    <div v-else class="flex flex-row flex-wrap items-center justify-between gap-2">
      <Button
        ref="deleteButton"
        type="button"
        variant="destructive"
        @click="isConfirmingDelete = true"
      >
        Delete node
      </Button>
      <div class="flex flex-row items-center gap-2">
        <Button type="button" variant="secondary" @click="router.replace('/')">Cancel</Button>
        <Button type="submit">Submit</Button>
      </div>
    </div>
  </form>
  <div v-else class="flex flex-col gap-4">
    <p class="text-sm text-neutral-500">Node not found.</p>
    <Button type="button" variant="secondary" @click="router.replace('/')">Cancel</Button>
  </div>
</template>
