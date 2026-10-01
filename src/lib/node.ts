export type CustomData = {
  name: string
  description?: string
  [key: string]: any
}

export type CustomType = 'trigger' | 'dateTime' | 'dateTimeConnector' | 'sendMessage' | 'addComment'
