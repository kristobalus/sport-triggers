
export interface Event {
  // unique raw event identifier from datasource
  id: string
  // scope of event
  scope: string
  // unique scope identifier, e.g. d8539eb6-3e27-40c8-906f-9cd1736321d8,
  // adapter takes it from datasource raw data
  scopeId: string
  // event name
  name: string
  // event value
  value: string
  // timestamp, unixtime millis
  timestamp: number
}

