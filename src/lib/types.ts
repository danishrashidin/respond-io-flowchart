export type BusinessHoursData = {
  times: {
    day: string
    startTime: string | null
    endTime: string | null
  }[]
  timezone: string
}

export type SendMessageData = {
  payload: (
    | {
        type: 'text'
        text: string
      }
    | {
        type: 'attachment'
        attachment: string
      }
  )[]
}

export type AddCommentData = {
  comment: string
}
