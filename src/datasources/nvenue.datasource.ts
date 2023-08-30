import fs = require('fs')

import { Game } from '../models/studio/game'
import { Game as NVenueGame } from "../models/nvenue/game"
import { Team as NVenueTeam } from "../models/nvenue/team"
import { Team } from "../models/studio/team"
import { TeamMlb } from "../models/mlb/team.mlb"
import { PlayerMlb } from "../models/mlb/player.mlb"
import { Datasource } from "../models/studio/datasource"
import { Sport } from "../models/studio/sport"
import { Player } from "../models/studio/player"

export class NvenueDatasource implements Datasource {

  private games: Map<string, Game> = new Map<string, Game>

  getGame(gameId: string): Game {
    return this.games.get(gameId)
  }

  loadGames(
    nvGamesFile: string,
    mlbTeamFile: string,
    mlbPlayerFile: string,
    sport: Sport) {

    if (!fs.existsSync(nvGamesFile)) {
      throw new Error(`${nvGamesFile} not found`)
    }

    if (!fs.existsSync(mlbTeamFile)) {
      throw new Error(`${mlbTeamFile} not found`)
    }

    if (!fs.existsSync(mlbPlayerFile)) {
      throw new Error(`${mlbPlayerFile} not found`)
    }

    const teamToPlayerDictionary = require(mlbPlayerFile) as Record<string, PlayerMlb[]>

    const mlbTeams = require(mlbTeamFile) as TeamMlb[]
    const mlbTeamsMap: Map<string, TeamMlb> = new Map()
    for (const team of mlbTeams) {
      mlbTeamsMap.set(team.name_abbrev, team)
      if (mlbTeamsMap.has(team.bis_team_code) ) {
        const t2 = mlbTeamsMap.get(team.bis_team_code)
        if ( t2.team_id !== team.team_id ) {
          throw new Error(`Duplicate team: ${team.bis_team_code} same abbr for different id`)
        }
      }
      mlbTeamsMap.set(team.bis_team_code, team)
    }

    const nvGames = require(nvGamesFile) as NVenueGame[]
    for (const nvGame of nvGames) {

      console.log(nvGame.nv_game_id, nvGame.scheduled, nvGame.home_abbr, nvGame.away_abbr)

      const homeTeam = mlbTeamsMap.get(nvGame.home_abbr)
      const awayTeam = mlbTeamsMap.get(nvGame.away_abbr)

      if (!homeTeam) {
        // throw new Error(`Team not found ${nvGame.home_abbr}`)
        console.log(`Skipped game since team ${nvGame.home_abbr} not found in MLB`)
        continue;
      }

      if (!awayTeam) {
        // throw new Error(`Team not found ${nvGame.away_abbr}`)
        console.log(`Skipped game since team ${nvGame.away_abbr} not found in MLB`)
        continue;
      }

      const homePlayers = teamToPlayerDictionary[homeTeam.team_id]
      const awayPlayers = teamToPlayerDictionary[awayTeam.team_id]

      if (!homePlayers) {
        throw new Error(`Players not found ${nvGame.home_abbr}`)
      }

      if (!awayPlayers) {
        throw new Error(`Players not found ${nvGame.away_abbr}`)
      }

      const players = []
      const joinedMlbPlayers = [
        ...homePlayers,
        ...awayPlayers,
      ]
      for(const mlbPlayer of joinedMlbPlayers) {
        const player: Player = {
          id: mlbPlayer.player_id,
          jersey_number: mlbPlayer.jersey_number,
          name: mlbPlayer.name_full,
          position: mlbPlayer.position_txt,
          primary_position: mlbPlayer.primary_position,
          team: mlbPlayer.team_abbrev
        }
        players.push(player)
      }

      const game: Game = {
        datasource: 'nvenue',
        scope: 'game',
        sport: sport,
        id: nvGame.nv_game_id,
        players: players,
        teams: {},
        home: nvGame.home_abbr,
        away: nvGame.away_abbr,
      }

      if (!homeTeam) {
        // throw new Error("Team not found: " + nvGame.home_abbr)
        console.log(`Game skipped since home team not found`, nvGame.home_abbr)
        continue
      }

      if (!awayTeam) {
        // throw new Error("Team not found: " + nvGame.away_abbr)
        console.log(`Game skipped since away team not found`, nvGame.away_abbr)
        continue
      }

      game.teams[nvGame.home_abbr] = {
        id: homeTeam.name_abbrev,
        name: homeTeam.name_display_long,
        home: true,
      } as Team

      game.teams[nvGame.away_abbr] = {
        id: awayTeam.name_abbrev,
        name: awayTeam.name_display_long,
        home: true,
      } as Team

      this.games.set(game.id, game)
    }
  }

  printGames(nvGamesFile: string) {
    const nvGames = require(nvGamesFile) as NVenueGame[]
    for (const nvGame of nvGames) {
      const row = [
        nvGame.status,
        nvGame.season,
        nvGame.season_type,
        nvGame.mlb_game_id,
        nvGame.nv_game_id,
        nvGame.scheduled,
        nvGame.home_abbr,
        nvGame.away_abbr,
      ]
      console.log(row.join(","))
    }
  }

  printTeams(nvTeamsFile: string) {
    const nvTeams = require(nvTeamsFile) as NVenueTeam[]
    for (const nvTeam of nvTeams) {
      const row = [
        nvTeam.abbr,
        nvTeam.name,
        nvTeam.division,
        nvTeam.league,
      ]
      console.log(row.join(","))
    }
  }

}
