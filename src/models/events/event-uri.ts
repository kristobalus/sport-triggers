
export function getEventUri(options: { scope: string, scopeId: string, datasource: string, eventName: string }) {
  const { scope, scopeId, datasource, eventName } = options
  
  return `${datasource}/${scope}/${scopeId}/${eventName}`
}

