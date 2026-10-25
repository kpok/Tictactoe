/** Shared, deterministic rules. No DOM, network or random side effects. */
export const LINES = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
export const other = player => player === 'O' ? 'X' : 'O';
export const positionKey = game => `${game.turn}|${game.queues.O.join(',')}|${game.queues.X.join(',')}`;
export function newGame(starter = 'O') {
  const game = { board: Array(9).fill(null), queues: { O: [], X: [] }, turn: starter,
    starter, moves: 0, winner: null, line: [], draw: null, history: {} };
  game.history[positionKey(game)] = 1;
  return game;
}
export function legalMoves(game) {
  return game.winner || game.draw ? [] : game.board.flatMap((cell, i) => cell === null ? [i] : []);
}
export function play(game, index) {
  if (!Number.isInteger(index) || index < 0 || index > 8 || game.board[index] !== null || game.winner || game.draw) {
    throw new Error('Illegal move');
  }
  const next = { ...game, board: [...game.board], queues: { O: [...game.queues.O], X: [...game.queues.X] },
    history: { ...game.history }, line: [] };
  const player = next.turn;
  if (next.queues[player].length === 3) next.board[next.queues[player].shift()] = null;
  next.board[index] = player;
  next.queues[player].push(index);
  next.moves++;
  next.line = LINES.find(line => line.every(i => next.board[i] === player)) || [];
  if (next.line.length) next.winner = player;
  next.turn = other(player);
  const key = positionKey(next);
  next.history[key] = (next.history[key] || 0) + 1;
  if (!next.winner && next.history[key] >= 3) next.draw = 'repetition';
  if (!next.winner && !next.draw && next.moves >= 100) next.draw = 'limit';
  return next;
}
/** Validate persisted client data instead of trusting localStorage. */
export function validGame(game) {
  try {
    if (!game || !Array.isArray(game.board) || game.board.length !== 9 || !['O','X'].includes(game.turn) ||
        !['O','X'].includes(game.starter) || !Number.isInteger(game.moves) || game.moves < 0 || game.moves > 100 ||
        ![null,'O','X'].includes(game.winner) || ![null,'repetition','limit'].includes(game.draw) ||
        (game.winner && game.draw) || !Array.isArray(game.line) || !game.history || typeof game.history !== 'object') return false;
    const all = [];
    for (const p of ['O','X']) {
      const queue = game.queues[p];
      if (!Array.isArray(queue) || queue.length > 3) return false;
      for (const i of queue) { if (!Number.isInteger(i) || i < 0 || i > 8 || game.board[i] !== p) return false; all.push(i); }
    }
    if (new Set(all).size !== all.length || !game.board.every((cell,i) => cell === null || (['O','X'].includes(cell) && all.includes(i)))) return false;
    if (Object.keys(game.history).length > 101 || !Object.entries(game.history).every(([key,n]) => /^[OX]\|[0-8,]*\|[0-8,]*$/.test(key) && Number.isInteger(n) && n > 0 && n <= 3)) return false;
    return game.line.every(i => Number.isInteger(i) && i >= 0 && i < 9) &&
      (game.winner ? LINES.some(line => line.every(i => game.board[i] === game.winner) && line.join() === game.line.join()) : game.line.length === 0);
  } catch { return false; }
}
