import { ConnectorsTypes } from '@microfleet/core'

import { FleetApp } from '../fleet-app'
import { MetadataService } from '../services/studio/metadata.service'
import { SportradarDatasource } from '../datasources/sportradar.datasource'
import { NvenueDatasource } from '../datasources/nvenue.datasource'
import { Sport } from '../models/events/sport'
import path = require('path')

export function init(parent: FleetApp) {
  // eslint-disable-next-line require-await
  parent.addConnector(ConnectorsTypes.application, async () => {
    const sportradar = new SportradarDatasource()

    sportradar.loadGamesDir(path.resolve(__dirname, '../../games/sportradar/basketball'), Sport.Basketball)

    const nvenue = new NvenueDatasource()

    nvenue.loadGames(
      path.resolve(__dirname, '../../games/nvenue/baseball/games'),
      path.resolve(__dirname, '../../games/mlb/teams.json'),
      path.resolve(__dirname, '../../games/mlb/players.json'),
      Sport.Baseball)

    const service = parent.metadataService = new MetadataService()

    service.addDatasource('sportradar', sportradar)
    service.addDatasource('nvenue', nvenue)
  })

  // eslint-disable-next-line require-await
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  parent.addDestructor(ConnectorsTypes.application, async () => {

  })
}

