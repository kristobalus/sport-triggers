import { AdapterEvent } from "./adapter-event"

export interface Event extends AdapterEvent {
  name: string
  value: string
}
