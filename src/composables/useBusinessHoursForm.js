import z from 'zod'
import { ref } from 'vue'

export function useBusinessHoursForm() {
  const dayTimeSchema = z
    .object({
      day: z.string(),
      startTime: z.string().nullish(),
      endTime: z.string().nullish(),
    })
    .superRefine(({ startTime, endTime }, ctx) => {
      if (!startTime && !endTime) return

      if (!startTime) {
        ctx.addIssue({
          code: 'custom',
          path: ['startTime'],
          message: 'Start time is required when end time is filled.',
        })
      } else if (!endTime) {
        ctx.addIssue({
          code: 'custom',
          path: ['endTime'],
          message: 'End time is required when start time is filled.',
        })
      } else if (endTime <= startTime) {
        ctx.addIssue({
          code: 'custom',
          path: ['endTime'],
          message: 'End time must be later than start time.',
        })
      }
    })

  const formSchema = z.object({
    times: z.array(dayTimeSchema),
    timezone: z.string(),
  })
  const formErrors = ref({})

  const validate = (data) => {
    const result = formSchema.safeParse(data)

    if (!result.success) {
      const error = result.error.issues.reduce((prev, curr) => {
        const path = [...curr.path]
        if (path[0] === 'times' && typeof path[1] === 'number') {
          path[1] = data.times[path[1]]?.day?.toLowerCase() ?? path[1]
        }
        return {
          ...prev,
          [path.join('.')]: curr.message,
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
