// description:
//  3FG = "three-point field goal"

export enum BasketballEvents {
    GameLevel = 'basketball.game.level', // game level state (see GameStates)
    Quarter = 'basketball.game.quarter', // number of quarter
    Sequence = 'basketball.game.sequence', // number of sequence
    Period = 'basketball.game.period', // period id
    GamePointsHome = 'basketball.game.points.home', // game points of home team
    GamePointsAway = 'basketball.game.points.away', // game points of away team
    Player = 'basketball.player', // refers to player id
    Team = 'basketball.team', // refers to team id
    TeamFirstBasket = 'basketball.team.first_basket', // refers to team id
    TeamDunk = 'basketball.team.dunk', // refers to team id
    Team3FG = 'basketball.team.3fg', // refers to team id
    TeamScores3FG = 'basketball.team.scores.3fg', // refers to team id
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
    Player1FTMade = 'basketball.player.1ft.made', // refers to player id
    Player2FTMade = 'basketball.player.2ft.made', // refers to player id
    PlayerScoresPoints = 'basketball.player.scores.points' // refers to player id
}

