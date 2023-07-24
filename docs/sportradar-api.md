

```mermaid
sequenceDiagram
    participant sportradar
    participant adapter
    adapter->>sportradar: get schedule (e.g. 2022, post-season)
    sportradar->>adapter: list of games
    loop Every game
        adapter->>sportradar: get game summary
        sportradar->>adapter: game document including team and players
    end
``` 
