Put here configurations for instances of service 
described in .mdeprc.json file.

Include configuration files in docker-compose.yml located in "test/" dir.
```yaml
version: '3'

services:
  tester:
    links:
      - redis-sentinel
      - rabbitmq
    environment:
      # SWC_NODE_PROJECT
      SWC_NODE_PROJECT: "./tsconfig.test.json"
      #
      # for ms-conf
      # NCONF_NAMESPACE - MUST be specified, as it will return configuration relative to this namespace
      NCONF_NAMESPACE: "FLEET_SERVICE_NAME"
      # NCONF_FILE_PATH - external JSON configuration file that will be used to provide variables
      NCONF_FILE_PATH: "[\"/src/test/configs/amqp.js\", \"/src/test/configs/router.js\", \"/src/test/configs/redis.sentinel.js\"]"
```
