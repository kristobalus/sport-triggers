import { ConnectorsTypes } from '@microfleet/core'

import { FleetApp } from '../fleet-app'
import { MetadataService } from "../services/studio/metadata.service"

import path = require('path')

export function init(parent: FleetApp) {
  // eslint-disable-next-line require-await
  parent.addConnector(ConnectorsTypes.application, async () => {
    parent.metadataService = new MetadataService()

    parent.metadataService
      .loadGames(path.resolve(__dirname, "../configs/studio/basketball/games"), "basketball")

    // parent.metadataService
      // .loadGames(path.resolve(__dirname, "../configs/studio/baseball/games"), "baseball")
  })

  // eslint-disable-next-line require-await
  parent.addDestructor(ConnectorsTypes.application, async () => {

  })
}

