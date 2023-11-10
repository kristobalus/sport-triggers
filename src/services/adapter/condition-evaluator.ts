import { Redis } from "ioredis"
import { Microfleet } from "@microfleet/core-types"
import { TriggerCondition } from "../../models/entities/trigger-condition"
import { EventSnapshot } from "../../models/events/event-snapshot"

export class ConditionEvaluator {
  constructor(
    private redis: Redis,
    private log: Microfleet['log'],
  ) {
  }

  async evaluate(condition: TriggerCondition, event: EventSnapshot): Promise<boolean> {

    let value: any = event.value
    // if (condition.aggregate !== null) {
    //   value = this.ftAggregate(condition.aggregate);
    // } else {
    //   value = event.value;
    // }

    if (condition.event !== event.name) {
      return false
    }

    // Evaluate operation on the main condition (fields targets and operation)
    let activated = this.compare(condition.compare, value, condition.targets, condition.type)

    this.log.trace({
      "condition.id": condition.id,
      "condition.targets": condition.targets,
      "condition.compare": condition.compare,
      "event.name": event.name,
      "event.value": value,
      "condition.activated": activated }, 'condition compared')

    if (activated) {
      // Evaluate options of the condition
      for (const option of condition.options) {
        let found = false

        for (const [name, challenge] of Object.entries(event.options)) {
          found = name === option.event

          if (found) {
            if (option.aggregate) {

              value = await this.aggregate(option.aggregate)

              this.log.debug({ aggregate: option.aggregate, value }, "aggregate execution result")

            } else {
              value = challenge
            }

            const compared = this.compare(option.compare, value, option.targets, option.type)
            activated = activated && compared

            this.log.trace({
              "condition.id": condition.id,
              option,
              event,
              result: activated }, 'option evaluation result')

            break
          }
        }

        if (!found) {
          // option (sub-condition) must be found
          activated = false
        }

        if (!activated) {
          // All options must be evaluated to true
          break
        }
      } // loop over sub-conditions (options)

      this.log.trace({ id: condition.id, event: event.name, activated }, 'condition evaluation')
    }

    return activated
  }

  private async aggregate(query: any[]) {
    const [command, ...args] = query

    // this.log.debug({ command, args }, "aggregate")

    const [, arr] = await this.redis.send_command(command, ...args)

    const result: Record<any, any> = {}
    for (let i = 0; i < arr.length; i += 2) {
      result[arr[i]] = arr[i + 1]
    }

    const { count } = result

    // this.log.debug({ query, result, arr, command, args }, "result of ft.aggregate invocation")

    return count ?? 0
  }

  private compare(operation: string, value: any, targets: any[], type: string): boolean {
    let result = false

    if (type === "number") {
      value = parseFloat(value)
      targets = targets.map((target) => parseFloat(target))
    }

    if (type === "string") {
      value = String(value)
      targets = targets.map((target) => String(target))
    }

    if (operation === "in") {
      // Search value in the target set
      const has = (arr: any[], value: any) => arr.includes(value)

      // Equivalent of an OR condition, checks if value is one of several targets
      return has(targets, value)
    }

    // Single target for non-"in" ops
    const target = targets[0]

    if (operation === "eq") {
      return value === target
    }

    // Only above-mentioned operations are allowed for type "string"
    if (type === "string") {
      return result
    }

    // Operations below are intended for type "number"
    if (operation === "gt") {
      return value > target
    }

    if (operation === "lt") {
      return value < target
    }

    if (operation === "ge") {
      return value >= target
    }

    if (operation === "le") {
      return value <= target
    }

    return result
  }
}
