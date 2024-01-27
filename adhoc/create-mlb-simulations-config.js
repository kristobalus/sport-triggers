
const axios = require('axios');
const fs = require('fs');

const config = {
  method: 'get',
  url: 'https://data.nextplay.live/api/mlb/v1.1/games/current',
  params: {
    key: process.env.API_KEY
  }
};

async function main() {
  try {
    fs.mkdirSync(__dirname + '/games');
    fs.mkdirSync(__dirname + '/games/baseball');
  } catch (err) {
    // none
  }

  const simulations = JSON.parse(fs.readFileSync(__dirname + '/simulations.json').toString("utf-8"))
  try {
    const response = await axios.request(config);
    console.log(JSON.stringify(response.data));

    const games = response.data;
    const result = []

    for(const game of games){
      if ( simulations[game.nv_game_id] ) {
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
    }

    fs.writeFileSync(__dirname + '/games/baseball/games_simulations.json', JSON.stringify(result))
  }
  catch (error) {
    console.log(error);
  }
}

main().catch(err => console.error(err));



