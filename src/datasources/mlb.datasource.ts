import fs from 'fs'

import axios, { AxiosRequestConfig } from 'axios'

import { TeamMlb } from '../models/mlb/team.mlb'
import { PlayerMlb } from '../models/mlb/player.mlb'

export class MlbDatasource {
  async fetchTeamsMlbBySeason(season: string): Promise<TeamMlb[]> {
    const config: AxiosRequestConfig = {
      method: 'get',
      baseURL: 'http://lookup-service-prod.mlb.com/json',
      url: '/named.team_all_season.bam',
      params: {
        sport_code: '\'mlb\'',
        all_star_sw: '\'N\'',
        sort_order: '\'name_asc\'',
        season: `'${season}'`
      }
    }

    const { data } = await axios.request(config)
    
    return data['team_all_season']['queryResults']['row']
  }

  async fetchPlayersMlbByTeam(teamId: string): Promise<PlayerMlb[]>  {
    const config: AxiosRequestConfig = {
      method: 'get',
      baseURL: 'http://lookup-service-prod.mlb.com/json',
      url: '/named.roster_40.bam',
      params: {
        team_id: `'${teamId}'`,
      }
    }

    const { data } = await axios.request(config)
    
    return data['roster_40']['queryResults']['row']
  }

  async exportPlayersToFile(season: string, filepath: string) {
    const teams = await this.fetchTeamsMlbBySeason(season)
    const result: any = {}

    for (const team of teams) {
      const players = await this.fetchPlayersMlbByTeam(team.team_id)

      result[team.team_id] = players
      result[team.team_id] = players
    }

    fs.writeFileSync(filepath, JSON.stringify(result))
  }

  async exportTeamsToFile(season: string, filepath: string) {
    const teams = await this.fetchTeamsMlbBySeason(season)

    fs.writeFileSync(filepath, JSON.stringify(teams))
  }
}
