
import { ConditionType } from "../../models/entities/trigger-condition"
import { randomUUID } from "crypto"
import { faker } from "@faker-js/faker"
import { Game, Player, Team } from "../../models/games"
import { metadata } from "../../configs/studio"
import { targets as BaseballTargets } from "../../configs/studio/baseball/targets"
import { TargetSources as BaseballTargetSources } from "../../configs/studio/baseball/target-sources"

export type StudioInputType = "select" | "select.multi" | "time.minutes" | "string" | "number" | "points" | string

export interface TargetMetadata {
  label: string
  id?: string
  group?: string
}

export interface StudioEvent {
  id: string
  sport: string
  primary: boolean
  input: StudioInputType
  label: string
  targets?: TargetMetadata[]
  secondary?: string[]
  compare?: string[]
  type: ConditionType
}

export interface StudioCreateCondition {
  events: Record<string, StudioEvent>
}

export class MetadataService {

  getMetadata(gameId: string) {

    const game = this.createGame(gameId)
    const result: StudioCreateCondition = {
      events: {}
    }
    for(const [ id, data ] of Object.entries(metadata) ){
      if ( game.sport != data.sport ) continue;
      const item = {
        id: id,
        sport: data.sport,
        primary: data.primary,
        input: data.input,
        label: data.label,
        compare: data.compare,
        ...(data.secondary ? { secondary: data.secondary } : {})
      } as StudioEvent

      if ( data.targetSource == "game.players" ) {
        item.targets = []
        for(const player of game.players){
          const target = {
            label: player.name,
            id: player.id,
            group: game.teams[player.team].name,
          } as TargetMetadata
          item.targets.push(target)
        }
      }

      if ( data.targetSource == "game.teams" ) {
        item.targets = []
        for(const [_, team] of Object.entries(game.teams)){
          const target = {
            label: team.name,
            id: team.id
          } as TargetMetadata
          item.targets.push(target)
        }
      }

      if ( data.targetSource == BaseballTargetSources.PitchOutcome ) {
        item.targets = []
        for(const id of data.targets){

          const target = {
            label: BaseballTargets[data.targetSource][id].label,
            id: id,
            group: BaseballTargets[data.targetSource][id].group
          } as TargetMetadata

          item.targets.push(target)
        }
      }

      if ( data.targetSource == BaseballTargetSources.AtBatOutcome ) {
        item.targets = []
        for(const id of data.targets){

          const target = {
            label: BaseballTargets[data.targetSource][id].label,
            id: id,
            group: BaseballTargets[data.targetSource][id].group
          } as TargetMetadata

          item.targets.push(target)
        }
      }

      result.events[item.id] = item
    }
    return result
  }

  createGame(gameId: string): Game {
    const home: Team = {
      id: randomUUID(),
      name: "Indiana Pacers",
      home: true
    }
    const away: Team = {
      id: randomUUID(),
      name: "Boston Red Sox",
      home: false
    }

    const teams = [home, away]
    const players = []
    for(let i = 0; i < 20; i++) {
      const team: Team = teams[i % 2]
      const player: Player = {
        id: randomUUID(),
        team: team.id,
        name: faker.person.fullName(),
        position: i
      }
      players.push(player)
    }

    return {
      datasource: "sportradar",
      sport: "baseball",
      scope: "game",
      id: gameId,
      home: home.id,
      away: away.id,
      teams: {
        [home.id]: home,
        [away.id]: away
      },
      players: players,
    }
  }

}
