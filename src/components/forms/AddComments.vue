<template>
  <div class="flex flex-col gap-4">
    <p
      class="inline-flex flex-row items-center gap-2 text-left text-lg font-semibold text-neutral-900"
    >
      <MessageSquareText class="h-5 text-blue-600" />
      Add Comments
    </p>
    <Separator />
    <Field>
      <FieldLabel for="comment">Comment</FieldLabel>
      <Textarea id="comment" v-model="comment" placeholder="Add a comment" />
    </Field>
  </div>
</template>

<script setup lang="ts">
import { Separator } from '../ui/separator'
import { MessageSquareText } from '@lucide/vue'
import { Field, FieldLabel } from '../ui/field'
import { Textarea } from '../ui/textarea'

const comment = defineModel<string>()
</script>
