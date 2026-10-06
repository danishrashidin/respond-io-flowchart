import z from 'zod'
import { ref } from 'vue'

export function useCreateNodeForm(nodeTypes) {
  const formSchema = z.object({
    title: z.string().refine((title) => title.trim().length > 0, {
      message: 'Title is required.',
    }),
    description: z.string(),
    type: z.enum(nodeTypes.map((type) => type.value)),
  })
  const formErrors = ref({})

  const validate = (data) => {
    const result = formSchema.safeParse(data)

    if (!result.success) {
      const error = result.error.issues.reduce((prev, curr) => {
        return {
          ...prev,
          [curr.path[0]]: curr.message,
        }
      }, {})
      formErrors.value = error
      return error
    }
    formErrors.value = {}
    return result.data
  }

  return {
    formSchema,
    formErrors,
    validate,
  }
}
