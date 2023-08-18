import { SignedRequestOptions } from "./configs/auth"

export interface TriggerConfig {
  triggerLifetimeSeconds: number
}

declare module '@microfleet/core-types' {
  export interface ConfigurationOptional {
    triggers: TriggerConfig
    signedRequest: SignedRequestOptions
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
