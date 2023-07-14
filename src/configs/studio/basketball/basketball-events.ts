

export enum BasketBallGameState {
  Start= 'start',
  QuarterStart = 'quarter.start',
  HalfStart = 'half.start',
  QuarterEnd = 'quarter.end',
  HalfEnd = 'half.end',
  End = 'end'
}

// description:
//  3FG = "3-point Field Goal."

export enum BasketballEvents {
  GameLevel= 'basketball.game.level',
  GamePointsHome = 'basketball.game.points.home',
  GamePointsAway = 'basketball.game.points.away',
  Player = 'basketball.player', // refers to player id
  Team = 'basketball.team', // refers to team id
  TeamFirstBasket = 'basketball.team.first_basket', // refers to team id
  TeamDunk = 'basketball.team.dunk', // refers to team id
  Team3FG = 'basketball.team.3fg', // refers to team id
  TeamScores3FG = 'basketball.team.scores.3fg', // refers to team id
  TeamScoresPlayer3FG = 'basketball.team.scores.player.x3fg', // ???? refers to player??? nonsense
  TeamShootingFoul = 'basketball.team.shooting.foul', // refers to team id
  Team2FTMade = 'basketball.team.2ft.made', // refers to team id
  TeamScoresPoints = 'basketball.team.scores.points', // refers to team id
  TeamTimeout = 'basketball.team.timeout', // refers to team id
  TeamWin = 'basketball.team.win', // refers to team id
  TeamLoss = 'basketball.team.loss', // refers to team id
  PlayerDunk = 'basketball.player.dunk', // refers to player id
  Player3FG = 'basketball.player.3fg', // refers to player id
  PlayerScoresX3FG = 'basketball.player.scores.x3fg', // refers to player id
  PlayerShootingFoul = 'basketball.player.shooting.foul', // refers to player id
  PlayerFirstFTMade = 'basketball.player.first.mt.made', // refers to player id
  PlayerSecondFTMade = 'basketball.player.seconds.mt.made', // refers to player id
  PlayerScoresPoints = 'basketball.player.scores.points' // refers to player id
}

