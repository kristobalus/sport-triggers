import { Microfleet } from '@microfleet/core-types'

import { Redis } from 'ioredis'

import { TriggerCondition } from '../../models/entities/trigger-condition'
import { ScopeSnapshot } from '../../models/events/scope-snapshot'

export class ConditionEvaluator {
  constructor(
    private redis: Redis,
    private log: Microfleet['log'],
  ) {
  }

  async evaluate(condition: TriggerCondition, snapshot: ScopeSnapshot): Promise<boolean> {
    let activated = true

    for (const option of condition.options) {
      if ( snapshot.options[option.event] !== undefined ) {
        let value

        if (option.aggregate) {
          value = await this.aggregate(option.aggregate)
          this.log.debug({ aggregate: option.aggregate, value }, 'aggregate execution result')
        } else {
          value = snapshot.options[option.event]
        }

        activated = activated && this.compare(option.compare, value, option.targets, option.type)

        this.log.debug({
          'condition.id': condition.id,
          option,
          snapshot,
          activated,
        }, 'option evaluation result')
      }
      else {
        // all options in condition must be found in snapshot
        activated = false
      }

      if (!activated) {
        // all options in condition must be evaluated to true
        break
      }
    } // loop over options in condition

    this.log.debug({ condition, snapshot, activated }, 'condition evaluation result')

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
    const result = false

    if (type === 'number') {
      value = parseFloat(value)
      targets = targets.map((target) => parseFloat(target))
    }

    if (type === 'string') {
      value = String(value)
      targets = targets.map((target) => String(target))
    }

    if (operation === 'in') {
      // Search value in the target set
      const has = (arr: any[], value: any) => arr.includes(value)

      // Equivalent of an OR condition, checks if value is one of several targets
      return has(targets, value)
    }

    // Single target for non-"in" ops
    const target = targets[0]

    if (operation === 'eq') {
      return value === target
    }

    // Only above-mentioned operations are allowed for type "string"
    if (type === 'string') {
      return result
    }

    // Operations below are intended for type "number"
    if (operation === 'gt') {
      return value > target
    }

    if (operation === 'lt') {
      return value < target
    }

    if (operation === 'ge') {
      return value >= target
    }

    if (operation === 'le') {
      return value <= target
    }

    return result
  }
}
