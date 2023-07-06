
### incoming event from nVenue
example:

```json
{
  "id": "{guid}",
  "datasource": "nvenue",
  "scope": "game",
  "scopeId": "{guid}",
  "options": {
    "baseball.pitch.result": "ball",
    "baseball.pitch.speed": "70",
    "baseball.player": "{guid}"
    "baseball.team": "{guid}"
    "baseball.inning": "10" 
  }
}
```
that is 
```ts
enum Events {
  PitchSpeed = "baseball.pitch.speed",
  PitchResult = "baseball.pitch.result"   
}

type EventValue = string

export interface AdapterEvent {
  id: string
  datasource: string
  scope: string
  scopeId: string
  options: Record<BaseballEvents, EventValue>
}
```

condition set by Studio
```json
{
  "chainOperation": "and",
  "event": "baseball.ball",   
  "aggregate": "sum",
  "compare": "ge",
  "target": "90",
  "options": [
    {
      "event": "baseball.inning",
      "compare": "eq",
      "target": "1",
    }
  ]
}
```

```json
{
  "chainOperation": "and",
  "event": "baseball.pitch.speed",
  "compare": "ge",
  "target": "90",
  "options": [
    {
      "event": "baseball.inning",
      "compare": "eq",
      "target": "1",
    },
    {
      "event": "baseball.player",
      "compare": "eq",
      "target": "{guid}",
    }
  ]
}
```
that is 


```ts

type CompareOp = "eq","lt","gt","le","ge"
type ConditonType = "set-and-compare"

interface TriggerConditionOptions {
  event: string
  compare: CompareOp
  target: string
}

interface EssentialConditionData {
   // event name
   event: string   
   // comparison operation, should be used to compare "current" and "target" and return a boolean
   compare: CompareOp   
   // target value of the event, threshold value to compare with
   target: string | number
   // options required to match condition
   options: TriggerConditionOptions[]
}
```

Studio sends request to create triggers

```json
{
  "trigger": {
    "name": "...my trigger...",
    "description": "..my description...",
    "datasource": "nvenue",
    "scope": "game",
    "scopeId": "c24ad602-2290-4787-9b22-81e4e32dd582",
    "entity": "moderation",
    "entityId": "654"
  },
  "conditions": [
    {
      "event": "baseball.pitch.speed",
      "chainOperation": "and",
      "compare": "ge",
      "target": "90",
      "options": [
        {
          "event": "baseball.inning",
          "compare": "ge",
          "target": "0",
        },
        {
          "event": "baseball.player",
          "compare": "eq",
          "target": "{guid}",
        }
      ]
    }
  ]
}
```
