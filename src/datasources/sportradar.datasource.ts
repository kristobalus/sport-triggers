
import fs = require('fs');

import _ = require('lodash');

import { Game } from '../models/studio/game'
import { Game as SportradarGame } from '../models/sportradar/game'
import { Team } from '../models/studio/team'
import { Player } from '../models/studio/player'
import { Sport } from '../models/studio/sport'

export class SportradarDatasource {
  private games: Map<string, Game> = new Map<string, Game>

  getGame(gameId: string): Game {
    return this.games.get(gameId)
  }

  loadGamesDir(dir: string, sport: Sport) {
    if (!fs.existsSync(dir)) {
      throw new Error('Games dir not found')
    }

    const stats = fs.statSync(dir)

    if (stats.isFile()) {
      throw new Error('Provided path is not a folder')
    }

    const files = fs.readdirSync(dir)

    for (const file of files) {
      const filePath = `${dir}/${file}`
      // eslint-disable-next-line  @typescript-eslint/no-var-requires
      const data = require(filePath) as SportradarGame

      const players: Player[] = []

      for (const period of data.periods) {
        for (const event of period.events) {
          if ( event.on_court ) {
            const { home, away } = event.on_court

            for (const player of away.players) {
              players.push({
                id: player.id,
                name: player.full_name,
                team: away.id,
                position: player.position,
                primary_position: player.primary_position,
                jersey_number: player.jersey_number
              } as Player)
            }

            for (const player of home.players) {
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
        datasource: 'sportradar',
        scope: 'game',
        sport: sport,
        id: data.id,
        players: _.uniqBy(players, player => player.id),
        teams: {},
        home: homeTeam.id,
        away: awayTeam.id
      }

      game.teams[homeTeam.id] = homeTeam
      game.teams[awayTeam.id] = awayTeam

      this.games.set(game.id, game)
    }
  }
}
