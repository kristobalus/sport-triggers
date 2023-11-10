
export enum ConditionType {
  Number = 'number',
  String = 'string'
}

export enum CompareOp {
  In = 'in',
  Equal = 'eq',
  LessThan = 'lt',
  GreaterThan = 'gt',
  LessOrEqual = 'le',
  GreaterOrEqual = 'ge'
}

export enum AggregateOp {
  Sum = 'sum',
  Count = 'count',
}

export enum ChainOp {
  AND = 'and',
  OR = 'or'
}

export interface TriggerConditionOption {
  event: string
  compare?: CompareOp
  aggregate?: string[]
  targets?: string[]
  type?: string
}

export interface TriggerCondition {
  // uuid generated for each condition
  id: string
  // owner id
  triggerId: string
  // datasource
  datasource: string
  // sport
  sport: string
  // name of event to be compared with
  event: string
  // scope of event
  scope: string
  // scope identifier
  scopeId: string

  // TODO aggregation should be used only in options
  // ft.aggregate query
  // aggregate?: string[]
  // ft.aggregate filter targets
  // aggregateTargets?: string[]

  // comparison operation, should be used to compare "current" and "target" and return a boolean
  compare?: CompareOp
  // type of condition
  type: ConditionType
  // target value of the event, threshold value to compare with
  targets?: string[]
  // condition options, additional events required for condition to be activated
  options: TriggerConditionOption[]
  // current value read from event
  current?: string
  // true when compare(target, current) == true
  activated?: boolean
  // stringified unique event identifier
  uri: string
  // log of events consumed by condition
  log?: string[]
  // order of occurrence of condition in array of conditions
  chainOrder?: number
  // logical operation on condition when combining multiple conditions together
  chainOperation?: ChainOp
  // mark condition as deleted by user
  deleted?: boolean
}
