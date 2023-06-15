export const redis = {
  sentinels: [{
    host: 'redis-sentinel',
    port: '26379',
  }],
  name: 'mservice',
  options: { keyPrefix: '{polls-importer}' }
}
  