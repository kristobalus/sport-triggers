
import { StudioTarget } from './studio.target'
import { StudioInputs } from './studio.inputs'
import { StudioInputsProtobuf } from './studio.inputs.protobuf'

export interface StudioEvent {
  id: string
  sport: string
  primary: boolean
  input: StudioInputs | StudioInputsProtobuf
  label: string
  targets?: StudioTarget[]
  preferredOptions?: string[]
  compare?: string[]
  targetSource: string
}
