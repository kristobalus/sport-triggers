import { Microfleet } from "@microfleet/core-types"

export class StudioService {

  constructor(
    private log: Microfleet['log']
  ) {}

  async createTrigger(_data) {
    this.log.debug("create trigger")
  }

  async deleteTrigger(_data) {
    this.log.debug("delete trigger")
  }

  async subscribeTrigger(_data) {
    this.log.debug("subscribe for trigger")
  }

  async unsubscribeTrigger(_data) {
    this.log.debug("unsubscribe from trigger")
  }

  async getTriggerList(_data) {
    this.log.debug("get list of triggers")
  }


}
