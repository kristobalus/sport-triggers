
export enum BasketballEvents {
  GameLevel= 'basketball.game.level',
  GamePointsHome= 'basketball.game.points.home',
  GamePointsAway= 'basketball.game.points.away',
}

enum BaseballEvents {
  PitchSpeed = "baseball.pitch.speed",
  PitchResult = "baseball.pitch.result"
}

type EventValue = string

export interface BaseballEvent {
  name: string
  id: string
  scope: string
  scopeId: string
  value: string
  options: Record<BaseballEvents, EventValue>
}

