
// import { MetadataService } from "../src/services/studio/metadata.service"
import path = require('path')
import { NvenueDatasource } from "../src/services/studio/datasources/nvenue.datasource"

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

  it('should load nvenue datasource', () => {
    const nvenue = new NvenueDatasource()
    nvenue.loadGames(
      path.resolve(__dirname, '../games/nvenue/baseball/games.json'),
      path.resolve(__dirname, '../games/nvenue/baseball/players.json'),
      path.resolve(__dirname, '../games/nvenue/baseball/teams.json'),
      'baseball')
  })

  it('should list teams', () => {
    const nvenue = new NvenueDatasource()
    nvenue.listTeams(path.resolve(__dirname, '../games/nvenue/baseball/teams.json'))
  })


})
