
export enum GameState {
  GameStart = 'game.start',
  GameEnd = 'game.end',
  InningStart = 'inning.start',
  InningEnd = 'inning.end'
}

export enum PitchOutcomeState {
  GT90 = 'gt.90',
  LT80 = 'lt.80',
  Ball = 'ball',
  StrikeLooking = 'strike_looking',
  StrikeSwinging = 'strike_swinging',
  BallInPlay = 'ball_in_play',
  Foul = 'foul'
}

export enum PitchSpeedState {
  GT99 = 'GT99',
  B96_99 = 'B96-99',
  B90_95 = 'B90-95',
  B80_89 = 'B80-89',
  LT80 = 'LT80'
}

// FA,CU,CH,CT,SI,SL,OTHER
export enum PitchTypeState {
  FA = 'FA',
  CT = 'CT',
  // FF = 'FF',
  SI = 'SI',
  SL = 'SL',
  CH = 'CH',
  CU = 'CU',
  // Extend for:
  // check https://library.fangraphs.com/pitch-type-abbreviations-classifications/
  // KC = knuckle-curve
  // KN = knuckleball
  // EP  = eephus
  // UN / XX = unidentified
  // PO / FO = pitch out
}

export enum AtBatOutcomeState {
  HIT = 'HIT',
  X1 = 'X1',
  X2 = 'X2',
  X3 = 'X3',
  HR = 'HR',
  XBH = 'XBH',
  BB = 'BB',
  HBP = 'HBP',
  REACH = 'REACH',
  ERR = 'ERR',
  CI = 'CI',
  RBI = 'RBI',
  OUT = 'OUT',
  K = 'K',
  KL = 'KL',
  KS = 'KS',
  IPO = 'IPO',
  FO = 'FO',
  GO = 'GO',
  GIDP = 'GIDP',
  BI = 'BI'
}

/*
  "baseball.inningNumber"				situation['subevent']['inning']
  "baseball.inningHalf"				situation['subevent']['side']
  "baseball.player.batter"			batter['mlbam_id']
  "baseball.player.pitcher"			pitcher['mlbam_id']
  "baseball.team.batter"				batter_team
  "baseball.team.pitcher"				pitcher_team
  "baseball.score.home"				situation['subevent']['score_home']
  "baseball.score.away"				situation['subevent']['score_away']
  "baseball.game.state.strikes" 		situation['subevent']['strikes']
  "baseball.game.state.balls"			situation['subevent']['balls']
  "baseball.game.state.outs"			situation['subevent']['outs']
  "baseball.game.state.pitches"		situation['subevent']['pitches']
  "baseball.score.differential"		situation['subevent']['score_home'] - situation['subevent']['score_away'],
 */
export enum BaseballEvents {
  InningNumber = 'baseball.inningNumber',
  InningHalf = 'baseball.inningHalf',
  PlayerBatter = 'baseball.player.batter',
  PlayerPitcher = 'baseball.player.pitcher',
  TeamBatter = 'baseball.team.batter',
  TeamPitcher = 'baseball.team.pitcher',
  ScoreHome = 'baseball.score.home',
  ScoreAway = 'baseball.score.away',
  GameStateStrikes = 'baseball.game.state.strikes',
  GameStateBalls = 'baseball.game.state.balls',
  GameStateOut = 'baseball.game.state.outs',
  GameStatePitches = 'baseball.game.state.pitches',
  ScoreDifferential = 'baseball.score.differential',
  AtBatOutcome = 'baseball.atbat.outcomes',
  PitchOutcome = 'baseball.pitch.outcomes',
  PitchSpeed = 'baseball.pitch.speed',
  PitchType = 'baseball.pitch.type',
}
