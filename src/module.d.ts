
// noinspection ES6UnusedImports

import { Redis } from "ioredis"
import { ConfigurationRequired } from '@microfleet/core-types'

declare module 'ioredis' {
  export interface Redis {
    set_and_compare(
      conditionKey: string,
      currentValue: number,
    ): Promise<[ number, number ]>
    set_and_compare_as_string(
      conditionKey: string,
      currentValue: string,
    ): Promise<[ number, number ]>
    incr_and_compare(
      conditionKey: string,
      currentValue: string,
      compareOp: string
    ): Promise<[ number, number ]>
  }
}
