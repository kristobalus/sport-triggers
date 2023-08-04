local function Debug()

    local enabled = true
    local _debug = {}

    local function add(_, data, message)
        if (enabled) then
            table.insert(_debug, cjson.encode({ data, message }))
        end
    end

    local function tostring()
        local doc = {}
        for _, row in ipairs(_debug) do
            table.insert(doc, cjson.decode(row))
        end
        return cjson.encode(doc)
    end

    local ns = {
        add = add,
        tostring = tostring
    }

    return ns
end

local debug = Debug()

local function tounit(value)
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

local function tobool(value)
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

local Conditions = {}
function Conditions:load(key)

    local targets = redis.call("hget", key, "targets")
    local options = redis.call("hget", key, "options")

    if options == nil then
        options = {}
    else
        options = cjson.decode(options)
    end

    if targets == nil then
        targets = {}
    else
        targets = cjson.decode(targets)
    end

    local condition = {
        key = key,
        event = redis.call("hget", key, "event"),
        compare = redis.call("hget", key, "compare"),
        type = redis.call("hget", key, "type"),
        current = redis.call("hget", key, "current"),
        activated = tobool(redis.call("hget", key, "activated")),
        options = options,
        targets = targets,
    }

    -- debug:add({ targets = targets, options = options }, "arrays")

    if condition.current == false then
        condition.current = ""
    end

    debug:add({ condition = condition }, "condition")

    return condition
end

function Conditions:save(condition)
    debug:add({ condition = condition }, "save")
    redis.call("hset", condition.key, "current", condition.current)
    redis.call("hset", condition.key, "activated", tounit(condition.activated))
end

local function Log(key)

    local function append(_, event)
        redis.call("hset", key, event.id, cjson.encode(event))
    end

    local function exists(_, event)
        -- event.id
        local result = redis.call("hexists", key, event.id)
        return tobool(result)
    end

    local function events()
        local result = {}
        local items = redis.call("hgetall", key)
        for i, item in ipairs(items) do
            if i % 2 == 0 then
                table.insert(result, cjson.decode(item))
            end
        end
        return result
    end

    local ns = {
        append = append,
        exists = exists,
        events = events
    }

    return ns
end

local function Evaluator()

    local function to_table(arr)
        local result = {}
        for i = 1, #arr, 2 do
            result[arr[i]] = arr[i + 1]
        end
        return result
    end

    local function ft_aggregate(query)
        local _, arr = unpack(redis.call(unpack(query)))
        local result = to_table(arr)
        debug:add({ result = result }, "result of ft.aggregate invocation")
        return result.count
    end

    -- operation: operation on value and targets, one of [ eq, lt, gt, ge, le, in ]
    -- value:  value from event to be compared with targets
    -- targets: JSON array of strings
    -- type: type of data in targets and value, "number" or "string"
    local function compare(operation, value, targets, type)
        local result = false

        -- do typecasting

        if type == "number" then
            value = tonumber(value)
            for i, target in ipairs(targets) do
                targets[i] = tonumber(targets[i])
            end
        end

        if type == "string" then
            value = tostring(value)
            for i, target in ipairs(targets) do
                targets[i] = tostring(targets[i])
            end
        end

        debug:add({
            operation = operation,
            value = value,
            targets = targets,
            type = type
        }, "compare()")

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
            return has(targets, value)
        end

        -- single target for non-"in" ops
        local target = targets[1]

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

    -- evaluates condition against current event and log of events
    ---evaluate
    ---@param _ table reference to calling object
    ---@param condition table reference to condition object
    ---@param event table current adapter event to be evaluated
    ---@param events table log of previous adapter events
    local function evaluate(_, condition, event)

        local value
        if condition.aggregate ~= nil then
            value = ft_aggregate(condition.aggregate)
        else
            value = event.value
        end

        if condition.event ~= event.name then
            debug:add({ condition = condition, event = event }, 'condition event mismatched')
            condition.activated = false
            return
        end

        -- evaluate operation on main condition (fields targets and operation)
        condition.activated = compare(condition.compare, value, condition.targets, condition.type)
        debug:add({ condition = condition, event = event, value = value }, 'condition compared')

        if condition.activated then
            -- evaluate options of the condition
            for _, option in ipairs(condition.options) do
                -- conditionOption.compare
                -- conditionOption.targets
                -- conditionOption.event
                -- conditionOption.type
                debug:add(option, 'option to be compared')
                local matched = false
                for name, challenge in pairs(event.options) do
                    -- eventOption.name
                    -- eventOption.value
                    matched = name == option.event
                    if matched then

                        local value

                        if option.aggregate ~= nil then
                            value = ft_aggregate(option.aggregate)
                            debug:add({ aggregate = option.aggregate }, "ft.aggregate executed")
                        else
                            value = challenge
                        end

                        condition.activated = condition.activated and
                                compare(option.compare, value, option.targets, option.type)

                        debug:add({
                            name = name,
                            value = value,
                            compare = option.compare,
                            targets = option.targets,
                            type = option.type,
                            result = condition.activated }, 'option compared')

                        break
                    end
                end
                if matched == false then
                    -- all options must be evaluated to true
                    condition.activated = false
                end
                if condition.activated == false then
                    -- all options must be evaluated to true
                    break
                end
            end

            debug:add({ condition = condition, event = event }, 'options compared')
        end


    end

    local ns = {
        evaluate = evaluate
    }

    return ns
end

--- BEGIN

local condition = Conditions:load(KEYS[1])
local log = Log(KEYS[2])
local event = cjson.decode(ARGV[1])
--debug:add({ condition }, "loaded")

-- check if event has already been processed within condition based on event id
if log:exists(event) == true then
    debug:add({ event = event }, "event is already processed")
    return { tounit(condition.activated), debug:tostring() }
end

-- check if condition has already been activated
if condition.activated == true then
    debug:add({ condition = condition }, "condition is already activated")
    return { tounit(condition.activated), debug:tostring() }
end

--debug:add({ condition = condition }, "condition")
--debug:add({ event = event }, "event")

local evaluator = Evaluator()
evaluator:evaluate(condition, event)

condition.current = event.value
Conditions:save(condition)
log:append(event)

return { tounit(condition.activated), debug:tostring() }
