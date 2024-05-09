```js
getMetadata(eventId)
```

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
                "label": "per inning",
                "description": "Should occur N times per inning"
            },
            {
                "limit": "baseball.inningHalf",
                "label": "per inning half",
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
                    "baseball.atbat.outcomes",
                    "baseball.pitch.outcomes",
                    "baseball.pitch.type",
                    "baseball.pitch.speed"
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
                    "baseball.atbat.outcomes",
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
                    "baseball.atbat.outcomes",
                    "baseball.pitch.outcomes",
                    "baseball.pitch.type",
                    "baseball.pitch.speed"
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
                    "baseball.atbat.outcomes",
                    "baseball.pitch.outcomes",
                    "baseball.pitch.type",
                    "baseball.pitch.speed"
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
                "primary": false,
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
                "primary": false,
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
                "primary": false,
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
                "primary": false,
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
                        "label": "Ashcraft, Braxton",
                        "description": "",
                        "id": "677952",
                        "group": "Pittsburgh Pirates"
                    },
                    {
                        "label": "Bae, Ji Hwan",
                        "description": "",
                        "id": "678225",
                        "group": "Pittsburgh Pirates"
                    },
                    {
                        "label": "Bednar, David",
                        "description": "",
                        "id": "670280",
                        "group": "Pittsburgh Pirates"
                    },
                    {
                        "label": "Borucki, Ryan",
                        "description": "",
                        "id": "621366",
                        "group": "Pittsburgh Pirates"
                    },
                    {
                        "label": "Brubaker, JT",
                        "description": "",
                        "id": "664141",
                        "group": "Pittsburgh Pirates"
                    },
                    {
                        "label": "Burrows, Mike",
                        "description": "",
                        "id": "681347",
                        "group": "Pittsburgh Pirates"
                    },
                    {
                        "label": "Chapman, Aroldis",
                        "description": "",
                        "id": "547973",
                        "group": "Pittsburgh Pirates"
                    },
                    {
                        "label": "Cheng, Tsung-Che",
                        "description": "",
                        "id": "691907",
                        "group": "Pittsburgh Pirates"
                    },
                    {
                        "label": "Contreras, Roansy",
                        "description": "",
                        "id": "672710",
                        "group": "Pittsburgh Pirates"
                    },
                    {
                        "label": "Cruz, Oneil",
                        "description": "",
                        "id": "665833",
                        "group": "Pittsburgh Pirates"
                    },
                    {
                        "label": "Davis, Henry",
                        "description": "",
                        "id": "680779",
                        "group": "Pittsburgh Pirates"
                    },
                    {
                        "label": "Delay, Jason",
                        "description": "",
                        "id": "641511",
                        "group": "Pittsburgh Pirates"
                    },
                    {
                        "label": "Falter, Bailey",
                        "description": "",
                        "id": "663559",
                        "group": "Pittsburgh Pirates"
                    },
                    {
                        "label": "Gonzales, Marco",
                        "description": "",
                        "id": "594835",
                        "group": "Pittsburgh Pirates"
                    },
                    {
                        "label": "Gonzales, Nick",
                        "description": "",
                        "id": "693304",
                        "group": "Pittsburgh Pirates"
                    },
                    {
                        "label": "Hayes, Ke'Bryan",
                        "description": "",
                        "id": "663647",
                        "group": "Pittsburgh Pirates"
                    },
                    {
                        "label": "Hernandez, Jose",
                        "description": "",
                        "id": "669796",
                        "group": "Pittsburgh Pirates"
                    },
                    {
                        "label": "Holderman, Colin",
                        "description": "",
                        "id": "670059",
                        "group": "Pittsburgh Pirates"
                    },
                    {
                        "label": "Joe, Connor",
                        "description": "",
                        "id": "656582",
                        "group": "Pittsburgh Pirates"
                    },
                    {
                        "label": "Keller, Mitch",
                        "description": "",
                        "id": "656605",
                        "group": "Pittsburgh Pirates"
                    },
                    {
                        "label": "McCutchen, Andrew",
                        "description": "",
                        "id": "457705",
                        "group": "Pittsburgh Pirates"
                    },
                    {
                        "label": "Mlodzinski, Carmen",
                        "description": "",
                        "id": "669387",
                        "group": "Pittsburgh Pirates"
                    },
                    {
                        "label": "Moreta, Dauri",
                        "description": "",
                        "id": "664294",
                        "group": "Pittsburgh Pirates"
                    },
                    {
                        "label": "Nicolas, Kyle",
                        "description": "",
                        "id": "693312",
                        "group": "Pittsburgh Pirates"
                    },
                    {
                        "label": "Olivares, Edward",
                        "description": "",
                        "id": "658668",
                        "group": "Pittsburgh Pirates"
                    },
                    {
                        "label": "Ortiz, Luis L.",
                        "description": "",
                        "id": "682847",
                        "group": "Pittsburgh Pirates"
                    },
                    {
                        "label": "Oviedo, Johan",
                        "description": "",
                        "id": "670912",
                        "group": "Pittsburgh Pirates"
                    },
                    {
                        "label": "Palacios, Joshua",
                        "description": "",
                        "id": "641943",
                        "group": "Pittsburgh Pirates"
                    },
                    {
                        "label": "Peguero, Liover",
                        "description": "",
                        "id": "678894",
                        "group": "Pittsburgh Pirates"
                    },
                    {
                        "label": "Perez, Martin",
                        "description": "",
                        "id": "527048",
                        "group": "Pittsburgh Pirates"
                    },
                    {
                        "label": "Priester, Quinn",
                        "description": "",
                        "id": "682990",
                        "group": "Pittsburgh Pirates"
                    },
                    {
                        "label": "Reynolds, Bryan",
                        "description": "",
                        "id": "668804",
                        "group": "Pittsburgh Pirates"
                    },
                    {
                        "label": "Rodriguez, Endy",
                        "description": "",
                        "id": "682848",
                        "group": "Pittsburgh Pirates"
                    },
                    {
                        "label": "Sanchez, Ali",
                        "description": "",
                        "id": "645305",
                        "group": "Pittsburgh Pirates"
                    },
                    {
                        "label": "Selby, Colin",
                        "description": "",
                        "id": "681882",
                        "group": "Pittsburgh Pirates"
                    },
                    {
                        "label": "Suwinski, Jack",
                        "description": "",
                        "id": "669261",
                        "group": "Pittsburgh Pirates"
                    },
                    {
                        "label": "Tellez, Rowdy",
                        "description": "",
                        "id": "642133",
                        "group": "Pittsburgh Pirates"
                    },
                    {
                        "label": "Triolo, Jared",
                        "description": "",
                        "id": "669707",
                        "group": "Pittsburgh Pirates"
                    },
                    {
                        "label": "Williams, Alika",
                        "description": "",
                        "id": "675961",
                        "group": "Pittsburgh Pirates"
                    },
                    {
                        "label": "Wolf, Jackson",
                        "description": "",
                        "id": "680232",
                        "group": "Pittsburgh Pirates"
                    },
                    {
                        "label": "Adames, Willy",
                        "description": "",
                        "id": "642715",
                        "group": "Milwaukee Brewers"
                    },
                    {
                        "label": "Andrews, Clayton",
                        "description": "",
                        "id": "677076",
                        "group": "Milwaukee Brewers"
                    },
                    {
                        "label": "Ashby, Aaron",
                        "description": "",
                        "id": "676879",
                        "group": "Milwaukee Brewers"
                    },
                    {
                        "label": "Bauers, Jake",
                        "description": "",
                        "id": "641343",
                        "group": "Milwaukee Brewers"
                    },
                    {
                        "label": "Blalock, Bradley",
                        "description": "",
                        "id": "687134",
                        "group": "Milwaukee Brewers"
                    },
                    {
                        "label": "Bukauskas, J.B.",
                        "description": "",
                        "id": "656266",
                        "group": "Milwaukee Brewers"
                    },
                    {
                        "label": "Capra, Vinny",
                        "description": "",
                        "id": "681962",
                        "group": "Milwaukee Brewers"
                    },
                    {
                        "label": "Chourio, Jackson",
                        "description": "",
                        "id": "694192",
                        "group": "Milwaukee Brewers"
                    },
                    {
                        "label": "Clarke, Taylor",
                        "description": "",
                        "id": "664199",
                        "group": "Milwaukee Brewers"
                    },
                    {
                        "label": "Contreras, William",
                        "description": "",
                        "id": "661388",
                        "group": "Milwaukee Brewers"
                    },
                    {
                        "label": "Dunn, Oliver",
                        "description": "",
                        "id": "686554",
                        "group": "Milwaukee Brewers"
                    },
                    {
                        "label": "Frelick, Sal",
                        "description": "",
                        "id": "686217",
                        "group": "Milwaukee Brewers"
                    },
                    {
                        "label": "Haase, Eric",
                        "description": "",
                        "id": "606992",
                        "group": "Milwaukee Brewers"
                    },
                    {
                        "label": "Hall, DL",
                        "description": "",
                        "id": "669084",
                        "group": "Milwaukee Brewers"
                    },
                    {
                        "label": "Hoskins, Rhys",
                        "description": "",
                        "id": "656555",
                        "group": "Milwaukee Brewers"
                    },
                    {
                        "label": "Hudson, Bryan",
                        "description": "",
                        "id": "663542",
                        "group": "Milwaukee Brewers"
                    },
                    {
                        "label": "Jones, Jahmai",
                        "description": "",
                        "id": "663330",
                        "group": "Milwaukee Brewers"
                    },
                    {
                        "label": "Junk, Janson",
                        "description": "",
                        "id": "676083",
                        "group": "Milwaukee Brewers"
                    },
                    {
                        "label": "Megill, Trevor",
                        "description": "",
                        "id": "656730",
                        "group": "Milwaukee Brewers"
                    },
                    {
                        "label": "Miley, Wade",
                        "description": "",
                        "id": "489119",
                        "group": "Milwaukee Brewers"
                    },
                    {
                        "label": "Miller, Owen",
                        "description": "",
                        "id": "680911",
                        "group": "Milwaukee Brewers"
                    },
                    {
                        "label": "Milner, Hoby",
                        "description": "",
                        "id": "571948",
                        "group": "Milwaukee Brewers"
                    },
                    {
                        "label": "Mitchell, Garrett",
                        "description": "",
                        "id": "669003",
                        "group": "Milwaukee Brewers"
                    },
                    {
                        "label": "Monasterio, Andruw",
                        "description": "",
                        "id": "655316",
                        "group": "Milwaukee Brewers"
                    },
                    {
                        "label": "Ortiz, Joey",
                        "description": "",
                        "id": "687401",
                        "group": "Milwaukee Brewers"
                    },
                    {
                        "label": "Payamps, Joel",
                        "description": "",
                        "id": "606303",
                        "group": "Milwaukee Brewers"
                    },
                    {
                        "label": "Peguero, Elvis",
                        "description": "",
                        "id": "665625",
                        "group": "Milwaukee Brewers"
                    },
                    {
                        "label": "Peralta, Freddy",
                        "description": "",
                        "id": "642547",
                        "group": "Milwaukee Brewers"
                    },
                    {
                        "label": "Perkins, Blake",
                        "description": "",
                        "id": "663368",
                        "group": "Milwaukee Brewers"
                    },
                    {
                        "label": "Quero, Jeferson",
                        "description": "",
                        "id": "691620",
                        "group": "Milwaukee Brewers"
                    },
                    {
                        "label": "Rea, Colin",
                        "description": "",
                        "id": "607067",
                        "group": "Milwaukee Brewers"
                    },
                    {
                        "label": "Roller, Chris",
                        "description": "",
                        "id": "676896",
                        "group": "Milwaukee Brewers"
                    },
                    {
                        "label": "Ross, Joe",
                        "description": "",
                        "id": "605452",
                        "group": "Milwaukee Brewers"
                    },
                    {
                        "label": "Turang, Brice",
                        "description": "",
                        "id": "668930",
                        "group": "Milwaukee Brewers"
                    },
                    {
                        "label": "Uribe, Abner",
                        "description": "",
                        "id": "682842",
                        "group": "Milwaukee Brewers"
                    },
                    {
                        "label": "Vieira, Thyago",
                        "description": "",
                        "id": "600986",
                        "group": "Milwaukee Brewers"
                    },
                    {
                        "label": "Wiemer, Joey",
                        "description": "",
                        "id": "686894",
                        "group": "Milwaukee Brewers"
                    },
                    {
                        "label": "Williams, Devin",
                        "description": "",
                        "id": "642207",
                        "group": "Milwaukee Brewers"
                    },
                    {
                        "label": "Wilson, Bryse",
                        "description": "",
                        "id": "669060",
                        "group": "Milwaukee Brewers"
                    },
                    {
                        "label": "Yelich, Christian",
                        "description": "",
                        "id": "592885",
                        "group": "Milwaukee Brewers"
                    }
                ]
            },
            "game.teams": {
                "targets": [
                    {
                        "label": "Pittsburgh Pirates",
                        "description": "",
                        "id": "PIT",
                        "group": ""
                    },
                    {
                        "label": "Milwaukee Brewers",
                        "description": "",
                        "id": "MIL",
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
                    },
                    {
                        "label": "Strikeout",
                        "description": "",
                        "id": "K",
                        "group": ""
                    },
                    {
                        "label": "Inplay Out",
                        "description": "",
                        "id": "INPLAY-OUT",
                        "group": ""
                    },
                    {
                        "label": "Inplay Reach",
                        "description": "",
                        "id": "INPLAY-REACH",
                        "group": ""
                    },
                    {
                        "label": "Inplay Hit",
                        "description": "",
                        "id": "INPLAY-HIT",
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
                        "description": "Single",
                        "id": "X1",
                        "group": ""
                    },
                    {
                        "label": "X2",
                        "description": "Double",
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
                        "description": "In baseball, an \"at-bat\" outcome designated as an \"OUT\" refers to any situation where the batter's attempt to reach base is unsuccessful, resulting in the batter being retired. OUT will include any GO, FO, KS (strikeout swinging), or KL (strikeout looking)",
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
                        "description": "In baseball, an \"at-bat\" outcome designated as a \"HIT\" refers to any instance where a batter successfully hits the ball into fair territory and reaches at least first base safely without the benefit of an error or a fielder's choice by the opposing team. This outcome is critical for the offensive strategy and contributes directly to a team's ability to score runs.",
                        "id": "HIT",
                        "group": ""
                    },
                    {
                        "label": "HR",
                        "description": "In baseball, \"HR\" stands for Home Run, which is one of the most exciting plays in the game. A home run occurs when a batter hits the ball so it leaves the field of play, usually by clearing the outfield fence, and he is able to round all the bases and score without being put out by the opposing team. ",
                        "id": "HR",
                        "group": ""
                    },
                    {
                        "label": "HBP",
                        "description": "The situation denoted as \"at-bat HBP\" (Hit By Pitch) in baseball occurs when a batter is struck by a pitched ball without swinging at it, while he is in the batter's box during his turn at bat.",
                        "id": "HBP",
                        "group": ""
                    }
                ]
            }
        },
        "game": {
            "id": "0162ffb3-0e19-4306-9b8c-83d98827b016-20240129",
            "sport": "baseball",
            "datasource": "nvenue",
            "scope": "game"
        }
    }
}
```
