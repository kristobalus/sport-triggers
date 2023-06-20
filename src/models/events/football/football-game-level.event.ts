
import { BaseEvent } from "../base.event"

export const GameLevelTypes = [
  "start",
  "quarter.start",
  "half.start",
  "quarter.end",
  "half.end",
  "end",
  "under_review"] as const

export type GameLevelType = typeof GameLevelTypes[number];

export interface FootballGameLevelEvent extends BaseEvent {
  name: "football.game.level"
  value: GameLevelType
}

