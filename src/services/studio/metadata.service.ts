
import { randomUUID } from "crypto"
import { faker } from "@faker-js/faker"
import { Game, Player, Team } from "../../models/games"
import { metadata, targetTree } from "../../configs/studio"
import { EventMetadata } from "../../models/events/event-metadata"
import { StudioConditionData } from "../../models/studio/studio.condition-data"
import { StudioEvent } from "../../models/studio/studio.event"
import { StudioTargetTree } from "../../models/studio/studio.target-tree"
import { StudioTarget } from "../../models/studio/studio.target"
import { CommonSources } from "../../configs/studio/common-sources"

export class MetadataService {

  constructor() {}

  getConditionData(gameId: string): StudioConditionData {

    const game = this.getGame(gameId)

    const result: StudioConditionData = {
      events: {},
      sources: {},
    }

    for(const [ id, data ] of Object.entries(metadata) ){
      if ( data.disabled ) continue;
      if ( game.sport != data.sport ) continue;

      const item: StudioEvent = {
        id: id,
        sport: data.sport,
        primary: data.primary,
        input: data.input,
        label: data.label,
        compare: data.compare,
        targetSource: data.targetSource,
        ...(data.preferredOptions ? { preferredOptions: data.preferredOptions } : {})
      }

      if ( data.targetSource ) {
        // targets moved into separate "sources" tree
        // if ( data.targetSource == "game.team" ) {
        //   item.targets = this.createTeamTargets(game)
        // }
        // else if ( data.targetSource == "game.players" ) {
        //   item.targets = this.createPlayerTargets(game)
        // }
        // else if ( targetTree[data.targetSource] ) {
        //   item.targets = this.createTargetsBySource(data, targetTree)
        // }

        if (!result.sources[data.targetSource]) {
          let targets
          if ( data.targetSource == CommonSources.GameTeams ) {
            targets = this.createTeamTargets(game)
          }
          else if ( data.targetSource == CommonSources.GamePlayers ) {
            targets = this.createPlayerTargets(game)
          }
          else if ( targetTree[data.targetSource] ) {
            targets = this.createTargetsBySource(data, targetTree)
          }
          if (targets) {
            result.sources[data.targetSource] = targets
          }
        }
      }

      result.events[item.id] = item;
    }
    return result
  }

  createTargetsBySource(metas: EventMetadata, targetTree: StudioTargetTree) : StudioTarget[] {
      const targets: StudioTarget[] = []
      for(const id of metas.targets){

        const target = {
          label: targetTree[metas.targetSource][id].label,
          id: id,
          group: targetTree[metas.targetSource][id].group
        } as StudioTarget

        targets.push(target)
      }
      return targets
  }

  createPlayerTargets(game: Game) {
    const targets = []
    for(const player of game.players){
      const target = {
        label: player.name,
        id: player.id,
        group: game.teams[player.team].name,
      } as StudioTarget
      targets.push(target)
    }
    return targets;
  }

  createTeamTargets(game: Game): StudioTarget[] {
    const targets = []
    for(const [_, team] of Object.entries(game.teams)){
      const target = {
        label: team.name,
        id: team.id
      } as StudioTarget
      targets.push(target)
    }
    return targets
  }

  getGame(gameId: string): Game {
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
