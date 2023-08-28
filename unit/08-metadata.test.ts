
import { MetadataService } from "../src/services/studio/metadata.service"
import path = require('path')

describe('Metadata tests', function () {

  let service: MetadataService

  before(() => {
    service = new MetadataService()
  })

  it('condition data for ui', () => {
    service.loadSportradarGames(path.resolve(__dirname, "../games/sportradar/basketball"), "basketball")
    const gameId = "0d996d35-85e5-4913-bd45-ac9cfedbf272"
    const data = service.getConditionData(gameId, true)
    console.log(JSON.stringify(data, null, 4))
  })

  it('should load nvenue games', () => {
    service.loadMlbVenueGames(path.resolve(__dirname, "../games/nvenue/mlb_games.json"))
  })

  it('should load nvenue teams', () => {
    service.loadMlbVenueTeams(path.resolve(__dirname, "../games/nvenue/mlb_teams.json"))
  })

  it('should load nvenue players', () => {
    service.loadMlbVenuePlayers(path.resolve(__dirname, "../games/nvenue/mlb_players.json"))
  })

})
