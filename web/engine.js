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
        (game.winner && game.draw) || !Array.isArray(game.line) || !game.line.every(Number.isInteger) || !game.history || typeof game.history !== 'object' || Array.isArray(game.history)) return false;
    // A stored board must agree with alternating turns and the three-mark FIFO cap.
    if (game.turn !== (game.moves % 2 === 0 ? game.starter : other(game.starter))) return false;
    const all = [];
    for (const p of ['O','X']) {
      const queue = game.queues[p];
      const turns = p === game.starter ? Math.ceil(game.moves / 2) : Math.floor(game.moves / 2);
      if (!Array.isArray(queue) || queue.length !== Math.min(3, turns)) return false;
      for (const i of queue) { if (!Number.isInteger(i) || i < 0 || i > 8 || game.board[i] !== p) return false; all.push(i); }
    }
    if (new Set(all).size !== all.length || !game.board.every((cell,i) => cell === null || (['O','X'].includes(cell) && all.includes(i)))) return false;
    const currentKey = positionKey(game), entries = Object.entries(game.history);
    if (entries.length > 101 || !entries.every(([key,n]) => {
      if (!/^[OX]\|(?:[0-8](?:,[0-8]){0,2})?\|(?:[0-8](?:,[0-8]){0,2})?$/.test(key) || !Number.isInteger(n) || n < 1 || n > 3) return false;
      const [,o,x] = key.split('|'), marks = [o,x].flatMap(queue => queue ? queue.split(',') : []);
      return new Set(marks).size === marks.length && (n < 3 || key === currentKey);
    })) return false;
    const repetitions = game.history[currentKey];
    if (!Number.isInteger(repetitions) || entries.reduce((total,[,n]) => total+n,0) !== game.moves+1) return false;
    const winning = p => LINES.some(line => line.every(i => game.board[i] === p));
    if (game.winner) {
      return game.winner === other(game.turn) && !winning(game.turn) &&
        LINES.some(line => line.every(i => game.board[i] === game.winner) && line.join() === game.line.join());
    }
    if (winning('O') || winning('X') || game.line.length !== 0) return false;
    if (game.draw === 'repetition') return repetitions === 3;
    if (game.draw === 'limit') return game.moves === 100 && repetitions < 3;
    return game.moves < 100 && repetitions < 3;
  } catch { return false; }
}
