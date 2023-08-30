
import fs = require('fs');

// import _ = require('lodash');

import { Game } from '../../../models/studio/game'
// import { Game as NvenueGame } from '../../../models/nvenue/game'
// import { metadata, targetTree } from '../../../sports'
// import { EventMetadata } from '../../../models/events/event-metadata'
// import { StudioConditionData } from '../../../models/studio/studio.condition-data'
// import { StudioEvent } from '../../../models/studio/studio.event'
// import { StudioTargetTree } from '../../../models/studio/studio.target-tree'
// import { StudioTarget } from '../../../models/studio/studio.target'
// import { CommonSources } from '../../../sports/common-sources'
// import { StudioInputs } from '../../../models/studio/studio.inputs'
// import { StudioInputsProtobuf } from '../../../models/studio/studio.inputs.protobuf'
// import { Player } from '../../../models/studio/player'
import { Game as NVenueGame }  from "../../../models/nvenue/game"
import { Team as NVenueTeam }  from "../../../models/nvenue/team"
import { Player as NVenuePlayer }  from "../../../models/nvenue/player"
import { Datasource, Sport } from "../metadata.service"
import { Team } from "../../../models/studio/team"

export class NvenueDatasource implements Datasource {

  private games: Map<string, Game> = new Map<string, Game>

  getGame(gameId: string): Game {
    return this.games.get(gameId)
  }

  loadGames(nvGamesFile: string, nvTeamFile: string, _nvPlayerFile: string, sport: Sport) {

    if (!fs.existsSync(nvGamesFile)) {
      throw new Error(`${nvGamesFile} not found`)
    }

    if (!fs.existsSync(_nvPlayerFile)) {
      throw new Error(`${_nvPlayerFile} not found`)
    }

    if (!fs.existsSync(nvTeamFile)) {
      throw new Error(`${nvTeamFile} not found`)
    }

    const nvPlayers = require(nvTeamFile) as NVenuePlayer[]
    const players: Map<any, NVenuePlayer> = new Map()
    // const teamPlayers: Map<any, NVenuePlayer[]> = new Map()
    for(const player of nvPlayers){
      // console.log(player.mlbam_id, player.first_name, player.last_name, player.preferred_name)
      players.set(player.mlbam_id, player)
    }

    const nvTeams = require(nvTeamFile) as NVenueTeam[]
    const teams: Map<string, NVenueTeam> = new Map()
    for(const team of nvTeams){
      // console.log(team.abbr, team.name, team.division)
      teams.set(team.abbr, team)
    }

    const nvGames = require(nvGamesFile) as NVenueGame[]
    for(const nvGame of nvGames){
      console.log(nvGame.nv_game_id, nvGame.scheduled, nvGame.home_abbr, nvGame.away_abbr)

      const game: Game = {
        datasource: 'nvenue',
        scope: 'game',
        sport: sport,
        id: nvGame.nv_game_id,
        players: [],
        teams: {},
        home: nvGame.home_abbr,
        away: nvGame.away_abbr
      }

      const homeTeam = teams.get(nvGame.home_abbr)
      const awayTeam = teams.get(nvGame.away_abbr)

      game.teams[nvGame.home_abbr] = {
        id: homeTeam.abbr,
        name: homeTeam.name,
        home: true
      } as Team

      game.teams[nvGame.away_abbr] = {
        id: awayTeam.abbr,
        name: awayTeam.name,
        home: true
      } as Team

      this.games.set(game.id, game)
    }
  }
}
