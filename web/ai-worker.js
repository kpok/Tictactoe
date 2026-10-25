import { chooseMove } from './ai.js';
self.onmessage = ({ data }) => {
  try { self.postMessage({ id: data.id, index: chooseMove(data.game, data.difficulty) }); }
  catch { self.postMessage({ id: data.id, error: true }); }
};
