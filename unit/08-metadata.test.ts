// import { MetadataService } from "../src/services/studio/metadata.service"
import path = require('path')
import { NvenueDatasource } from "../src/datasources/nvenue.datasource"
import { MetadataService } from "../src/services/studio/metadata.service"
import { MlbDatasource } from "../src/datasources/mlb.datasource"
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
      path.resolve(__dirname, '../games/nvenue/baseball/games.json'),
      path.resolve(__dirname, '../games/mlb/teams.json'),
      path.resolve(__dirname, '../games/mlb/players.json'),
      'baseball')
  })

  it('should list teams', () => {
    const nvenue = new NvenueDatasource()
    nvenue.printTeams(path.resolve(__dirname, '../games/nvenue/baseball/teams.json'))
  })

  it('should get metadata for nvenue', async () => {
    const nvenue = new NvenueDatasource()

    nvenue.loadGames(
      path.resolve(__dirname, '../games/nvenue/baseball/games.json'),
      path.resolve(__dirname, '../games/mlb/teams.json'),
      path.resolve(__dirname, '../games/mlb/players.json'),
      'baseball')

    const service = new MetadataService()

    service.addDatasource("nvenue", nvenue)

    const gameId = "f870f9db-0775-497a-88b4-9b27dd372358"
    // const datasource = "nvenue"
    // const data = service.getStudioConfigData(datasource, gameId, true)
    //console.log(JSON.stringify(data, null, 4))

    const game = nvenue.getGame(gameId)
    const teams = game.teams
    for(const [id, team] of Object.entries(teams)) {
      assert(id === team.id)
    }
    console.log(game.teams)
  })

})
