
const axios = require('axios');
const fs = require('fs');
const { json2csv } = require('json-2-csv');

async function main() {
  const games = JSON.parse(fs.readFileSync(__dirname + '/../games/nvenue/baseball/games/games_2024_1.json').toString("utf-8"))
  const csv = json2csv(games)
  fs.writeFileSync(__dirname + '/games_2024_1.csv', csv)
}

main().catch(err => console.error(err));



