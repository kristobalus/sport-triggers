
import { randomUUID } from "crypto"
import { MetadataService } from "../src/services/studio/metadata.service"

describe('Metadata tests', function () {

  it('condition data for screen', () => {
    const service = new MetadataService()
    const data = service.getConditionData(randomUUID(), true)
    console.log(JSON.stringify(data, null, 4))
  })

})
