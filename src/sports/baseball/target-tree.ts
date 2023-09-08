import { StudioTargetTree } from '../../models/studio/studio.target-tree'

import { AtBatOutcomeState, GameState, PitchOutcomeState, PitchTypeState } from './baseball-events'
import { Sources } from './sources'
import { InningHalf } from './inning-half'

export const targetTree: StudioTargetTree = {

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

    [PitchOutcomeState.GT99]: {
      label: 'Greater than 99mph',
    },

    [PitchOutcomeState.LT80]: {
      label: 'Less than 80mph',
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

    [AtBatOutcomeState.ERR]: {
      label: 'ERR'
    },

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
      label: 'X1'
    },

    [AtBatOutcomeState.X2]: {
      label: 'X2'
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
      label: 'KS'
    },

    [AtBatOutcomeState.IPO]: {
      label: 'IPO'
    },

    [AtBatOutcomeState.KL]: {
      label: 'KL'
    },

    [AtBatOutcomeState.K]: {
      label: 'K'
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

    [PitchTypeState.FF]: {
      label: 'FF',
      description: 'four-seam fastball'
    },

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
