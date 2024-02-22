import { StudioTargetTree } from '../../models/studio/studio.target-tree'

import { AtBatOutcomeState, GameState, PitchOutcomeState, PitchSpeedState, PitchTypeState } from './baseball-events'
import { Sources } from './sources'
import { InningHalf } from './inning-half'

export const targetTree: StudioTargetTree = {

  [Sources.PitchSpeed]: {

    [PitchSpeedState.GT99]: {
      label: 'Ball speed > 99 mph',
    },

    [PitchSpeedState.B96_99]: {
      label: 'Ball speed 96-99 mph',
    },

    [PitchSpeedState.B90_95]: {
      label: 'Ball seed 90-95 mph',
    },

    [PitchSpeedState.B80_89]: {
      label: 'Ball speed 80-89 mph',
    },

    [PitchSpeedState.LT80]: {
      label: 'Ball speed < 80 mph',
    },
  },

  [Sources.PitchOutcome]: {

    [PitchOutcomeState.StrikeSwinging]: {
      label: 'Strike - Swinging',
    },

    [PitchOutcomeState.StrikeLooking]: {
      label: 'Strike - Looking',
    },

    [PitchOutcomeState.BallInPlay]: {
      label: 'Ball in Play',
    },

    [PitchOutcomeState.Ball]: {
      label: 'Ball',
    },

    [PitchOutcomeState.Foul]: {
      label: 'Foul',
    },

    [PitchOutcomeState.GT90]: {
      label: 'Greater than 90mph',
    },

    [PitchOutcomeState.LT80]: {
      label: 'Less than 80mph',
    },

    [PitchOutcomeState.Strikeout]: {
      label: 'Strikeout',
    },

    [PitchOutcomeState.InlpayOut]: {
      label: 'Inplay Out',
    },

    [PitchOutcomeState.InplayReach]: {
      label: 'Inplay Reach',
    },

    [PitchOutcomeState.InplayHit]: {
      label: 'Inplay Hit',
    },
  },

  [Sources.AtBatOutcome]: {
    [AtBatOutcomeState.GIDP]: {
      label: 'GIDP'
    },

    [AtBatOutcomeState.BB]: {
      label: 'BB'
    },

    [AtBatOutcomeState.BI]: {
      label: 'BI'
    },

    // [AtBatOutcomeState.ERR]: {
    //   label: 'ERR'
    // },

    [AtBatOutcomeState.FO]: {
      label: 'FO'
    },

    [AtBatOutcomeState.CI]: {
      label: 'CI'
    },

    [AtBatOutcomeState.GO]: {
      label: 'GO'
    },

    [AtBatOutcomeState.XBH]: {
      label: 'XBH'
    },

    [AtBatOutcomeState.X1]: {
      label: 'X1',
      description: 'Single'
    },

    [AtBatOutcomeState.X2]: {
      label: 'X2',
      description: 'Double'
    },

    [AtBatOutcomeState.X3]: {
      label: 'X3'
    },

    [AtBatOutcomeState.REACH]: {
      label: 'REACH'
    },

    [AtBatOutcomeState.RBI]: {
      label: 'RBI'
    },

    [AtBatOutcomeState.OUT]: {
      label: 'OUT'
    },

    [AtBatOutcomeState.KS]: {
      label: 'KS',
      description: 'Strikeout swinging'
    },

    [AtBatOutcomeState.IPO]: {
      label: 'IPO'
    },

    [AtBatOutcomeState.KL]: {
      label: 'KL',
      description: 'Strikeout looking'
    },

    [AtBatOutcomeState.K]: {
      label: 'K',
      description: 'All strikeouts'
    },

    [AtBatOutcomeState.HIT]: {
      label: 'HIT'
    },

    [AtBatOutcomeState.HR]: {
      label: 'HR'
    },

    [AtBatOutcomeState.HBP]: {
      label: 'HBP'
    },
  },

  [Sources.GameStates]: {
    [GameState.GameStart]: {
      label: 'Game start'
    },
    [GameState.GameEnd]: {
      label: 'Game end'
    },
    [GameState.InningStart]: {
      label: 'Inning start',
      description: 'The start of an inning is when the first batter of the team that\'s up to bat steps into the batter\'s box and the pitcher is set to throw the first pitch. In the top half of the inning, it\'s the visiting team that bats, and in the bottom half of the inning, it\'s the home team.'
    },
    [GameState.InningEnd]: {
      label: 'Inning end',
      description: 'The end of an inning occurs when three outs have been made in the bottom half. After the third out, teams switch roles -- the batting team goes into the field to play defense, and the defensive team comes in to bat.'
    }
  },

  [Sources.InningHalf]: {
    [InningHalf.Top]: {
      label: 'Top'
    },
    [InningHalf.Bottom]: {
      label: 'Bottom'
    },
  },

  [Sources.PitchType]: {
    [PitchTypeState.FA]: {
      label: 'FA',
      description: 'fastball'
    },

    [PitchTypeState.CT]: {
      label: 'CT',
      description: 'fastball cutter'
    },

    // [PitchTypeState.FF]: {
    //   label: 'FF',
    //   description: 'four-seam fastball'
    // },

    [PitchTypeState.SI]: {
      label: 'SI',
      description: 'fastball sinker'
    },

    [PitchTypeState.SL]: {
      label: 'SL',
      description: 'off-speed slider'
    },

    [PitchTypeState.CH]: {
      label: 'CH',
      description: 'off-speed changeup'
    },

    [PitchTypeState.CU]: {
      label: 'CU',
      description: 'off-speed curveball'
    },
  }

}
