import { TriggerCondition } from "../entities/trigger-condition"

import { Event } from "./event"
import { metadata } from "./event-metadata"
import { Player } from "./player"

export function toUriByEvent(event: Partial<Event>) {
  const { name, scope, scopeId } = event

  if ( metadata[name].params?.player ) {
    const player = (event as unknown as Player).player
    
    return `event://${scope}/${scopeId}/${name}/player/${player}`
  }

  return `event://${scope}/${scopeId}/${name}`
}

export function toUriByCondition(condition: Partial<TriggerCondition>) {
  const { scope, scopeId, event } = condition

  if ( metadata[event].params?.player ) {
    const player = condition.params?.player
    
    return `event://${scope}/${scopeId}/${event}/player/${player}`
  }

  return `event://${scope}/${scopeId}/${event}`
}
