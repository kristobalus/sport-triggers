
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
  parent?: string
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
  // scope of event
  scope: string
  // scope identifier
  scopeId: string

  // TODO aggregation should be used only in options
  // ft.aggregate query
  // aggregate?: string[]
  // ft.aggregate filter targets
  // aggregateTargets?: string[]

  /**
   * @deprecated
   * name of event to be compared with
   */
  event: string

  /**
   * comparison operation, should be used to compare "current" and "target" and return a boolean
   * @deprecated
   */
  compare?: CompareOp

  /**
   * type of condition
   * @deprecated
   */
  type: ConditionType

  /**
   * target value of the event, threshold value to compare with
   * @deprecated
   */
  targets?: string[]

  /**
   * current value read from event
   * @deprecated
   */
  current?: string

  // condition options (sub-conditions), additional events required for condition to be activated
  //
  //  Conditions are comprised of one or more sub-conditions.
  //  Sub-conditions are comprised of categories and outcomes.
  //  Sub-conditions must all be true at the same time in order for the condition to be true.
  //  In the Coca Cola advertisement example:
  //  Event Trigger 3 has 1 condition with 2 sub-conditions.
  //  Team pitching = Yankees; Pitch Outcome = Strikeout | at the same time | Game condition = 8th inning
  options: TriggerConditionOption[]

  // true when compare(target, current) == true
  activated?: boolean

  /**
   * stringified unique event identifiers for all options
   */
  uri: string[]

  // log of events consumed by condition
  log?: string[]

  /**
   * order of occurrence of condition in array of conditions
   * @deprecated
   */
  chainOrder?: number

  /**
   * logical operation on condition when combining multiple conditions together
   * @deprecated
   */
  chainOperation?: ChainOp

  /**
   * mark condition as deleted by user
   * @deprecated
   */
  deleted?: boolean
}
