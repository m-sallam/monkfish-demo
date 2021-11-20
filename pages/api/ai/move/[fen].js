import { Game } from 'monkfish'

export default function handler(req, res) {
  const {
    query: { fen },
    method,
  } = req

  switch (method) {
    case 'GET':
      // Get data from your database
      const game = new Game(fen)
      const depth = game.state().moveCount > 20 ? 5 : 4
      res.status(200).json({ move: game.bestMove(depth) })
      break
    default:
      res.setHeader('Allow', ['GET'])
      res.status(405).end(`Method ${method} Not Allowed`)
  }
}
