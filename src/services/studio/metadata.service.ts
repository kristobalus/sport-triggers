
import { StudioConfigData } from '../../models/studio/studio-config.data'
import { metadata, targetTree } from '../../sports'
import { StudioEvent } from '../../models/studio/studio.event'
import { CommonSources } from '../../sports/common-sources'
import { Game } from '../../models/studio/game'
import { StudioInputs } from '../../models/studio/studio.inputs'
import { StudioInputsProtobuf } from '../../models/studio/studio.inputs.protobuf'
import { EventMetadata } from '../../models/events/event-metadata'
import { StudioTargetTree } from '../../models/studio/studio.target-tree'
import { StudioTarget } from '../../models/studio/studio.target'
import { Datasource } from '../../models/studio/datasource'

export class MetadataService {
  private sources: Map<string, Datasource> = new Map<string, Datasource>()

  getStudioConfigData(
    datasource: string,
    gameId: string,
    shouldMapEnum = false) {
    const ds = this.sources.get(datasource)

    if (!ds) {
      throw new Error(`Datasource ${datasource} not found`)
    }

    const game = ds.getGame(gameId)

    if (!game) {
      throw new Error(`Game ${gameId} not found in datasource ${datasource}`)
    }

    const studioConfig: StudioConfigData = {
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

    for (const [eventName, eventMeta] of Object.entries(metadata) ) {
      if ( eventMeta.disabled ) { continue }
      if ( game.sport != eventMeta.sport ) { continue }

      const studioEvent: StudioEvent = {
        id: eventName,
        sport: eventMeta.sport,
        primary: eventMeta.primary,
        input: shouldMapEnum ? this.getStudioInputMapped(eventMeta.input) : eventMeta.input,
        label: eventMeta.label,
        compare: eventMeta.compare,
        ...(eventMeta.targetSource ? { targetSource: eventMeta.targetSource } : {}),
        ...(eventMeta.preferredOptions ? { preferredOptions: eventMeta.preferredOptions } : {})
      }

      if ( eventMeta.targetSource ) {
        if (!studioConfig.sources[eventMeta.targetSource]) {
          let targets

          if ( eventMeta.targetSource == CommonSources.GameTeams ) {
            targets = this.createTeamTargets(game)
          }
          else if ( eventMeta.targetSource == CommonSources.GamePlayers ) {
            targets = this.createPlayerTargets(game)
          }
          else if ( targetTree[eventMeta.targetSource] ) {
            targets = this.createTargetsBySource(eventMeta, targetTree)
          }

          if (targets) {
            studioConfig.sources[eventMeta.targetSource] = { targets }
          }
        }
      }

      studioConfig.events[studioEvent.id] = studioEvent
      studioConfig.index.push(studioEvent.id)
    }

    return studioConfig
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

  createTargetsBySource(meta: EventMetadata, targetTree: StudioTargetTree): StudioTarget[] {
    const targets: StudioTarget[] = []

    const branch = targetTree[meta.targetSource]
    const keys = meta?.targets?.length > 0
      ? meta.targets
      : Object.keys(branch)

    for (const id of keys) {
      const target = {
        label: branch[id].label,
        description: branch[id].description,
        id: id,
        group: branch[id].group
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

  addDatasource(id: string, datasource: Datasource) {
    this.sources.set(id, datasource)
  }

  getDatasource(id: string): Datasource {
    return this.sources.get(id)
  }
}
