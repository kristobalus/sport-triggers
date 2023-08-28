import { ConnectorsTypes } from '@microfleet/core'

import path = require('path')

import { FleetApp } from '../fleet-app'
import { MetadataService } from '../services/studio/metadata.service'

export function init(parent: FleetApp) {
  // eslint-disable-next-line require-await
  parent.addConnector(ConnectorsTypes.application, async () => {
    parent.metadataService = new MetadataService()
    parent.metadataService
      .loadSportradarGames(path.resolve(__dirname, '../../games/basketball'), 'basketball')
    // parent.metadataService
      // .loadGames(path.resolve(__dirname, "../studio/baseball/games"), "baseball")
  })

  // eslint-disable-next-line require-await
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  parent.addDestructor(ConnectorsTypes.application, async () => {

  })
}

