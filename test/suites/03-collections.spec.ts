import { TriggerConditionCollection } from "../../src/repositories/trigger-condition.collection"
import { init, stop } from "../helpers/common"
import { TestContext } from "../module"
import { TriggerCollection } from "../../src/repositories/trigger.collection"
import { TriggerSubscriptionCollection } from "../../src/repositories/trigger-subscription.collection"
import * as assert from "assert"
import { randomUUID } from "crypto"

interface SuitContext extends TestContext {
  triggerCollection?: TriggerCollection
  conditionCollection?: TriggerConditionCollection
  subscriptionCollection?: TriggerSubscriptionCollection
  triggerId?: string
}

describe(`Collections`, function () {

  const ctx: SuitContext = {}
  const eventName = "football.game.points.home"
  const eventTarget = 1
  const scope = "game"
  const scopeId = randomUUID()

  before(async () => {
    await init(ctx)
    ctx.triggerCollection = new TriggerCollection(ctx.service.redis)
    ctx.conditionCollection = new TriggerConditionCollection(ctx.service.redis)
    ctx.subscriptionCollection = new TriggerSubscriptionCollection(ctx.service.redis)
  })

  after(async () => {
    await stop(ctx)
  })

  it('should be able to add trigger', async () => {
    const { triggerCollection } = ctx

    ctx.triggerId = await triggerCollection.add({
      name: "home points 30+",
      description: "should trigger when home points reach 30 or more",
      datasource: "sportradar",
      scope: "game",
      scopeId: "d8539eb6-3e27-40c8-906f-9cd1736321d8",
    })

    assert.ok(ctx.triggerId)
  })

  it('should be able to add conditions', async () => {
    const { conditionCollection } = ctx
    await conditionCollection.add(ctx.triggerId, scope, scopeId, [
      {
        event: eventName,
        type: "set-and-compare",
        compare: "eq",
        target: eventTarget,
      },
    ])
  })

  it('should be able to fetch trigger by id', async () => {
    const { triggerCollection } = ctx

    const trigger = await triggerCollection.getOneById(ctx.triggerId)
    assert.ok(trigger)
    assert.equal(trigger.id, ctx.triggerId)
  })

  it('should be able to fetch conditions by trigger id', async () => {
    const { conditionCollection } = ctx

    const conditions = await conditionCollection.getByTrigger(ctx.triggerId)
    assert.ok(conditions)
    assert.equal(conditions.length, 1)
    const [condition] = conditions
    assert.equal(condition.event, eventName)
    assert.equal(condition.target, eventTarget)
  })

  it('should be able to find trigger id by event and scope', async () => {
    const { conditionCollection } = ctx

    const triggers = await conditionCollection.findTriggersByScopeAndEvent(scope, scopeId, eventName)
    assert.ok(triggers)
    assert.equal(triggers[0], ctx.triggerId)
  })

})
