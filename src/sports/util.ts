
export function filter(field, targets, joiner) {
  return ['filter', '\'' + targets.map(target => `${field}=="${target}"`).join(joiner) + '\'']
}

export function escape(event: string) {
  return event.replaceAll('.', '\\.')
}
