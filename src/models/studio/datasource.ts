import { Game } from "./game"

export interface Datasource {
  getGame(gameId: string): Game
}
