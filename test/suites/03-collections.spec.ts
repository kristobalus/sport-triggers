import { TriggerConditionCollection } from "../../src/repositories/trigger-condition.collection"
import { init, stop } from "../helpers/common"
import { TestContext } from "../module"
import { TriggerCollection } from "../../src/repositories/trigger.collection"

interface SuitContext extends TestContext {
  triggers?: TriggerCollection
  conditions?: TriggerConditionCollection
}

describe(`Test collections`, function() {
  const ctx: SuitContext = {}

  before(async () => {
    await init(ctx)
    ctx.triggers = new TriggerCollection(ctx.service.redis)
    ctx.conditions = new TriggerConditionCollection(ctx.service.redis)
  })

  after(async () => {
    await stop(ctx)
  })

  it('should create trigger', async () => {
    const { triggers } = ctx
    const id = await triggers.create({
      name: "home points 30+",
      description: "should trigger when home points reach 30 or more",
      datasource: "sportradar",
      scope: "game",
      scopeId: "d8539eb6-3e27-40c8-906f-9cd1736321d8",
      conditions: [
        {
          id: "{uuid}",
          event: "game.home_points",
          type: "set-and-compare",
          compare: "ge",
          target: 30
        }
      ]
    })

    console.log('triggerId', id)
  })
})
