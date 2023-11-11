import { data as CommonErrors } from 'common-errors'

export type PipelineResult<T = any> = [Error, T]

export function getStr(pipeRes: PipelineResult<string>): string {
  const [err, value] = pipeRes

  if (err)
  { throw new CommonErrors.RedisError('error in pipeline result', err) }

  return value
}

export function getInt(pipeRes: PipelineResult<string>, defaultValue?: number): number {
  const [err, value] = pipeRes

  if (err)
  { throw new CommonErrors.RedisError('error in pipeline result', err) }
  const out = parseInt(value)

  return !isNaN(out) ? out : defaultValue
}

export function getStrArr(pipeRes: PipelineResult<string[]>, defaultValue?: string[]): string[] {
  const [err, arr] = pipeRes

  if (err)
  { throw new CommonErrors.RedisError('error in pipeline result', err) }

  return arr ?? defaultValue
}

/**
 * @param pipeRes
 * @param fields
 * @throws Error
 */
export function createObjectFromHmGet(pipeRes: PipelineResult<string[]>, fields: string[]) {
  const [err, piped] = pipeRes

  if (err)
  { throw new CommonErrors.RedisError('error in pipeline result', err) }

  const data = {}

  for (const [pos, prop] of fields.entries()) {
    data[prop as string] = piped[pos]
  }

  return data
}


export function createArrayFromHGetAll<T>(results: PipelineResult<T>[]) {
  for (const [err] of results) {
    if (err)
    { throw err }
  }

  return results.map(([, res]) => res)
}

export function assertNoError<T>(results: PipelineResult<T>[]) {
  for (const [err] of results) {
    if (err)
    { throw err }
  }
}
