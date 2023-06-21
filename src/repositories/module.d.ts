
// noinspection ES6UnusedImports

import { Redis } from "ioredis"

declare module 'ioredis' {
  export interface Redis {
    set_and_compare(
      conditionKey: string,
      currentValue: number,
    ): Promise<boolean>
    set_and_compare_as_string(
      conditionKey: string,
      currentValue: string,
    ): Promise<boolean>
    incr_and_compare(
      conditionKey: string,
      currentValue: string,
      compareOp: string
    ): Promise<void>
  }
}
