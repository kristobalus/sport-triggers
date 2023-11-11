import { EventLimit } from '../models/events/event-limit'

export enum CommonLimit {
  Scope = "scope",
  Minute = "minute"
}

export const limits: Record<string, EventLimit> = {
  [CommonLimit.Minute]: {
    label: "per minute",
    description: "Event should occur no more than N times per minute",
    interval: 60,
    common: true
  },
  [CommonLimit.Scope]: {
    label: "per game",
    description: "Event should occur no more than N times per game",
    finite: true,
    common: true
  }
}

export const CommonLimitList = [
  CommonLimit.Minute,
  CommonLimit.Scope
]

