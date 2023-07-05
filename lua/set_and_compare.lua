local log = {}

local types = {
    set_and_compare_as_string = "set_and_compare_as_string",
    incr_and_compare = "incr_and_compare",
    set_and_compare = "set_and_compare"
}

local function as_string(type)
    if type == types.set_and_compare_as_string then
        return true
    end
    return false
end

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

local conditionKey = KEYS[1];
local condition = {
    target = redis.call("hget", conditionKey, "target"),
    compare = redis.call("hget", conditionKey, "compare"),
    current = ARGV[1],
    type = redis.call("hget", conditionKey, "type"),
    activated = to_bool(redis.call("hget", conditionKey, "activated"))
}

-- skip current from ARGV
table.remove(ARGV, 1);

if condition.activated == true then
    -- should not append event log
    return { to_unit(condition.activated), 0, cjson.encode(log) }
end

-- should
--   1. set current value, replacing the old one as set(conditionKey, currentValue)
redis.call("hset", conditionKey, "current", condition.current)

local function convert_argv_to_options()
    local arr = {}
    for i = 1, #ARGV, 2 do
        local name = ARGV[i]
        local value = ARGV[i + 1]
        table.insert(arr, { name = name, value = value })
        -- table.insert(arr, event .. "=" .. value)
    end
    return arr
end

local function execute_compare_op(compareOp, currentValue, targetValue, asString)
    local result = false
    if asString == false then
        currentValue = tonumber(currentValue)
        targetValue = tonumber(targetValue)
    end
    if compareOp == "eq" then
        result = (currentValue == targetValue)
    end
    if compareOp == "gt" then
        result = (currentValue > targetValue)
    end
    if compareOp == "lt" then
        result = (currentValue < targetValue)
    end
    if compareOp == "ge" then
        result = (currentValue >= targetValue)
    end
    if compareOp == "le" then
        result = (currentValue <= targetValue)
    end
    return result
end

local function compare_options(events)
    local data = redis.call("hget", conditionKey, "options")
    if data then
        local options = cjson.decode(data)
        local result = true
        for i, event in ipairs(events) do
            for j, option in ipairs(options) do
                -- option.compare
                -- option.target
                -- option.event
                -- option.type
                if event.name == option.event then
                    result = result and execute_compare_op(option.compare, event.value, option.target, option.type)
                    table.insert(log, { event = event, option = option, result = result })
                end
            end
        end
        return result
    else
        return true
    end
end

condition.activated = execute_compare_op(condition.compare, condition.current, condition.target, as_string(condition.type))
table.insert(log, { condition = condition })

condition.activated = condition.activated and compare_options(convert_argv_to_options())
table.insert(log, { condition = condition })

redis.call("hset", conditionKey, "activated", to_unit(condition.activated))

 --should append event to log
return { to_unit(condition.activated), 1, cjson.encode(log) }
