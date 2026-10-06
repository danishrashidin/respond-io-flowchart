import z from 'zod'
import { ref } from 'vue'

export function useAddCommentForm() {
  const formSchema = z.object({
    comment: z.string(),
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
