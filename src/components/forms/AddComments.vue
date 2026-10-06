<template>
  <div class="flex flex-col gap-4">
    <p
      class="inline-flex flex-row items-center gap-2 text-left text-lg font-semibold text-neutral-900"
    >
      <MessageSquareText class="h-5 text-blue-600" />
      Add Comments
    </p>
    <Separator />
    <Field :data-invalid="!!form.formErrors.value.comment">
      <FieldLabel for="comment">Comment</FieldLabel>
      <Textarea
        id="comment"
        v-model="comment"
        :aria-invalid="!!form.formErrors.value.comment"
        placeholder="Add a comment"
      />
      <FieldError v-if="form.formErrors.value['comment']">{{
        form.formErrors.value['comment']
      }}</FieldError>
    </Field>
  </div>
</template>

<script setup>
import { Separator } from '../ui/separator'
import { MessageSquareText } from '@lucide/vue'
import { Field, FieldError, FieldLabel } from '../ui/field'
import { Textarea } from '../ui/textarea'
import { useAddCommentForm } from '@/composables/useAddCommentForm'

const comment = defineModel({ type: String })

const form = useAddCommentForm()

defineExpose({
  validate: () => {
    form.validate({
      comment: comment.value,
    })
    return Object.keys(form.formErrors.value).length === 0
  },
})
</script>
