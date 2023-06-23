import IORedis, { Redis, RedisOptions } from "ioredis"
import fs from "fs"
import path from "path"

export async function initStandaloneRedis() : Promise<Redis> {
  const redis = new IORedis({ keyPrefix: "{triggers}" } as RedisOptions)

  redis.defineCommand("set_and_compare", {
    lua: fs.readFileSync(path.resolve(__dirname, '../../lua/set_and_compare.lua')).toString("utf-8"),
  })

  redis.defineCommand("set_and_compare_as_string", {
    lua: fs.readFileSync(path.resolve(__dirname, '../../lua/set_and_compare_as_string.lua')).toString("utf-8"),
  })

  await redis.flushall()

  return redis
}
