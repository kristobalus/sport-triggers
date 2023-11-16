// import { MetadataService } from "../src/services/studio/metadata.service"
import path = require('path')
import { NvenueDatasource } from "../src/datasources/nvenue.datasource"
import { MetadataService } from "../src/services/studio/metadata.service"
import { MlbDatasource } from "../src/datasources/mlb.datasource"
import { Sport } from "../src/models/events/sport"
import assert from "assert"

describe('Metadata tests', function () {

  // let service: MetadataService

  // before(() => {
  //   service = new MetadataService()
  // })

  // it('condition data for ui', () => {
  //   service.loadSportradarGames(path.resolve(__dirname, "../games/sportradar/basketball"), "basketball")
  //   const gameId = "0d996d35-85e5-4913-bd45-ac9cfedbf272"
  //   const datasource = "sportradar"
  //   const data = service.getConditionData(datasource, gameId, true)
  //   console.log(JSON.stringify(data, null, 4))
  // })

  it('should fetch mlb data', async () => {
    const mlb = new MlbDatasource()
    await mlb.exportPlayersToFile("2023", path.resolve(__dirname, '../games/mlb/players.json'))
    await mlb.exportTeamsToFile("2023", path.resolve(__dirname, '../games/mlb/teams.json'))
  })

  it('should load nvenue datasource', () => {
    const nvenue = new NvenueDatasource()

    nvenue.loadGames(
      path.resolve(__dirname, '../games/nvenue/baseball/games'),
      path.resolve(__dirname, '../games/mlb/teams.json'),
      path.resolve(__dirname, '../games/mlb/players.json'),
      Sport.Baseball)
  })

  it('should list teams', () => {
    const nvenue = new NvenueDatasource()
    nvenue.printTeams(path.resolve(__dirname, '../games/nvenue/baseball/teams.json'))
  })

  it('should list games', () => {
    const nvenue = new NvenueDatasource()
    nvenue.printGames(path.resolve(__dirname, '../games/nvenue/baseball/games/games_2023_3.json'))
  })

  it('should get metadata for nvenue', async () => {
    const nvenue = new NvenueDatasource()

    nvenue.loadGames(
      path.resolve(__dirname, '../games/nvenue/baseball/games'),
      path.resolve(__dirname, '../games/mlb/teams.json'),
      path.resolve(__dirname, '../games/mlb/players.json'),
      Sport.Baseball)

    const service = new MetadataService()

    service.addDatasource("nvenue", nvenue)

    const gameId = "1bb653b1-2bf4-418b-bf9e-fc53c29a28b5"
    // const datasource = "nvenue"
    // const data = service.getStudioConfigData(datasource, gameId, true)
    //console.log(JSON.stringify(data, null, 4))

    const game = nvenue.getGame(gameId)
    assert(game, 'should find game by gameId')

    const teams = game.teams
    for(const [id, team] of Object.entries(teams)) {
      assert(id === team.id)
    }

    const data = service.getStudioConfigData("nvenue", gameId, true)
    console.log(JSON.stringify(data, null, 2))
  })

})
