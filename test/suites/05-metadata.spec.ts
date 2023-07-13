import { randomUUID } from "crypto"
import { MetadataService } from "../../src/services/studio/metadata.service"

describe('Metadata tests', function () {

  it('metadata service', () => {
    const service = new MetadataService()
    const data = service.getMetadata(randomUUID())
    console.log(data)
  })

})
