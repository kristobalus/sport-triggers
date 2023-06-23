
// noinspection ES6UnusedImports

import { Redis } from "ioredis"

declare module 'ioredis' {
  export interface Redis {
    set_and_compare(
      numberOfKeys: 1,
      conditionKey: string,
      currentValue: number,
    ): Promise<[ number, number ]>
    set_and_compare_as_string(
      numberOfKeys: 1,
      conditionKey: string,
      currentValue: string,
    ): Promise<[ number, number ]>
    incr_and_compare(
      numberOfKeys: 1,
      conditionKey: string,
      currentValue: string,
      compareOp: string
    ): Promise<[ number, number ]>
  }
}
