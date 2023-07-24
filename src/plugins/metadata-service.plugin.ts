import { ConnectorsTypes } from '@microfleet/core'

import { FleetApp } from '../fleet-app'
import { MetadataService } from "../services/studio/metadata.service"

import path = require('path')

export function init(parent: FleetApp) {
  // eslint-disable-next-line require-await
  parent.addConnector(ConnectorsTypes.application, async () => {
    parent.metadataService = new MetadataService()
    const dir = path.resolve(__dirname, "../configs/studio/basketball/games")
    parent.metadataService.loadGames(dir)
  })

  // eslint-disable-next-line require-await
  parent.addDestructor(ConnectorsTypes.application, async () => {

  })
}

