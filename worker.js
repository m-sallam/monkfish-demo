import { Game } from 'monkfish'

self.addEventListener('message', (evt) => {
  const { fen, depth } = evt.data
  const game = new Game(fen)
  self.postMessage({ move: game.bestMove(Number(depth)) })
});