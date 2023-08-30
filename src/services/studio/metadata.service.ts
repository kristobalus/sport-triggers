
import { StudioConditionData } from '../../models/studio/studio.condition-data'
import { metadata, targetTree } from "../../sports"
import { StudioEvent } from "../../models/studio/studio.event"
import { CommonSources } from "../../sports/common-sources"
import { Game } from "../../models/studio/game"
import { StudioInputs } from "../../models/studio/studio.inputs"
import { StudioInputsProtobuf } from "../../models/studio/studio.inputs.protobuf"
import { EventMetadata } from "../../models/events/event-metadata"
import { StudioTargetTree } from "../../models/studio/studio.target-tree"
import { StudioTarget } from "../../models/studio/studio.target"

export interface Datasource {
  getGame(gameId: string): Game
}

export type Sport = 'basketball' | 'baseball' | 'football' | 'soccer'

export class MetadataService {

  private sources: Map<string, Datasource> = new Map<string, Datasource>()

  getConditionData(
    datasource: string,
    gameId: string,
    shouldMapEnum = false) {

    const ds = this.sources.get(datasource)
    if (!ds) {
      throw new Error(`Datasource ${datasource} not found`)
    }

    const game = ds.getGame(gameId)
    if (!game) {
      throw new Error(`Game ${gameId} not found`)
    }

    const result: StudioConditionData = {
      game: {
        id: game.id,
        datasource: game.datasource,
        scope: game.scope,
        sport: game.sport
      },
      index: [],
      events: {},
      sources: {},
    }

    for (const [id, data] of Object.entries(metadata) ) {
      if ( data.disabled ) { continue }
      if ( game.sport != data.sport ) { continue }

      const item: StudioEvent = {
        id: id,
        sport: data.sport,
        primary: data.primary,
        input: shouldMapEnum ? this.getStudioInputMapped(data.input) : data.input,
        label: data.label,
        compare: data.compare,
        targetSource: data.targetSource,
        ...(data.preferredOptions ? { preferredOptions: data.preferredOptions } : {})
      }

      if ( data.targetSource ) {
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
            result.sources[data.targetSource] = { targets }
          }
        }
      }

      result.events[item.id] = item
      result.index.push(item.id)
    }

    return result
  }

  getStudioInputMapped(input: StudioInputs): StudioInputsProtobuf {
    switch (input) {
      case StudioInputs.None:
        return StudioInputsProtobuf.STUDIO_INPUT_UNSET
      case StudioInputs.Number:
        return StudioInputsProtobuf.STUDIO_INPUT_NUMBER
      case StudioInputs.SelectMulti:
        return StudioInputsProtobuf.STUDIO_INPUT_SELECT_MULTI
      case StudioInputs.Select:
        return StudioInputsProtobuf.STUDIO_INPUT_SELECT
      case StudioInputs.Points:
        return StudioInputsProtobuf.STUDIO_INPUT_POINTS
      case StudioInputs.String:
        return StudioInputsProtobuf.STUDIO_INPUT_STRING
      case StudioInputs.TimeMinutes:
        return StudioInputsProtobuf.STUDIO_INPUT_TIME_MINUTES
      default:
        throw new Error('Unknown studio input type')
    }
  }

  createTargetsBySource(metas: EventMetadata, targetTree: StudioTargetTree): StudioTarget[] {
    const targets: StudioTarget[] = []

    for (const id of metas.targets) {
      const target = {
        label: targetTree[metas.targetSource][id].label,
        description: targetTree[metas.targetSource][id].description,
        id: id,
        group: targetTree[metas.targetSource][id].group
      } as StudioTarget

      targets.push(target)
    }

    return targets
  }

  createPlayerTargets(game: Game) {
    const targets = []

    for (const player of game.players) {
      const team = game.teams[player.team]
      const target = {
        label: player.name,
        id: player.id,
        group: team?.name,
      } as StudioTarget

      targets.push(target)
    }

    return targets
  }

  createTeamTargets(game: Game): StudioTarget[] {
    const targets = []

    for (const [_, team] of Object.entries(game.teams)) {
      const target = {
        label: team.name,
        id: team.id
      } as StudioTarget

      targets.push(target)
    }

    return targets
  }

  addDatasource(provider: string, sport: string, datasource: Datasource) {
    if(!this.sources[provider]) {
      this.sources[provider] = {}
    }
    this.sources[provider][sport] = datasource
  }
}
