import fs = require('fs')

import { Game } from '../models/studio/game'
import { Game as NVenueGame } from '../models/nvenue/game'
import { Team as NVenueTeam } from '../models/nvenue/team'
import { Team } from '../models/studio/team'
import { TeamMlb } from '../models/mlb/team.mlb'
import { PlayerMlb } from '../models/mlb/player.mlb'
import { Datasource } from '../models/studio/datasource'
import { Sport } from '../models/studio/sport'
import { Player } from '../models/studio/player'
import path from 'path'

export class NvenueDatasource implements Datasource {
  private games: Map<string, Game> = new Map<string, Game>

  getGame(gameId: string): Game {
    return this.games.get(gameId)
  }

  loadGames(
    nvGamesDir: string,
    mlbTeamFile: string,
    mlbPlayerFile: string,
    sport: Sport) {


    if (!fs.existsSync(nvGamesDir)) {
      throw new Error(`${nvGamesDir} not found`)
    }

    if (!fs.existsSync(mlbTeamFile)) {
      throw new Error(`${mlbTeamFile} not found`)
    }

    if (!fs.existsSync(mlbPlayerFile)) {
      throw new Error(`${mlbPlayerFile} not found`)
    }

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const teamToPlayerDictionary = require(mlbPlayerFile) as Record<string, PlayerMlb[]>

    // eslint-disable-next-line @typescript-eslint/no-var-requires
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

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    // List all files in the directory
    const nvGameFiles = fs.readdirSync(nvGamesDir);

    const nvGames: NVenueGame[] = []
    for (let fileName of nvGameFiles) {
      const filePath = path.join(nvGamesDir, fileName);
      // Check if the item is a file
      const stat = fs.statSync(filePath);
      if (stat.isFile()) {
        const content = require(filePath)
        nvGames.push(...content)
      }
    }

    for (const nvGame of nvGames) {
      // eslint-disable-next-line no-console
      // console.log(nvGame.nv_game_id, nvGame.scheduled, nvGame.home_abbr, nvGame.away_abbr)

      const homeTeam = mlbTeamsMap.get(nvGame.home_abbr)
      const awayTeam = mlbTeamsMap.get(nvGame.away_abbr)

      if (!homeTeam) {
        // throw new Error(`Team not found ${nvGame.home_abbr}`)
        // eslint-disable-next-line no-console
        // console.log(`Skipped game ${nvGame.nv_game_id} since nVenue game team ${nvGame.home_abbr} not found in MLB`)
        continue
      }

      if (!awayTeam) {
        // throw new Error(`Team not found ${nvGame.away_abbr}`)
        // eslint-disable-next-line no-console
        // console.log(`Skipped game ${nvGame.nv_game_id} since nVenue game team ${nvGame.away_abbr} not found in MLB`)
        continue
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

      for (const mlbPlayer of joinedMlbPlayers) {
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
        // eslint-disable-next-line no-console
        // console.log(`Game ${nvGame.nv_game_id} skipped since home team not found`, nvGame.home_abbr)
        continue
      }

      if (!awayTeam) {
        // throw new Error("Team not found: " + nvGame.away_abbr)
        // eslint-disable-next-line no-console
        // console.log(`Game ${nvGame.nv_game_id} skipped since away team not found`, nvGame.away_abbr)
        continue
      }

      game.teams[nvGame.home_abbr] = {
        id: nvGame.home_abbr,
        name: homeTeam.name_display_long,
        home: true,
      } as Team

      game.teams[nvGame.away_abbr] = {
        id: nvGame.away_abbr,
        name: awayTeam.name_display_long,
        home: true,
      } as Team

      this.games.set(game.id, game)
    }
  }

  printGames(nvGamesFile: string) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
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

      // eslint-disable-next-line no-console
      console.log(row.join(','))
    }
  }

  printTeams(nvTeamsFile: string) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const nvTeams = require(nvTeamsFile) as NVenueTeam[]

    for (const nvTeam of nvTeams) {
      const row = [
        nvTeam.abbr,
        nvTeam.name,
        nvTeam.division,
        nvTeam.league,
      ]

      // eslint-disable-next-line  no-console
      console.log(row.join(','))
    }
  }
}
