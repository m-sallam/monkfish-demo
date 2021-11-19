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
      res.status(200).json({ move: game.bestMove(5) })
      break
    default:
      res.setHeader('Allow', ['GET'])
      res.status(405).end(`Method ${method} Not Allowed`)
  }
}
