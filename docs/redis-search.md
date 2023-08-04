

ft.create index on json prefix 1 event: schema $.id as id tag $.timestamp as timestamp numeric sortable $.options.[basketball.team.scores.3fg] as team_scores_3fg tag $.options.[basketball.team] as team tag $.events as events tag


ft.create index on json prefix 1 event: schema $.id as id tag $.timestamp as timestamp numeric sortable '$.options["basketball.team.scores.3fg"]' as team_scores_3fg tag '$.options["basketball.team"]' as team tag $.events as events tag


ft.create index on json prefix 1 event: schema $.id as id tag $.timestamp as timestamp numeric sortable '$.options["basketball.team.scores.3fg"]' as team_scores_3fg tag '$.options["basketball.team"]' as team tag $.events as events tag '$.options["basketball.player"]' as player tag


ft.create index on json prefix 1 event: schema $.id as id tag $.timestamp as timestamp numeric sortable '$.options["basketball.player"]' as player tag $.events as events tag


ft.create index on json prefix 1 event: schema $.id as id tag $.timestamp as timestamp numeric sortable '$.options["basketball.player"]' as player tag $.events as events tag

ft.aggregate index '@events:{basketball\.player\.scores\.x3fg} @events:{basketball\.team\.scores\.3fg}' groupby 1 @player reduce count 0 as count filter "@player=='ebafb0d4-237e-4065-9545-0618428432e6'"

ft.search index '@events:{basketball\.player\.scores\.x3fg} @events:{basketball\.team\.scores\.3fg}'
