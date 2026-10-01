<template>
  <p>Create New Node</p>
</template>

<script setup lang="ts">
import z from 'zod'

const nodeSchema = z.object({
  title: z.string(),
  description: z.string(),
  type: z.enum(['sendMessage', 'addComments', 'businessHours']),
})

type NodeSchema = z.infer<typeof nodeSchema>
</script>
