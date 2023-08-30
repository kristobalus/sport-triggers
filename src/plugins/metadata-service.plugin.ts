import { ConnectorsTypes } from '@microfleet/core'

import path = require('path')

import { FleetApp } from '../fleet-app'
import { MetadataService } from '../services/studio/metadata.service'
import { SportradarDatasource } from "../services/studio/datasources/sportradar.datasource"
import { NvenueDatasource } from "../services/studio/datasources/nvenue.datasource"

// import { NvenueDatasource } from "../services/studio/datasources/nvenue.datasource"

export function init(parent: FleetApp) {
  // eslint-disable-next-line require-await
  parent.addConnector(ConnectorsTypes.application, async () => {

    const sportradar = new SportradarDatasource()
    sportradar.loadGamesDir(path.resolve(__dirname, '../../games/sportradar/basketball'), 'basketball')

    const nvenue = new NvenueDatasource()
    nvenue.loadGames(
      path.resolve(__dirname, '../../games/nvenue/baseball/games.json'),
      path.resolve(__dirname, '../../games/nvenue/baseball/players.json'),
      path.resolve(__dirname, '../../games/nvenue/baseball/teams.json'),
      'baseball')

    const service = parent.metadataService = new MetadataService()
    service.addDatasource("sportradar", sportradar)
  })

  // eslint-disable-next-line require-await
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  parent.addDestructor(ConnectorsTypes.application, async () => {

  })
}

