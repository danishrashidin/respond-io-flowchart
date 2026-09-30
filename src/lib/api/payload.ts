import axios from 'axios'

const PAYLOAD_URL =
  'https://respond-io-fe-bucket.s3.ap-southeast-1.amazonaws.com/candidate-assessments/payload.json'

export const get = () => axios.get(PAYLOAD_URL)
