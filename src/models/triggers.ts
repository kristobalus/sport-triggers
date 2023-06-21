
// TODO move to schemas,
//  schemas should be served to Studio via endpoint to list possible events
module.exports = {
  "football": {
    "football.game.points.home": {
      "title": "Game points of home team",
      "description": "",
      "input": true,
      "targets": []
    },
    "football.game.points.away": {
      "title": "Game points of away team",
      "description": "",
      "input": true,
      "targets": []
    },
    "football.game.level": {
      "title": "Game level event",
      "description": "",
      "type": "set_and_compare_as_string",
      "targets": [
        "start",
        "quarter.start",
        "half.start",
        "quarter.end",
        "half.end",
        "end",
        "under_review"
      ]
    },
    "football.player.level.states": {
      "title": "",
      "description": "",
      "targets": [
        "first-down",
        "touchdown",
        "big-play",
        "penalty",
      ]
    },
    "football.player.level.x-yards-rushing": {
      "title": "",
      "description": "",
      "targets": [],
      "input": true
    },
    "football.player.level.x-yards-receiving": {
      "title": "",
      "description": "",
      "targets": [],
      "input": true
    },
    "football.player.level.x-yards-passing": {
      "title": "",
      "description": "",
      "targets": [],
      "input": true
    }
  }
}
