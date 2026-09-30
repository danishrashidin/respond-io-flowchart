import { useQuery } from '@tanstack/vue-query'
import { get as getPayload } from '@/lib/api/payload'

export default function useInitialFlow() {
  return useQuery({
    queryKey: ['flow'],
    queryFn: async () => {
      const payload = await getPayload()
      console.log(payload.data)
      return payload
    },
  })
}
