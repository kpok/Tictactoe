import test from 'node:test';
import assert from 'node:assert/strict';
import { newGame, play, legalMoves, positionKey, validGame } from '../web/engine.js';
import { chooseMove } from '../web/ai.js';
const sequence = moves => moves.reduce(play,newGame());
test('all eight lines win for both players', () => {
  for (const p of ['O','X']) for (const line of [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]]) {
    const g = newGame(p); g.queues[p] = line.slice(0,2); g.queues[p].forEach(i => g.board[i] = p);
    const end = play(g,line[2]); assert.equal(end.winner,p); assert.deepEqual(end.line,line);
  }
});
test('FIFO removes oldest by age, keeps source immutable and never leaves four marks', () => {
  const g = sequence([4,0,8,1,3,6]);
  const next = play(g,5); assert.equal(next.board[4],null); assert.deepEqual(next.queues.O,[8,3,5]);
  assert.equal(g.board[4],'O'); assert.equal(next.board.filter(x=>x==='O').length,3);
});
test('regression: temporary four-mark line is not a win', () => {
  const g = sequence([0,3,1,4,8,6]);
  const next = play(g,2); assert.equal(next.winner,null); assert.equal(next.board[0],null);
});
test('invalid, occupied and post-game moves are rejected without mutation', () => {
  const g = sequence([0,3,1,4,2]); assert.equal(g.winner,'O');
  for (const index of [5,-1,9,NaN,1.2,'2']) assert.throws(()=>play(g,index));
  const start=play(newGame(),4); assert.throws(()=>play(start,4)); assert.equal(start.moves,1);
});
test('threefold uses ordered queues and the player on turn', () => {
  const g=sequence([0,1,5,3,7,8]); const next=play(g,2);
  g.history[positionKey(next)]=2;
  assert.equal(play(g,2).draw,'repetition');
  const reordered=structuredClone(g); reordered.queues.O.reverse(); assert.notEqual(positionKey(g),positionKey(reordered));
});
test('move limit draws, but a winning move takes priority', () => {
  const g=newGame();g.moves=99;assert.equal(play(g,0).draw,'limit');
  const near=sequence([0,3,1,4]);near.moves=99;assert.equal(play(near,2).winner,'O');
});
test('persisted data is structurally validated', () => {
  assert(validGame(newGame())); assert(validGame(sequence([4,0,8,1,3,6,5])));
  for(const bad of [null,{}, { ...newGame(),board:[] }, {...newGame(),queues:{O:[9],X:[]}}]) assert.equal(validGame(bad),false);
});
test('AI wins, prevents immediate loss and respects FIFO', () => {
  for(const difficulty of ['medium','hard']) {
    const win=sequence([0,3,1,4]); assert.equal(chooseMove(win,difficulty),2);
    const block=sequence([0,4,1]); assert.equal(chooseMove(block,difficulty),2);
    const g=sequence([0,3,1,4,8,6]); const i=chooseMove(g,difficulty);assert(legalMoves(g).includes(i));
  }
  assert.equal(chooseMove(newGame(),'easy',()=>0),0);
  assert.equal(chooseMove(sequence([0,3,1,4,2])) ,null);
});
test('random games preserve invariants and terminate within 100 plies', () => {
  for(let run=0;run<100;run++) {let g=newGame();while(!g.winner&&!g.draw){const moves=legalMoves(g);g=play(g,moves[Math.floor(Math.random()*moves.length)]);assert(validGame(g));}assert(g.moves<=100);}
});
test('real legal cycle ends in a threefold draw without filling the board',()=>{
  const cycle=[0,1,2,3,8,7,6,5];
  const game=sequence([...cycle,...cycle,...cycle.slice(0,6)]);
  assert.equal(game.draw,'repetition');assert.equal(game.moves,22);assert.equal(game.winner,null);
  assert.throws(()=>play(game,4));
});
