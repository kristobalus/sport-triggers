import { Microfleet } from "@microfleet/core-types"
import { ActionTransport, ServiceRequest } from "@microfleet/plugin-router"
import { HttpStatusError } from '@microfleet/validation'

async function Echo(this: Microfleet, request: ServiceRequest): Promise<any> {
  const { ping } = request.params
  // send "ping: false" to test http status error 403

  if (!ping)
    throw new HttpStatusError(403, "Ping should be positive")
  
  return { pong: true, now: Date.now() }
}

Echo.schema = 'echo'
Echo.transports = [ActionTransport.amqp, ActionTransport.http]

export = Echo

