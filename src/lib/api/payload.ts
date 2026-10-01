import payload from '@/lib/payload.json'

let flow = structuredClone(payload)

export const get = () => {
  return flow
}

export const post = (newData: any) => {
  // Replace
  flow = newData
}
