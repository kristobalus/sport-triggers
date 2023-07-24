
local function Logger()
    local _debug = {}

    local function debug(data, message)
        table.insert(_debug, { data, message })
    end

    local function tostring()
        return cjson.encode(_debug)
    end

    local ns = {
        debug = debug,
        tostring = tostring
    }
    return ns
end

local logger = Logger()

local function to_unit(value)
    if value == "1" then
        return 1
    end
    if value == 1 then
        return 1
    end
    if value == true then
        return 1
    end
    return 0
end

local function to_bool(value)
    if value == true then
        return true
    end
    if value == "true" then
        return true
    end
    if value == "1" then
        return true
    end
    return false
end

local function setConditionCurrentValue(key, value)
    redis.call("hset", key, "current", value)
end

local function setConditionActivated(key, value)
    redis.call("hset", key, "activated", to_unit(value))
end

local function getCondition(key)
    local options = redis.call("hget", key, "options")
    if options == nil then
        options = {}
    else
        options = cjson.decode(options)
    end

    local condition = {
        target = redis.call("hget", key, "target"),
        compare = redis.call("hget", key, "compare"),
        type = redis.call("hget", key, "type"),
        activated = to_bool(redis.call("hget", key, "activated")),
        options = options
    }

    return condition
end

local function appendEventLog(key, event)
    redis.call("hset", key, event.id, cjson.encode(event))
end

local function existsInEventLog(key, eventId)
    local result = redis.call("hexists", key, eventId)
    return to_bool(result)
end

local function getEventLog(key)
    local result = {}
    local items = redis.call("hgetall", key)
    for _, item in ipairs(items) do
        table.insert(result, cjson.decode(item))
    end
    return result
end

-- operation: operation on value and targets, one of [ eq, lt, gt, ge, le, in ]
-- value:  value from event to be compared with targets
-- targets: JSON array of strings
-- type: type of data in targets and value, "number" or "string"
local function compare(operation, value, targets, type)
    local result = false
    local arr = cjson.decode(targets)

    -- do typecasting
    if type == "number" then
        value = tonumber(value)
        for i in ipairs(arr) do
            arr[i] = tonumber(arr[i])
        end
    end
    if type == "string" then
        value = tostring(value)
        for i in ipairs(arr) do
            arr[i] = tostring(arr[i])
        end
    end

    if operation == "in" then
        -- search value in target set
        local function has(arr, value)
            for _, el in ipairs(arr) do
                if el == value then
                    return true
                end
            end
            return false
        end
        -- equivalent of OR condition, checks if value is one of several targets
        return has(arr, value)
    end

    -- single target for non-"in" ops
    local target = arr[1]

    if operation == "eq" then
        return (value == target)
    end

    -- only above-mentioned operations are allowed for type "string"
    if type == "string" then
        return result
    end

    -- operations below are intended for type "number"
    if operation == "gt" then
        return (value > target)
    end

    if operation == "lt" then
        return (value < target)
    end

    if operation == "ge" then
        return (value >= target)
    end

    if operation == "le" then
        return (value <= target)
    end

    return result
end

local function aggregate(eventName, operation, eventLog)
    local result = 0
    for _, event in ipairs(eventLog) do
        if event.name == eventName then

            if operation == "sum" then
                local value = tonumber(event.value)
                if value == nil then
                    value = 0
                end
                result = result + value
            end

            if operation == "count" then
                result = result + 1
            end
        end
    end
    return result
end

local function evaluateOptions(condition, event, eventLog)
    local result = true
    local count = 0
    for _, eventOption in ipairs(event.options) do
        -- eventOption.name
        -- eventOption.value
        for _, conditionOption in ipairs(condition.options) do
            -- conditionOption.compare
            -- conditionOption.aggregate
            -- conditionOption.target
            -- conditionOption.event
            -- conditionOption.type
            if eventOption.name == conditionOption.event then
                count = count + 1

                local value
                if conditionOption.aggregate ~= nil then
                    value = aggregate(conditionOption.event, conditionOption.aggregate, eventLog)
                else
                    value = eventOption.value
                end

                result = result and compare(conditionOption.compare, value, conditionOption.targets, conditionOption.type)

                logger.debug({
                    result = result,
                    eventName = eventOption.name,
                    value = value
                }, 'option compared')
            end
        end
    end
    if count == 0 then
        result = false
    end
    return result
end

local function evaluateCondition(condition, event, eventLog)

    local value
    if condition.aggregate ~= nil then
        value = aggregate(condition.event, condition.aggregate, eventLog)
    else
        value = event.value
    end

    condition.activated = compare(condition.compare, value, condition.targets, condition.type)
    logger.debug({ condition = condition, value = value }, 'condition compared')

    condition.activated = condition.activated and evaluateOptions(condition, event, eventLog)
    logger.debug({ condition = condition, event = event, eventLog = eventLog }, 'options compared')
end

--- BEGIN

local conditionKey = KEYS[1]
local eventLogKey = KEYS[2]
local event = cjson.decode(ARGV[1])
local condition = getCondition(conditionKey)

-- check if event has already been processed within condition based on event id
if existsInEventLog(eventLogKey, event.id) == true then
    logger.debug({ event = event }, "event is already processed")
    return { to_unit(condition.activated), logger.tostring() }
end

-- check if condition has already been activated
if condition.activated == true then
    logger.debug({ condition = condition }, "condition is already activated")
    return { to_unit(condition.activated), logger.tostring() }
end

local eventLog = getEventLog(eventLogKey)
table.insert(eventLog, event)

evaluateCondition(condition, event, eventLog)
setConditionActivated(conditionKey, condition.activated)
setConditionCurrentValue(event.value)
appendEventLog(eventLogKey, event)

return { to_unit(condition.activated), logger.tostring() }
