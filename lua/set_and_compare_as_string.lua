local conditionKey = KEYS[1];
local current = ARGV[1];

local activated = redis.call("hget", conditionKey, "activated")
local target = redis.call("hget", conditionKey, "target")
local compare = redis.call("hget", conditionKey, "compare")

if activated == "1"  then
    activated = 1
else
    activated = 0
end

if activated == 1 then
    return activated
end

-- should
--   1. set current value, replacing the old one as set(conditionKey, currentValue)
redis.call("hset", conditionKey, "current", current)

--   2. compare current and target values and store bool result into activated,
local result = false -- equivalent to 'let compareResult' in JavaScript
if compare == "eq" then
    result = (current == target)
end

if ( result == true ) then
    result = 1
else
    result = 0
end

redis.call("hset", conditionKey, "activated", result)

return { result }
