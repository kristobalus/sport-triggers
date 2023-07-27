
import { MetadataService } from "../src/services/studio/metadata.service"
import path = require('path')

describe('Metadata tests', function () {

  let service: MetadataService
  before(() => {
    service = new MetadataService()
    service.loadGames(path.resolve(__dirname, "../games/basketball"), "basketball")
  })

  it('condition data for screen', () => {
    const gameId = "0d996d35-85e5-4913-bd45-ac9cfedbf272"
    const data = service.getConditionData(gameId, true)
    console.log(JSON.stringify(data, null, 4))
  })

})
