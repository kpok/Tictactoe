import { LINES, legalMoves, other, play } from './engine.js';
function evaluate(game, player) {
  let score = 0;
  for (const line of LINES) {
    const ours = line.filter(i => game.board[i] === player).length;
    const theirs = line.filter(i => game.board[i] === other(player)).length;
    if (!theirs) score += [0,1,8,90][ours];
    if (!ours) score -= [0,1,9,90][theirs];
  }
  return score + (game.board[4] === player ? 2 : 0) - (game.board[4] === other(player) ? 2 : 0);
}
/** Bounded minimax includes ordered queues and repetition history through play(). */
export function chooseMove(game, difficulty = 'medium', random = Math.random) {
  const moves = legalMoves(game);
  if (!moves.length) return null;
  if (difficulty === 'easy') return moves[Math.min(moves.length - 1, Math.floor(random() * moves.length))];
  const player = game.turn;
  const depth = difficulty === 'hard' ? 9 : 4;
  const budget = difficulty === 'hard' ? 26000 : 2200;
  let nodes = 0;
  function search(state, remaining, alpha, beta) {
    nodes++;
    if (state.winner) return state.winner === player ? 10000 + remaining : -10000 - remaining;
    if (state.draw) return 0;
    if (remaining === 0 || nodes >= budget) return evaluate(state, player);
    const maximize = state.turn === player;
    let best = maximize ? -Infinity : Infinity;
    for (const i of legalMoves(state).sort((a,b) => (a === 4 ? -1 : b === 4 ? 1 : a-b))) {
      const score = search(play(state,i), remaining-1, alpha,beta);
      best = maximize ? Math.max(best,score) : Math.min(best,score);
      if (maximize) alpha = Math.max(alpha,best); else beta = Math.min(beta,best);
      if (beta <= alpha || nodes >= budget) break;
    }
    return best;
  }
  const ranked = moves.map(i => ({ i, next: play(game,i) }));
  const win = ranked.find(x => x.next.winner === player);
  if (win) return win.i;
  // Immediate safety is checked for every candidate, even if the deeper budget expires.
  const safe = ranked.filter(x => !legalMoves(x.next).some(i => play(x.next,i).winner === other(player)));
  const candidates = safe.length ? safe : ranked;
  let bestMove = candidates[0].i, bestScore = -Infinity;
  for (const candidate of candidates) {
    // Give each root candidate an equal search budget.
    nodes = 0;
    const score = search(candidate.next,depth-1,-Infinity,Infinity);
    if (score > bestScore) { bestScore = score; bestMove = candidate.i; }
  }
  return bestMove;
}
