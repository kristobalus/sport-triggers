

const fs = require('fs');
const games = JSON.parse(fs.readFileSync("adhoc/current.games.json").toString("utf8"))
const result = []
for(const game of games){
  result.push({
    "scheduled": game.scheduled,
    "nv_game_id": game.nv_game_id,
    "mlb_game_id": game.league_reference_id,
    "away_abbr": game.teams.away.abbr,
    "home_abbr": game.teams.home.abbr,
    "season": 2023,
    "season_type": "PST",
    "status": "simulation"
  })
}
fs.writeFileSync('simulations.json', JSON.stringify(result))
