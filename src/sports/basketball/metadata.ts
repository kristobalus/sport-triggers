import { CompareOp, ConditionType } from '../../models/entities/trigger-condition'
import { EventMetadata } from '../../models/events/event-metadata'
import { StudioInputs } from '../../models/studio/studio.inputs'
import { CommonSources } from '../common-sources'
import { filter, escape } from '../util'

import { BasketballEvents } from './basketball-events'
import { GameLevel } from './game-level'
import { Sources } from './sources'
import { getIndexName } from './redis-index'

export const metadata: Record<string, EventMetadata> = {

  [BasketballEvents.Player]: {
    sport: 'basketball',
    input: StudioInputs.SelectMulti,
    primary: true,
    label: 'Player',
    description: 'should be player id',
    type: ConditionType.String,
    compare: [
      CompareOp.In,
    ],
    targetSource: CommonSources.GamePlayers,
    targets: [],
    preferredOptions: [
      /*
        Dunk
        3FG
        Scores X 3FG
        Shooting Foul
        1 FT Made
        2 FT Made
        Scores X pts *
       */
      BasketballEvents.PlayerDunk,
      BasketballEvents.Player3FG,
      BasketballEvents.PlayerScores3FG,
      BasketballEvents.PlayerShootingFoul,
      BasketballEvents.Player1FTMade,
      BasketballEvents.Player2FTMade,
      BasketballEvents.PlayerScoresPoints,
    ],
  },

  [BasketballEvents.Team]: {
    sport: 'basketball',
    input: StudioInputs.SelectMulti,
    primary: true,
    label: 'Team',
    description: 'should be matched to team-id',
    type: ConditionType.String,
    compare: [
      CompareOp.In,
    ],
    targetSource: CommonSources.GameTeams,
    targets: [],
    preferredOptions: [
      /*
      First basket
      Dunk
      3FG
      Scores 3FG
      Scores X 3FG *
      Shooting Foul
      2 FT Made
      Scores X pts *
      Timeout
      win
      loss
       */
      BasketballEvents.TeamFirstBasket,
      BasketballEvents.TeamDunk,
      BasketballEvents.Team3FG,
      BasketballEvents.TeamScores3FG,
      BasketballEvents.TeamShootingFoul,
      BasketballEvents.Team2FTMade,
      BasketballEvents.TeamScoresPoints,
      BasketballEvents.TeamTimeout,
      BasketballEvents.TeamWin,
      BasketballEvents.TeamLoss,
    ],
  },

  [BasketballEvents.GameLevel]: {
    sport: 'basketball',
    input: StudioInputs.Select,
    primary: true,
    label: 'Game level',
    type: ConditionType.String,
    compare: [
      CompareOp.Equal,
    ],
    targets: [
      GameLevel.Start,
      GameLevel.End,
      GameLevel.HalfStart,
      GameLevel.HalfEnd,
      GameLevel.QuarterStart,
      GameLevel.QuarterEnd,
    ],
    targetSource: Sources.GameLevel,
    preferredOptions: [
      BasketballEvents.Quarter,
      BasketballEvents.Sequence
    ],
    optionDefaultCompare: CompareOp.In
  },

  [BasketballEvents.TotalPoints]: {
    sport: 'basketball',
    input: StudioInputs.Number,
    primary: false,
    label: 'Total points',
    description: 'should be number',
    type: ConditionType.Number,
    compare: [
      CompareOp.Equal,
      CompareOp.LessOrEqual,
      CompareOp.LessThan,
      CompareOp.GreaterThan,
      CompareOp.GreaterOrEqual,
    ],
    targets: [],
    optionDefaultCompare: CompareOp.Equal
  },

  [BasketballEvents.Quarter]: {
    sport: 'basketball',
    input: StudioInputs.Number,
    primary: false,
    label: 'Period quarter number',
    description: 'should be number',
    type: ConditionType.Number,
    compare: [
      CompareOp.Equal,
      CompareOp.LessOrEqual,
      CompareOp.LessThan,
      CompareOp.GreaterThan,
      CompareOp.GreaterOrEqual,
    ],
    targets: [],
    optionDefaultCompare: CompareOp.Equal
  },

  [BasketballEvents.Sequence]: {
    sport: 'basketball',
    input: StudioInputs.Number,
    primary: false,
    label: 'Period sequence number',
    description: 'should be number',
    type: ConditionType.Number,
    compare: [
      CompareOp.Equal,
      CompareOp.LessOrEqual,
      CompareOp.LessThan,
      CompareOp.GreaterThan,
      CompareOp.GreaterOrEqual,
    ],
    targets: [],
    optionDefaultCompare: CompareOp.Equal
  },

  [BasketballEvents.GamePointsHome]: {
    sport: 'basketball',
    input: StudioInputs.Number,
    primary: false,
    label: 'Period sequence number',
    description: 'should be number',
    type: ConditionType.Number,
    compare: [
      CompareOp.Equal,
      CompareOp.LessOrEqual,
      CompareOp.LessThan,
      CompareOp.GreaterThan,
      CompareOp.GreaterOrEqual,
    ],
    targets: [],
    optionDefaultCompare: CompareOp.Equal
  },

  [BasketballEvents.GamePointsAway]: {
    sport: 'basketball',
    input: StudioInputs.Number,
    primary: false,
    label: 'Period sequence number',
    description: 'should be number',
    type: ConditionType.Number,
    compare: [
      CompareOp.Equal,
      CompareOp.LessOrEqual,
      CompareOp.LessThan,
      CompareOp.GreaterThan,
      CompareOp.GreaterOrEqual,
    ],
    targets: [],
    optionDefaultCompare: CompareOp.Equal
  },

  [BasketballEvents.TeamDunk]: {
    sport: 'basketball',
    input: StudioInputs.None,
    primary: false,
    label: 'Team Dunk',
    description: '',
    type: ConditionType.String,
    compare: [],
    targets: [],
    inferTargetsFromScope: true,
    optionScope: [BasketballEvents.Team],
    optionDefaultCompare: CompareOp.In
  },

  [BasketballEvents.Team3FG]: {
    sport: 'basketball',
    input: StudioInputs.None,
    primary: false,
    label: 'Team 3FG',
    description: '',
    type: ConditionType.String,
    compare: [],
    targets: [],
    inferTargetsFromScope: true,
    optionScope: [BasketballEvents.Team],
    optionDefaultCompare: CompareOp.In
  },

  [BasketballEvents.Team2FTMade]: {
    sport: 'basketball',
    input: StudioInputs.None,
    primary: false,
    label: 'Team 2 FT Made',
    description: '',
    type: ConditionType.String,
    compare: [],
    targets: [],
    inferTargetsFromScope: true,
    optionScope: [BasketballEvents.Team],
    optionDefaultCompare: CompareOp.In
  },

  [BasketballEvents.TeamFirstBasket]: {
    sport: 'basketball',
    input: StudioInputs.None,
    primary: false,
    label: 'Team first basket',
    description: '',
    type: ConditionType.String,
    compare: [],
    targets: [],
    inferTargetsFromScope: true,
    optionScope: [BasketballEvents.Team],
    optionDefaultCompare: CompareOp.In
  },

  [BasketballEvents.TeamShootingFoul]: {
    sport: 'basketball',
    input: StudioInputs.None,
    primary: false,
    label: 'Team Shooting Foul',
    description: '',
    type: ConditionType.String,
    compare: [],
    targets: [],
    inferTargetsFromScope: true,
    optionScope: [BasketballEvents.Team],
    optionDefaultCompare: CompareOp.In
  },

  [BasketballEvents.TeamScoresPoints]: {
    sport: 'basketball',
    input: StudioInputs.Number,
    primary: false,
    label: 'Team Scores Pts',
    description: 'Number of points scored from start of game',
    type: ConditionType.Number,
    compare: [
      CompareOp.Equal,
      CompareOp.LessOrEqual,
      CompareOp.LessThan,
      CompareOp.GreaterThan,
      CompareOp.GreaterOrEqual,
    ],
    targets: [],
    optionScope: [BasketballEvents.Team],
    optionDefaultCompare: CompareOp.In
  },

  [BasketballEvents.TeamScores3FG]: {
    sport: 'basketball',
    input: StudioInputs.Number,
    primary: false,
    label: 'Team Scores X 3FG',
    description: 'e.g. Red Socks hits 5th 3FG',
    type: ConditionType.String,
    compare: [CompareOp.Equal],
    targets: [],
    optionScope: [BasketballEvents.Team],
    aggregate: (datasource, scopeId, targets) => {
      const result = [
        'ft.aggregate', getIndexName(datasource, scopeId),
        // query tag "events" to be equal "basketball.team.scores.3fg"
        `'@events:{ ${ escape(BasketballEvents.TeamScores3FG) } }'`,
        // group those events by "team" tag
        'groupby', '1', '@team',
        // count size of the group for each team
        'reduce', 'count', '0', 'as', 'count',
        // filter out only teams of interest
        ...filter('@team', [...targets], '||')
      ] as any[]

      if (targets.length > 1) {
        // if we have multiple groups we should sum their sizes (analogue of OR)
        result.push([
          'groupby', '0',
          'reduce', 'sum', '1', 'count', 'as', 'count'
        ])
      }

      return result
    },
  },

  [BasketballEvents.PlayerScores3FG]: {
    sport: 'basketball',
    input: StudioInputs.Number,
    primary: false,
    label: 'Player Scores X 3FG',
    description: 'e.g. Steph Curry hits 5th 3FG',
    type: ConditionType.String,
    compare: [
      CompareOp.Equal
    ],
    targets: [],
    optionScope: [BasketballEvents.Player],
    aggregate: (datasource, scopeId, targets) => {
      const result = [
        'ft.aggregate', getIndexName(datasource, scopeId),
        // query tag "events" with PlayerScores3FG option
        `'@events:{ ${ escape(BasketballEvents.PlayerScores3FG) } }'`,
        // group those events by Player option
        'groupby', '1', '@player',
        // count size of the group
        'reduce', 'count', '0', 'as', 'count',
        // select only groups matching targets of interest
        ...filter('@player', [...targets], '||')
      ] as any[]

      if (targets.length > 1) {
        // if we have multiple targets we should sum their sizes (analogue of OR)
        result.push([
          'groupby', '0',
          // sum over field "count" from previous operations and mark result as "count"
          'reduce', 'sum', '1', 'count', 'as', 'count'
        ])
      }

      return result
    },
  },

  [BasketballEvents.PlayerDunk]: {
    sport: 'basketball',
    input: StudioInputs.None,
    primary: false,
    label: 'Player Dunk',
    description: 'A dunk is a type of basketball shot that is performed when a player jumps in the air and manually scores by putting the ball directly through the basket with one or both hands. It\'s a high-percentage shot and is considered one of the most exciting and crowd-pleasing plays in the game.',
    type: ConditionType.String,
    compare: [],
    targets: [],
    optionScope: [BasketballEvents.Player],
    optionDefaultCompare: CompareOp.In,
    inferTargetsFromScope: true
  },

  [BasketballEvents.Player3FG]: {
    sport: 'basketball',
    input: StudioInputs.None,
    primary: false,
    label: 'Player 3FG',
    description: '',
    type: ConditionType.String,
    compare: [],
    targets: [],
    optionScope: [BasketballEvents.Player],
    optionDefaultCompare: CompareOp.In,
    inferTargetsFromScope: true
  },

  [BasketballEvents.PlayerShootingFoul]: {
    sport: 'basketball',
    input: StudioInputs.None,
    primary: false,
    label: 'Player Shooting Foul',
    description: '',
    type: ConditionType.String,
    compare: [],
    targets: [],
    optionScope: [BasketballEvents.Player],
    optionDefaultCompare: CompareOp.In,
    inferTargetsFromScope: true
  },

  [BasketballEvents.Player1FTMade]: {
    sport: 'basketball',
    input: StudioInputs.None,
    primary: false,
    label: 'Player 1FT Made',
    description: '',
    type: ConditionType.String,
    compare: [],
    targets: [],
    optionScope: [BasketballEvents.Player],
    optionDefaultCompare: CompareOp.In,
    inferTargetsFromScope: true
  },

  [BasketballEvents.Player2FTMade]: {
    sport: 'basketball',
    input: StudioInputs.None,
    primary: false,
    label: 'Player 2FT Made',
    description: '',
    type: ConditionType.String,
    compare: [],
    targets: [],
    optionScope: [BasketballEvents.Player],
    optionDefaultCompare: CompareOp.In,
    inferTargetsFromScope: true
  },

  [BasketballEvents.PlayerScoresPoints]: {
    sport: 'basketball',
    input: StudioInputs.None,
    primary: false,
    label: 'Player Scores Pts',
    description: '',
    type: ConditionType.Number,
    compare: [
      CompareOp.Equal,
      CompareOp.LessOrEqual,
      CompareOp.LessThan,
      CompareOp.GreaterThan,
      CompareOp.GreaterOrEqual,
    ],
    targets: [],
    optionScope: [BasketballEvents.Player],
    optionDefaultCompare: CompareOp.In
  },

}
