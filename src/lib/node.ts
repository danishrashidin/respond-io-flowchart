export type CustomData<T = any> = {
  name: string
  description?: string
} & T

export type CustomType = 'trigger' | 'dateTime' | 'dateTimeConnector' | 'sendMessage' | 'addComment'
