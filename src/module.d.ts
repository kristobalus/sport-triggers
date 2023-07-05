export type TriggerConfig = {
  triggerLifetimeSeconds: number
}

declare module '@microfleet/core-types' {
  export interface ConfigurationOptional {
    triggers: TriggerConfig
  }
}

declare module 'ioredis' {
  export interface Redis {
    set_and_compare(
      numberOfKeys: 1,
      conditionKey: string,
      current: string,
      ...options: string[]
    ): Promise<any>
    incr_and_compare(
      numberOfKeys: 1,
      conditionKey: string,
      currentValue: string,
      compareOp: string
    ): Promise<[number, number]>
  }
}
