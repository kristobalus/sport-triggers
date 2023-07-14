
export enum GameState {
  GameStart = 'game.start',
  GameEnd = 'game.end',
  InningStart = "inning.start",
  InningEnd = "inning.end"
}

export enum PitchOutcomeState {
  GT99 = 'gt.90',
  LT80 = 'lt.80',
  Ball = 'ball',
  StrikeLooking = 'strike_looking',
  StrikeSwinging = 'strike_swinging',
  BallInPlay = 'ball_in_play',
  Foul = 'foul'
}

export enum AtBatOutcomeState {
  HIT = "HIT",
  X1 = "X1",
  X2 = "X2",
  X3 = "X3",
  HR = "HR",
  XBH = "XBH",
  BB = "BB",
  HBP = "HBP",
  REACH = "REACH",
  ERR = "ERR",
  CI = "CI",
  RBI = "RBI",
  OUT = "OUT",
  K = "K",
  KL = "KL",
  KS = "KS",
  IPO = "IPO",
  FO = "FO",
  GO = "GO",
  GIDP = "GIDP",
  BI = "BI"
}

export enum BaseballEvents {
  Team = 'baseball.team', // refers team id
  Player = 'baseball.player', // refers player id
  PlayerAtBat = 'baseball.player.atbat', // refers player id
  PlayerPitch = 'baseball.player.pitch', // refers player id
  TeamAtBat = 'baseball.team.atbat',
  TeamPitch = 'baseball.team.pitch',
  GameState = 'baseball.game.state',
  PitchOutcome = 'baseball.pitch.outcome',
  BallSpeed = 'baseball.ball.speed',
  AtBatOutcome = 'baseball.atbat.outcome',
  Inning = 'baseball.inning',
  ScoreDifferential = 'baseball.score.differential',
  HomeScore = 'baseball.score.home',
  AwayScore = 'baseball.score.away'
}
