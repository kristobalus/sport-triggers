### Integration

- get UI metadata by Triggers/GetMetadata
- draw UI
- user builds conditions with IU
- studio submits Triggers/Create request once with all conditions, no update is provided

## API description

### Triggers/GetMetadata
Retrieves UI metadata for specified eventId.
request
```json
{
    "event_id": "4591"    
}
```

response
```json
{
    "data": {
        "index": [
            "baseball.inningNumber",
            "baseball.inningHalf",
            "baseball.player.batter",
            "baseball.player.pitcher",
            "baseball.team.batter",
            "baseball.team.pitcher",
            "baseball.score.differential",
            "baseball.score.home",
            "baseball.score.away",
            "baseball.game.state.balls",
            "baseball.game.state.outs",
            "baseball.game.state.pitches",
            "baseball.game.state.strikes",
            "baseball.pitch.outcomes",
            "baseball.pitch.speed",
            "baseball.pitch.type",
            "baseball.atbat.outcomes"
        ],
        "limits": [
            {
                "limit": "baseball.inningNumber",
                "label": "Limit per inning",
                "description": "Should occur N times per inning"
            },
            {
                "limit": "baseball.inningHalf",
                "label": "Limit per inning half",
                "description": "Should occur N times per inning half"
            },
            {
                "limit": "minute",
                "label": "per minute",
                "description": "Event should occur no more than N times per minute"
            },
            {
                "limit": "scope",
                "label": "per game",
                "description": "Event should occur no more than N times per game"
            }
        ],
        "events": {
            "baseball.inningNumber": {
                "preferred_options": [],
                "compare": [
                    "eq",
                    "ge",
                    "gt",
                    "lt",
                    "le"
                ],
                "id": "baseball.inningNumber",
                "sport": "baseball",
                "primary": true,
                "input": "STUDIO_INPUT_NUMBER",
                "label": "Inning number"
            },
            "baseball.inningHalf": {
                "preferred_options": [],
                "compare": [
                    "eq",
                    "ge",
                    "gt",
                    "lt",
                    "le"
                ],
                "id": "baseball.inningHalf",
                "sport": "baseball",
                "primary": true,
                "input": "STUDIO_INPUT_SELECT_MULTI",
                "label": "Inning-half",
                "target_source": "baseball.inning.half"
            },
            "baseball.player.batter": {
                "preferred_options": [
                    "baseball.atbat.outcomes"
                ],
                "compare": [
                    "in"
                ],
                "id": "baseball.player.batter",
                "sport": "baseball",
                "primary": true,
                "input": "STUDIO_INPUT_SELECT_MULTI",
                "label": "Batter",
                "target_source": "game.players"
            },
            "baseball.player.pitcher": {
                "preferred_options": [
                    "baseball.pitch.outcomes",
                    "baseball.pitch.type",
                    "baseball.pitch.speed"
                ],
                "compare": [
                    "in"
                ],
                "id": "baseball.player.pitcher",
                "sport": "baseball",
                "primary": true,
                "input": "STUDIO_INPUT_SELECT_MULTI",
                "label": "Pitcher",
                "target_source": "game.players"
            },
            "baseball.team.batter": {
                "preferred_options": [
                    "baseball.atbat.outcomes"
                ],
                "compare": [
                    "in"
                ],
                "id": "baseball.team.batter",
                "sport": "baseball",
                "primary": true,
                "input": "STUDIO_INPUT_SELECT_MULTI",
                "label": "Team At Bat",
                "target_source": "game.teams"
            },
            "baseball.team.pitcher": {
                "preferred_options": [
                    "baseball.pitch.outcomes"
                ],
                "compare": [
                    "in"
                ],
                "id": "baseball.team.pitcher",
                "sport": "baseball",
                "primary": true,
                "input": "STUDIO_INPUT_SELECT",
                "label": "Team Pitching",
                "target_source": "game.teams"
            },
            "baseball.score.differential": {
                "preferred_options": [],
                "compare": [
                    "eq",
                    "ge",
                    "gt",
                    "le",
                    "lt"
                ],
                "id": "baseball.score.differential",
                "sport": "baseball",
                "primary": true,
                "input": "STUDIO_INPUT_NUMBER",
                "label": "Score differential"
            },
            "baseball.score.home": {
                "preferred_options": [],
                "compare": [
                    "eq",
                    "ge",
                    "gt",
                    "le",
                    "lt"
                ],
                "id": "baseball.score.home",
                "sport": "baseball",
                "primary": true,
                "input": "STUDIO_INPUT_NUMBER",
                "label": "Home score"
            },
            "baseball.score.away": {
                "preferred_options": [],
                "compare": [
                    "eq",
                    "ge",
                    "gt",
                    "le",
                    "lt"
                ],
                "id": "baseball.score.away",
                "sport": "baseball",
                "primary": true,
                "input": "STUDIO_INPUT_NUMBER",
                "label": "Away score"
            },
            "baseball.game.state.balls": {
                "preferred_options": [],
                "compare": [
                    "eq",
                    "le",
                    "ge",
                    "lt",
                    "gt"
                ],
                "id": "baseball.game.state.balls",
                "sport": "baseball",
                "primary": true,
                "input": "STUDIO_INPUT_NUMBER",
                "label": "Game stats, balls"
            },
            "baseball.game.state.outs": {
                "preferred_options": [],
                "compare": [
                    "eq",
                    "le",
                    "ge",
                    "lt",
                    "gt"
                ],
                "id": "baseball.game.state.outs",
                "sport": "baseball",
                "primary": true,
                "input": "STUDIO_INPUT_NUMBER",
                "label": "Game stats, outs"
            },
            "baseball.game.state.pitches": {
                "preferred_options": [],
                "compare": [
                    "eq",
                    "le",
                    "ge",
                    "lt",
                    "gt"
                ],
                "id": "baseball.game.state.pitches",
                "sport": "baseball",
                "primary": true,
                "input": "STUDIO_INPUT_NUMBER",
                "label": "Game stats, pitches"
            },
            "baseball.game.state.strikes": {
                "preferred_options": [],
                "compare": [
                    "eq",
                    "le",
                    "ge",
                    "lt",
                    "gt"
                ],
                "id": "baseball.game.state.strikes",
                "sport": "baseball",
                "primary": true,
                "input": "STUDIO_INPUT_NUMBER",
                "label": "Game stats, strikes"
            },
            "baseball.pitch.outcomes": {
                "preferred_options": [],
                "compare": [
                    "in"
                ],
                "id": "baseball.pitch.outcomes",
                "sport": "baseball",
                "primary": true,
                "input": "STUDIO_INPUT_SELECT_MULTI",
                "label": "Pitch Outcome",
                "target_source": "baseball.pitch.outcome"
            },
            "baseball.pitch.speed": {
                "preferred_options": [],
                "compare": [
                    "in"
                ],
                "id": "baseball.pitch.speed",
                "sport": "baseball",
                "primary": true,
                "input": "STUDIO_INPUT_SELECT_MULTI",
                "label": "Pitch speed",
                "target_source": "baseball.pitch.speed"
            },
            "baseball.pitch.type": {
                "preferred_options": [],
                "compare": [
                    "in"
                ],
                "id": "baseball.pitch.type",
                "sport": "baseball",
                "primary": true,
                "input": "STUDIO_INPUT_SELECT_MULTI",
                "label": "Pitch type",
                "target_source": "baseball.pitch.type"
            },
            "baseball.atbat.outcomes": {
                "preferred_options": [],
                "compare": [
                    "in"
                ],
                "id": "baseball.atbat.outcomes",
                "sport": "baseball",
                "primary": true,
                "input": "STUDIO_INPUT_SELECT_MULTI",
                "label": "AtBat Outcome",
                "target_source": "baseball.atbat.outcome"
            }
        },
        "sources": {
            "baseball.inning.half": {
                "targets": [
                    {
                        "label": "Top",
                        "description": "",
                        "id": "top",
                        "group": ""
                    },
                    {
                        "label": "Bottom",
                        "description": "",
                        "id": "bottom",
                        "group": ""
                    }
                ]
            },
            "game.players": {
                "targets": [
                    {
                        "label": "Abreu, Bryan",
                        "description": "",
                        "id": "650556",
                        "group": "Houston Astros"
                    },
                    {
                        "label": "Abreu, Jose",
                        "description": "",
                        "id": "547989",
                        "group": "Houston Astros"
                    },
                    {
                        "label": "Altuve, Jose",
                        "description": "",
                        "id": "514888",
                        "group": "Houston Astros"
                    },
                    {
                        "label": "Alvarez, Yordan",
                        "description": "",
                        "id": "670541",
                        "group": "Houston Astros"
                    },
                    {
                        "label": "Bielak, Brandon",
                        "description": "",
                        "id": "656232",
                        "group": "Houston Astros"
                    },
                    {
                        "label": "Blanco, Ronel",
                        "description": "",
                        "id": "669854",
                        "group": "Houston Astros"
                    },
                    {
                        "label": "Bregman, Alex",
                        "description": "",
                        "id": "608324",
                        "group": "Houston Astros"
                    },
                    {
                        "label": "Brown, Hunter",
                        "description": "",
                        "id": "686613",
                        "group": "Houston Astros"
                    },
                    {
                        "label": "Diaz, Yainer",
                        "description": "",
                        "id": "673237",
                        "group": "Houston Astros"
                    },
                    {
                        "label": "Dubin, Shawn",
                        "description": "",
                        "id": "681869",
                        "group": "Houston Astros"
                    },
                    {
                        "label": "Dubon, Mauricio",
                        "description": "",
                        "id": "643289",
                        "group": "Houston Astros"
                    },
                    {
                        "label": "France, J.P.",
                        "description": "",
                        "id": "641585",
                        "group": "Houston Astros"
                    },
                    {
                        "label": "Gage, Matt",
                        "description": "",
                        "id": "657424",
                        "group": "Houston Astros"
                    },
                    {
                        "label": "Garcia, Luis",
                        "description": "",
                        "id": "677651",
                        "group": "Houston Astros"
                    },
                    {
                        "label": "Graveman, Kendall",
                        "description": "",
                        "id": "608665",
                        "group": "Houston Astros"
                    },
                    {
                        "label": "Hensley, David",
                        "description": "",
                        "id": "682073",
                        "group": "Houston Astros"
                    },
                    {
                        "label": "Javier, Cristian",
                        "description": "",
                        "id": "664299",
                        "group": "Houston Astros"
                    },
                    {
                        "label": "Julks, Corey",
                        "description": "",
                        "id": "667452",
                        "group": "Houston Astros"
                    },
                    {
                        "label": "Kessinger, Grae",
                        "description": "",
                        "id": "666197",
                        "group": "Houston Astros"
                    },
                    {
                        "label": "Kuhnel, Joel",
                        "description": "",
                        "id": "669270",
                        "group": "Houston Astros"
                    },
                    {
                        "label": "Martinez, Seth",
                        "description": "",
                        "id": "661527",
                        "group": "Houston Astros"
                    },
                    {
                        "label": "McCormick, Chas",
                        "description": "",
                        "id": "676801",
                        "group": "Houston Astros"
                    },
                    {
                        "label": "McCullers Jr., Lance",
                        "description": "",
                        "id": "621121",
                        "group": "Houston Astros"
                    },
                    {
                        "label": "Meyers, Jake",
                        "description": "",
                        "id": "676694",
                        "group": "Houston Astros"
                    },
                    {
                        "label": "Montero, Rafael",
                        "description": "",
                        "id": "606160",
                        "group": "Houston Astros"
                    },
                    {
                        "label": "Mushinski, Parker",
                        "description": "",
                        "id": "656786",
                        "group": "Houston Astros"
                    },
                    {
                        "label": "Ortega, Oliver",
                        "description": "",
                        "id": "661383",
                        "group": "Houston Astros"
                    },
                    {
                        "label": "Pena, Jeremy",
                        "description": "",
                        "id": "665161",
                        "group": "Houston Astros"
                    },
                    {
                        "label": "Pressly, Ryan",
                        "description": "",
                        "id": "519151",
                        "group": "Houston Astros"
                    },
                    {
                        "label": "Salazar, Cesar",
                        "description": "",
                        "id": "663967",
                        "group": "Houston Astros"
                    },
                    {
                        "label": "Singleton, Jon",
                        "description": "",
                        "id": "572138",
                        "group": "Houston Astros"
                    },
                    {
                        "label": "Sousa, Bennett",
                        "description": "",
                        "id": "656986",
                        "group": "Houston Astros"
                    },
                    {
                        "label": "Tucker, Kyle",
                        "description": "",
                        "id": "663656",
                        "group": "Houston Astros"
                    },
                    {
                        "label": "Urquidy, Jose",
                        "description": "",
                        "id": "664353",
                        "group": "Houston Astros"
                    },
                    {
                        "label": "Valdez, Framber",
                        "description": "",
                        "id": "664285",
                        "group": "Houston Astros"
                    },
                    {
                        "label": "Verlander, Justin",
                        "description": "",
                        "id": "434378",
                        "group": "Houston Astros"
                    },
                    {
                        "label": "Whitley, Forrest",
                        "description": "",
                        "id": "666215",
                        "group": "Houston Astros"
                    },
                    {
                        "label": "Anderson, Grant",
                        "description": "",
                        "id": "681982",
                        "group": "Texas Rangers"
                    },
                    {
                        "label": "Bradford, Cody",
                        "description": "",
                        "id": "674003",
                        "group": "Texas Rangers"
                    },
                    {
                        "label": "Burke, Brock",
                        "description": "",
                        "id": "656271",
                        "group": "Texas Rangers"
                    },
                    {
                        "label": "Bush, Matt",
                        "description": "",
                        "id": "456713",
                        "group": "Texas Rangers"
                    },
                    {
                        "label": "Carter, Evan",
                        "description": "",
                        "id": "694497",
                        "group": "Texas Rangers"
                    },
                    {
                        "label": "deGrom, Jacob",
                        "description": "",
                        "id": "594798",
                        "group": "Texas Rangers"
                    },
                    {
                        "label": "Dunning, Dane",
                        "description": "",
                        "id": "641540",
                        "group": "Texas Rangers"
                    },
                    {
                        "label": "Duran, Ezequiel",
                        "description": "",
                        "id": "677649",
                        "group": "Texas Rangers"
                    },
                    {
                        "label": "Eovaldi, Nathan",
                        "description": "",
                        "id": "543135",
                        "group": "Texas Rangers"
                    },
                    {
                        "label": "Garcia, Adolis",
                        "description": "",
                        "id": "666969",
                        "group": "Texas Rangers"
                    },
                    {
                        "label": "Gray, Jon",
                        "description": "",
                        "id": "592351",
                        "group": "Texas Rangers"
                    },
                    {
                        "label": "Harris, Dustin",
                        "description": "",
                        "id": "687957",
                        "group": "Texas Rangers"
                    },
                    {
                        "label": "Heaney, Andrew",
                        "description": "",
                        "id": "571760",
                        "group": "Texas Rangers"
                    },
                    {
                        "label": "Hedges, Austin",
                        "description": "",
                        "id": "595978",
                        "group": "Texas Rangers"
                    },
                    {
                        "label": "Heim, Jonah",
                        "description": "",
                        "id": "641680",
                        "group": "Texas Rangers"
                    },
                    {
                        "label": "Hernandez, Jonathan",
                        "description": "",
                        "id": "642546",
                        "group": "Texas Rangers"
                    },
                    {
                        "label": "Huff, Sam",
                        "description": "",
                        "id": "669087",
                        "group": "Texas Rangers"
                    },
                    {
                        "label": "Jung, Josh",
                        "description": "",
                        "id": "673962",
                        "group": "Texas Rangers"
                    },
                    {
                        "label": "Kent, Zak",
                        "description": "",
                        "id": "687849",
                        "group": "Texas Rangers"
                    },
                    {
                        "label": "Latz, Jake",
                        "description": "",
                        "id": "656641",
                        "group": "Texas Rangers"
                    },
                    {
                        "label": "Leclerc, Jose",
                        "description": "",
                        "id": "600917",
                        "group": "Texas Rangers"
                    },
                    {
                        "label": "Lowe, Nathaniel",
                        "description": "",
                        "id": "663993",
                        "group": "Texas Rangers"
                    },
                    {
                        "label": "Martin, Brett",
                        "description": "",
                        "id": "656685",
                        "group": "Texas Rangers"
                    },
                    {
                        "label": "Martinez, J.P.",
                        "description": "",
                        "id": "679881",
                        "group": "Texas Rangers"
                    },
                    {
                        "label": "Ornelas, Jonathan",
                        "description": "",
                        "id": "680716",
                        "group": "Texas Rangers"
                    },
                    {
                        "label": "Rodriguez, Yerry",
                        "description": "",
                        "id": "666720",
                        "group": "Texas Rangers"
                    },
                    {
                        "label": "Sborz, Josh",
                        "description": "",
                        "id": "622250",
                        "group": "Texas Rangers"
                    },
                    {
                        "label": "Scherzer, Max",
                        "description": "",
                        "id": "453286",
                        "group": "Texas Rangers"
                    },
                    {
                        "label": "Seager, Corey",
                        "description": "",
                        "id": "608369",
                        "group": "Texas Rangers"
                    },
                    {
                        "label": "Semien, Marcus",
                        "description": "",
                        "id": "543760",
                        "group": "Texas Rangers"
                    },
                    {
                        "label": "Smith, Josh H.",
                        "description": "",
                        "id": "669701",
                        "group": "Texas Rangers"
                    },
                    {
                        "label": "Taveras, Leody",
                        "description": "",
                        "id": "665750",
                        "group": "Texas Rangers"
                    },
                    {
                        "label": "White, Owen",
                        "description": "",
                        "id": "669391",
                        "group": "Texas Rangers"
                    },
                    {
                        "label": "Winn, Cole",
                        "description": "",
                        "id": "668390",
                        "group": "Texas Rangers"
                    }
                ]
            },
            "game.teams": {
                "targets": [
                    {
                        "label": "Houston Astros",
                        "description": "",
                        "id": "HOU",
                        "group": ""
                    },
                    {
                        "label": "Texas Rangers",
                        "description": "",
                        "id": "TEX",
                        "group": ""
                    }
                ]
            },
            "baseball.pitch.outcome": {
                "targets": [
                    {
                        "label": "Strike - Swinging",
                        "description": "",
                        "id": "strike_swinging",
                        "group": ""
                    },
                    {
                        "label": "Strike - Looking",
                        "description": "",
                        "id": "strike_looking",
                        "group": ""
                    },
                    {
                        "label": "Ball in Play",
                        "description": "",
                        "id": "ball_in_play",
                        "group": ""
                    },
                    {
                        "label": "Ball",
                        "description": "",
                        "id": "ball",
                        "group": ""
                    },
                    {
                        "label": "Foul",
                        "description": "",
                        "id": "foul",
                        "group": ""
                    },
                    {
                        "label": "Greater than 90mph",
                        "description": "",
                        "id": "gt.90",
                        "group": ""
                    },
                    {
                        "label": "Less than 80mph",
                        "description": "",
                        "id": "lt.80",
                        "group": ""
                    }
                ]
            },
            "baseball.pitch.speed": {
                "targets": [
                    {
                        "label": "Ball speed > 99 mph",
                        "description": "",
                        "id": "GT99",
                        "group": ""
                    },
                    {
                        "label": "Ball speed 96-99 mph",
                        "description": "",
                        "id": "B96-99",
                        "group": ""
                    },
                    {
                        "label": "Ball seed 90-95 mph",
                        "description": "",
                        "id": "B90-95",
                        "group": ""
                    },
                    {
                        "label": "Ball speed 80-89 mph",
                        "description": "",
                        "id": "B80-89",
                        "group": ""
                    },
                    {
                        "label": "Ball speed < 80 mph",
                        "description": "",
                        "id": "LT80",
                        "group": ""
                    }
                ]
            },
            "baseball.pitch.type": {
                "targets": [
                    {
                        "label": "FA",
                        "description": "fastball",
                        "id": "FA",
                        "group": ""
                    },
                    {
                        "label": "CT",
                        "description": "fastball cutter",
                        "id": "CT",
                        "group": ""
                    },
                    {
                        "label": "SI",
                        "description": "fastball sinker",
                        "id": "SI",
                        "group": ""
                    },
                    {
                        "label": "SL",
                        "description": "off-speed slider",
                        "id": "SL",
                        "group": ""
                    },
                    {
                        "label": "CH",
                        "description": "off-speed changeup",
                        "id": "CH",
                        "group": ""
                    },
                    {
                        "label": "CU",
                        "description": "off-speed curveball",
                        "id": "CU",
                        "group": ""
                    }
                ]
            },
            "baseball.atbat.outcome": {
                "targets": [
                    {
                        "label": "GIDP",
                        "description": "",
                        "id": "GIDP",
                        "group": ""
                    },
                    {
                        "label": "BB",
                        "description": "",
                        "id": "BB",
                        "group": ""
                    },
                    {
                        "label": "BI",
                        "description": "",
                        "id": "BI",
                        "group": ""
                    },
                    {
                        "label": "FO",
                        "description": "",
                        "id": "FO",
                        "group": ""
                    },
                    {
                        "label": "CI",
                        "description": "",
                        "id": "CI",
                        "group": ""
                    },
                    {
                        "label": "GO",
                        "description": "",
                        "id": "GO",
                        "group": ""
                    },
                    {
                        "label": "XBH",
                        "description": "",
                        "id": "XBH",
                        "group": ""
                    },
                    {
                        "label": "X1",
                        "description": "",
                        "id": "X1",
                        "group": ""
                    },
                    {
                        "label": "X2",
                        "description": "",
                        "id": "X2",
                        "group": ""
                    },
                    {
                        "label": "X3",
                        "description": "",
                        "id": "X3",
                        "group": ""
                    },
                    {
                        "label": "REACH",
                        "description": "",
                        "id": "REACH",
                        "group": ""
                    },
                    {
                        "label": "RBI",
                        "description": "",
                        "id": "RBI",
                        "group": ""
                    },
                    {
                        "label": "OUT",
                        "description": "",
                        "id": "OUT",
                        "group": ""
                    },
                    {
                        "label": "KS",
                        "description": "Strikeout swinging",
                        "id": "KS",
                        "group": ""
                    },
                    {
                        "label": "IPO",
                        "description": "",
                        "id": "IPO",
                        "group": ""
                    },
                    {
                        "label": "KL",
                        "description": "Strikeout looking",
                        "id": "KL",
                        "group": ""
                    },
                    {
                        "label": "K",
                        "description": "All strikeouts",
                        "id": "K",
                        "group": ""
                    },
                    {
                        "label": "HIT",
                        "description": "",
                        "id": "HIT",
                        "group": ""
                    },
                    {
                        "label": "HR",
                        "description": "",
                        "id": "HR",
                        "group": ""
                    },
                    {
                        "label": "HBP",
                        "description": "",
                        "id": "HBP",
                        "group": ""
                    }
                ]
            }
        },
        "game": {
            "id": "2fd8607e-b598-4301-9b0d-48f82ff60829",
            "sport": "baseball",
            "datasource": "nvenue",
            "scope": "game"
        }
    }
}
```

### Triggers/CreateTrigger

request
```json
{
    "trigger": {
        "name": "Question activation trigger",
        "description": "Intended for activation of question #63206",
        "datasource": "sportradar",
        "scope": "game",
        "scope_id": "0d996d35-85e5-4913-bd45-ac9cfedbf272",
        "entity": "question",
        "entity_id": "63206",
        "disabled": false,
        "disabled_entity": true,
        "use_entity_limits": false,
        "use_condition_threshold": false
    },
    "conditions": [        
        {
            "event": "basketball.team",
            "compare": "in",
            "targets": [ "team-1" ],            
            "options": [
                {
                    "event": "basketball.team.scores.points",
                    "compare": "ge",
                    "targets": [ "10" ]
                }
            ]
        }        
    ],
    "limits": {        
        "basketball.sequence": 1
    }
}
```

response
```json
{
    "data": {
        "id": "5915aac7-e62b-4f92-a6ed-486395e9db08",
        "type": "trigger"
    }
}
```

### Triggers/GetTrigger
Trigger can be fetched by its unique id.

request
```json
{
    "id": "5915aac7-e62b-4f92-a6ed-486395e9db08"
}
```
response
```json
{
    "data": {
        "id": "5915aac7-e62b-4f92-a6ed-486395e9db08",
        "type": "trigger",
        "attributes": {
            "id": "",
            "name": "",
            "description": "",
            "scope": "",
            "scope_id": "",
            "activated": false,
            "entity": "",
            "entity_id": ""
        }
    }
}
```

### Triggers/ListTriggers
Retrieves all triggers attached to event.

request
```json
{
    "entity": "event",
    "entity_id": "674"
}
```

response
```json
{
    "data": [
        {
            "id": "5915aac7-e62b-4f92-a6ed-486395e9db08",
            "type": "trigger",
            "attributes": {
                "conditions": [
                    {
                        "targets": [
                            "start"
                        ],
                        "log": [],
                        "options": [],
                        "id": "f21c70c7-688a-4638-97f5-699aaf3fcae6",
                        "trigger_id": "",
                        "event": "basketball.game.level",
                        "datasource": "sportradar",
                        "scope": "",
                        "scope_id": "",
                        "compare": "eq",
                        "type": "",
                        "current": "",
                        "activated": false,
                        "chain_order": 0,
                        "chain_operation": "and"
                    },
                    {
                        "targets": [
                            "30"
                        ],
                        "log": [],
                        "options": [],
                        "id": "6737cf5c-5c66-4e5f-a802-65c58040d9f8",
                        "trigger_id": "",
                        "event": "basketball.game.points.home",
                        "datasource": "sportradar",
                        "scope": "",
                        "scope_id": "",
                        "compare": "eq",
                        "type": "",
                        "current": "",
                        "activated": false,
                        "chain_order": 1,
                        "chain_operation": "and"
                    },
                    {
                        "targets": [
                            "583ec9d6-fb46-11e1-82cb-f4ce4684ea4c"
                        ],
                        "log": [],
                        "options": [],
                        "id": "7699007f-4e9d-4d21-8f6a-27123aa0cf97",
                        "trigger_id": "",
                        "event": "basketball.team.shooting.foul",
                        "datasource": "sportradar",
                        "scope": "",
                        "scope_id": "",
                        "compare": "in",
                        "type": "",
                        "current": "",
                        "activated": false,
                        "chain_order": 2,
                        "chain_operation": "and"
                    }
                ],
                "trigger": {
                    "id": "5915aac7-e62b-4f92-a6ed-486395e9db08",
                    "name": "Trigger",
                    "description": "Trigger description",
                    "scope": "game",
                    "scope_id": "0d996d35-85e5-4913-bd45-ac9cfedbf272",
                    "activated": false,
                    "entity": "event",
                    "entity_id": "674"
                }
            }
        }
    ]
}
```

### Triggers/Subscribe
Creates subscription of some entity to trigger activation event.

request
```json
{
    "subscription": {
        "entity": "question",
        "entity_id": "123",
        "route": "interactive.studio.questions.activate",
        "payload": {
            "id": "123"
        }    
    },
    "trigger_id": "5915aac7-e62b-4f92-a6ed-486395e9db08"
}
```

response
```json
{
    "data": {
        "id": "8888ff09-7018-4a83-bf76-ddb9237597dc",
        "type": "subscription"
    }
}
```


### Triggers/ListSubscription

#### 1. by trigger
```json
{
    "trigger_id": "5915aac7-e62b-4f92-a6ed-486395e9db08"
}
```
response
```json
{
    "data": [
        {
            "id": "8888ff09-7018-4a83-bf76-ddb9237597dc",
            "type": "subscription",
            "attributes": {
                "payload": {
                    "id": "123"
                },
                "options": {},
                "id": "8888ff09-7018-4a83-bf76-ddb9237597dc",
                "trigger_id": "5915aac7-e62b-4f92-a6ed-486395e9db08",
                "route": "interactive.studio.questions.activate",
                "entity": "question",
                "entity_id": "123"
            }
        }
    ]
}
```

#### 2. by subscribed entity and it id
```json
{
    "entity": "question",
    "entity_id": "123"
}
```

response
```json
{
    "data": [
        {
            "id": "8888ff09-7018-4a83-bf76-ddb9237597dc",
            "type": "subscription",
            "attributes": {
                "payload": {
                    "id": "123"
                },
                "options": {},
                "id": "8888ff09-7018-4a83-bf76-ddb9237597dc",
                "trigger_id": "5915aac7-e62b-4f92-a6ed-486395e9db08",
                "route": "interactive.studio.questions.activate",
                "entity": "question",
                "entity_id": "123"
            }
        }
    ]
}
```

### Triggers/CancelSubscription
Entity subscription can be cancelled.
```json
{
    "id": "8888ff09-7018-4a83-bf76-ddb9237597dc"
}
```
response
```json
{
    "data": {
        "id": "8888ff09-7018-4a83-bf76-ddb9237597dc",
        "type": "subscription"
    }
}
```
