import * as path from "path"

export const redis = {
  sentinels: [{
    host: 'redis-sentinel',
    port: '26379',
  }],
  name: 'mservice',
  options: { keyPrefix: '{triggers}' },
  luaScripts: path.resolve(__dirname, '../../lua')
}
