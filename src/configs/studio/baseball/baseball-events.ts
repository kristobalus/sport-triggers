
export const InningState = {
  Start: 'start',
  End: 'end'
}

export const PitchOutcomeState = {
  GT99: 'gt.90',
  LT80: 'lt.80',
  Ball: 'ball',
  StrikeLooking: 'strike_looking',
  StrikeSwinging: 'strike_swinging',
  BallInPlay: 'ball_in_play',
  Foul: 'foul'
}

export const AtBatOutcomeState = {
  HIT: "HIT",
  X1: "X1",
  X2: "X2",
  X3:  "X3",
  HR: "HR",
  XBH: "XBH",
  BB: "BB",
  HBP: "HBP",
  REACH: "REACH",
  ERR: "ERR",
  CI: "CI",
  RBI: "RBI",
  OUT: "OUT",
  K: "K",
  KL: "KL",
  KS: "KS",
  IPO: "IPO",
  FO: "FO",
  GO: "GO",
  GIDP: "GIDP",
  BI: "BI"
}

export const BaseballEvents = {
  PlayerAtBat: 'baseball.player.atbat', // refers player id
  PlayerPitching: 'baseball.player.pitching', // refers player id
  TeamAtBat: 'baseball.team.batting',
  TeamPitching: 'baseball.team.pitching',
  GameState: 'baseball.game.state',
  PitchOutcome: 'baseball.pitch.outcome',
  BallSpeed: 'baseball.ball.speed',
  AtBatOutcome: 'baseball.atbat.outcome',
  Inning: 'baseball.inning',
  ScoreDifferential: 'baseball.score.differential',
  HomeScore: 'baseball.score.home',
  AwayScore: 'baseball.score.away'
}
