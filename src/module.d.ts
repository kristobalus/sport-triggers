export interface TriggerConfig {
  triggerLifetimeSeconds: number
}

export interface AdapterConfig {
  digestApiKey: string
  digestAlgorithm: string
  digestHeader: string
}

declare module '@microfleet/core-types' {
  export interface ConfigurationOptional {
    triggers: TriggerConfig
    adapter: AdapterConfig
  }
}

declare module 'ioredis' {
  export interface Redis {
    set_and_compare(
      numberOfKeys: 2,
      conditionKey: string,
      eventLogKey: string,
      eventJson: string
    ): Promise<any>
  }
}
