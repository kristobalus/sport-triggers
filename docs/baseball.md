```typescript
interface Event {
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
```

#### inning
A subdivision of a baseball game. 
In most professional games, there are nine innings, and each inning is divided into two halves. 
The visiting team bats in the top half (first part) of the inning, 
and the home team bats in the bottom half (second part).

Should be included into event to match event to the part of the game.
```typescript
interface BaseballEvent extends Event {
  inning: string
  inningState: "start" | "end"
}
```

#### pitch
The result of a single pitch during an at-bat in a baseball game. 

pitch outcome as value:
- speed
```js 
{
  "id": "{guid}",
  "scope": "game",
  "scopeId": "{guid}"  
  "name": "baseball.pitch.speed",
  "player": "{guid}"
  "team": "{guid}"
  "value": "70"
}
```

event 
```json
{
  "name": "baseball.pitch.speed",
  "id": "{guid}",
  "scope": "nvenue.game",
  "scopeId": "{guid}",
  "value": "70",
  "options": {
    "player": "{guid}"
    "team": "{guid}"
    "inning": "10" 
  }
}
```

event
```json
{
  "name": "baseball.pitch.result",
  "id": "{guid}",
  "scope": "nvenue.game",
  "scopeId": "{guid}",
  "value": "ball",
  "options": {
    "player": "{guid}",
    "team": "{guid}",
    "inning": "12",
  }
}
```

This can include outcomes like a "strike", "ball", "foul ball", in-play result (e.g., "groundout", "single", "double", etc.), or "hit" by pitch.

pitch outcome as single state:
- ball
- strike_looking
- strike_swinging
- ball_in_play
- foul
```js 
{
  "name": "baseball.pitch.state",
  "player": "{guid}"
  "team": "{guid}"
  "value": "ball"
}
```

- __atbat__<br/>The result of a batter's at-bat. 
This could be a hit (single, double, triple, home run), an out (like a groundout, flyout, or strikeout), 
or a walk, among other possibilities.

- __inning__<br/>A subdivision of a baseball game. 
In most professional games, there are nine innings, and each inning is divided into two halves. 
The visiting team bats in the top half (first part) of the inning, and 
the home team bats in the bottom half (second part).

- __inning_start__<br/>The start of an inning. In the top of the inning, the visiting team goes up to bat; in the bottom, the home team does.
- __inning_end__<br/>The end of an inning, which happens when three outs have been made.
- __score_differential__<br/>The difference in score between the two teams. If the home team has scored 3 runs and the away team has scored 1 run, the score differential is 2 (in favor of the home team).
- __home_score__<br/>The number of runs scored by the home team during the game.
- __away_score__<br/>The number of runs scored by the visiting team during the game.
