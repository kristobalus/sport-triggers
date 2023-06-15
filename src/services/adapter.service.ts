
import { Microfleet } from "@microfleet/core-types"


export class AdapterService {
  constructor(
    private readonly log: Microfleet['log']
  ) {}

  async pushEvent(event: any) {
    this.log.debug({ event }, `incoming event`)
  }

}
