import { AtBatOutcomeState, PitchOutcomeState } from "./baseball-events"
import { TargetMetadata } from "../../../services/studio/metadata.service"
import { TargetSources } from "./target-sources"

export const targets: Record<string, Record<string, TargetMetadata>> = {

  [TargetSources.PitchOutcome]: {

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

  [TargetSources.AtBatOutcome]: {
    [AtBatOutcomeState.GIDP]: {
      label: "GIDP"
    },

    [AtBatOutcomeState.BB]: {
      label: "BB"
    },

    [AtBatOutcomeState.BI]: {
      label: "BI"
    },

    [AtBatOutcomeState.ERR]: {
      label: "ERR"
    },

    [AtBatOutcomeState.FO]: {
      label: "FO"
    },

    [AtBatOutcomeState.CI]: {
      label: "CI"
    },

    [AtBatOutcomeState.GO]: {
      label: "GO"
    },

    [AtBatOutcomeState.XBH]: {
      label: "XBH"
    },

    [AtBatOutcomeState.X1]: {
      label: "X1"
    },

    [AtBatOutcomeState.X2]: {
      label: "X2"
    },

    [AtBatOutcomeState.X3]: {
      label: "X3"
    },

    [AtBatOutcomeState.REACH]: {
      label: "REACH"
    },

    [AtBatOutcomeState.RBI]: {
      label: "RBI"
    },

    [AtBatOutcomeState.OUT]: {
      label: "OUT"
    },

    [AtBatOutcomeState.KS]: {
      label: "KS"
    },

    [AtBatOutcomeState.IPO]: {
      label: "IPO"
    },

    [AtBatOutcomeState.KL]: {
      label: "KL"
    },

    [AtBatOutcomeState.K]: {
      label: "K"
    },

    [AtBatOutcomeState.HIT]: {
      label: "HIT"
    },

    [AtBatOutcomeState.HR]: {
      label: "HR"
    },

    [AtBatOutcomeState.HBP]: {
      label: "HBP"
    },
  },

}
