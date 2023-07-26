
import fs = require("fs");
import _ = require("lodash");
import assert = require("assert");

import { Game } from "../../models/studio/game"
import { Game as SportradarGame } from "../../models/sportradar/game"
import { metadata, targetTree } from "../../studio"
import { EventMetadata } from "../../models/events/event-metadata"
import { StudioConditionData } from "../../models/studio/studio.condition-data"
import { StudioEvent } from "../../models/studio/studio.event"
import { StudioTargetTree } from "../../models/studio/studio.target-tree"
import { StudioTarget } from "../../models/studio/studio.target"
import { CommonSources } from "../../studio/common-sources"
import { StudioInputs } from "../../models/studio/studio.inputs"
import { StudioInputsProtobuf } from "../../models/studio/studio.inputs.protobuf"
import { Team } from "../../models/studio/team"
import { Player } from "../../models/studio/player"


export type Sport = "basketball"

export class MetadataService {

  private games: Record<string, Map<string, Game>> = {
    basketball: new Map(),
  }

  constructor() {}

  getConditionData(
    gameId: string,
    sport: string,
    shouldMapEnum: boolean = false): StudioConditionData {

    const game = this.getGame(gameId, sport)

    const result: StudioConditionData = {
      index: [],
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
        input: shouldMapEnum ? this.getStudioInputMapped(data.input) :data.input,
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

      result.events[item.id] = item;
      result.index.push(item.id);
    }
    return result
  }

  createTargetsBySource(metas: EventMetadata, targetTree: StudioTargetTree) : StudioTarget[] {
      const targets: StudioTarget[] = []
      for(const id of metas.targets){

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
    for(const player of game.players){
      const team = game.teams[player.team]
      const target = {
        label: player.name,
        id: player.id,
        group: team?.name,
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

  getGame(gameId: string, sport: string): Game {
    assert(this.games[sport], `games for sport ${sport} not found`)
    return this.games[sport].get(gameId)
  }

  getStudioInputMapped(input: StudioInputs): StudioInputsProtobuf {
    switch (input) {
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
        throw new Error("Unknown studio input type")
    }
  }

  loadGames(dir: string, sport: Sport) {
    if (!fs.existsSync(dir)) {
      throw new Error("Games dir not found")
    }

    const stats = fs.statSync(dir)
    if (stats.isFile()) {
      throw new Error("Provided path is not a folder")
    }

    const files = fs.readdirSync(dir)
    for (const file of files) {
      const filePath = `${dir}/${file}`
      const data = require(filePath) as SportradarGame

      const players: Player[] = []
      for(const period of data.periods){
        for(const event of period.events) {
          if ( event.on_court ) {
            const { home, away } = event.on_court

            for(const player of away.players){
              players.push({
                id: player.id,
                name: player.full_name,
                team: away.id,
                position: player.position,
                primary_position: player.primary_position,
                jersey_number: player.jersey_number
              } as Player)
            }

            for(const player of home.players){
              players.push({
                id: player.id,
                name: player.full_name,
                team: home.id,
                position: player.position,
                primary_position: player.primary_position,
                jersey_number: player.jersey_number
              } as Player)
            }
          }

        }
      }

      const homeTeam: Team = {
        id: data.home.id,
        name: data.home.name,
        home: true
      }

      const awayTeam: Team = {
        id: data.away.id,
        name: data.away.name,
        home: false
      }

      const game: Game = {
        datasource: "sportradar",
        scope: "game",
        sport: sport,
        id: data.id,
        players: _.uniqBy(players, player => player.id),
        teams: {},
        home: homeTeam.id,
        away: awayTeam.id
      }

      game.teams[homeTeam.id] = homeTeam
      game.teams[awayTeam.id] = awayTeam

      this.games[sport].set(game.id, game)
    }
  }

  getDatasource() {
    return "sportradar"
  }
}
