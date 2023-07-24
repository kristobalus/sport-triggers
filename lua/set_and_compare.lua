
---- SETS DEFINITION -----
Set = {}

function Set.new (t)
    local set = {}
    for _, l in ipairs(t) do set[l] = true end
    return set
end

function Set.union (a,b)
    local res = Set.new{}
    for k in pairs(a) do res[k] = true end
    for k in pairs(b) do res[k] = true end
    return res
end

function Set.intersection (a,b)
    local res = Set.new{}
    for k in pairs(a) do
        res[k] = b[k]
    end
    return res
end

function Set.tostring (set)
    local s = "{"
    local sep = ""
    for e in pairs(set) do
        s = s .. sep .. e
        sep = ", "
    end
    return s .. "}"
end

function Set.print (s)
    print(Set.tostring(s))
end

Set.mt = {}    -- metatable for sets
function Set.new (t)   -- 2nd version
    local set = {}
    setmetatable(set, Set.mt)
    for _, l in ipairs(t) do set[l] = true end
    return set
end
Set.mt.__add = Set.union
Set.mt.__mul = Set.intersection

----- END OF SETS DEFINITION ------

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

local function eventlog_get_one(key, eventId)
    local result = redis.call("hget", key, eventId)
    return cjson.decode(result)
end

local function getEventLog(key)
    local result = {}
    local items = redis.call("hgetall", key)
    for _, item in ipairs(items) do
        table.insert(result, cjson.decode(item))
    end
    return result
end

local function compare(operation, value, target, type)
    local result = false
    if type == "number" then
        value = tonumber(value)
        target = tonumber(target)
    end
    if operation == "eq" then
        result = (value == target)
    end
    if type == "string" then
        return result
    end
    if operation == "gt" then
        result = (value > target)
    end
    if operation == "lt" then
        result = (value < target)
    end
    if operation == "ge" then
        result = (value >= target)
    end
    if operation == "le" then
        result = (value <= target)
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

local function compare_options(condition, event, eventLog)
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

                result = result and compare(conditionOption.compare, value, conditionOption.target, conditionOption.type)

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

    condition.activated = compare(condition.compare, value, condition.target, condition.type)
    logger.debug({ condition = condition, value = value }, 'condition compared')

    condition.activated = condition.activated and compare_options(condition, event, eventLog)
    logger.debug({ condition = condition, event = event, eventLog = eventLog }, 'options compared')
end

--- BEGIN

local conditionKey = KEYS[1]
local eventLogKey = KEYS[2]
local event = cjson.decode(ARGV[1])
local condition = getCondition(conditionKey)

-- check if event has already been processed based on event id
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
appendEventLog(eventLogKey, event)
setConditionActivated(conditionKey, condition.activated)
setConditionCurrentValue(event.value)

return { to_unit(condition.activated), logger.tostring() }
