import http from 'node:http';
import { randomBytes, randomInt, timingSafeEqual } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { newGame, other, play } from '../web/engine.js';

const WEB_ROOT = fileURLToPath(new URL('../web/', import.meta.url));
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const MIME = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.svg':'image/svg+xml', '.png':'image/png', '.webmanifest':'application/manifest+json', '.json':'application/json' };
const CSP = "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; worker-src 'self'; manifest-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'";
class HttpError extends Error { constructor(status, code) { super(code); this.status=status; } }
const fail=(status,code)=>{throw new HttpError(status,code);};
const secureEquals=(a,b)=>typeof a==='string' && a.length===b.length && timingSafeEqual(Buffer.from(a),Buffer.from(b));
const token=()=>randomBytes(32).toString('hex');
function code() { return Array.from({length:6},()=>ALPHABET[randomInt(ALPHABET.length)]).join(''); }
function snapshot(room) {
  return { code:room.code, game:room.game, revision:room.revision, joined:!!room.tokens.X,
    rematch:{...room.rematch} };
}
function send(res,status,data) {
  res.writeHead(status, {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});
  res.end(JSON.stringify(data));
}
async function jsonBody(req) {
  if (!/^application\/json(?:\s*;.*)?$/i.test(req.headers['content-type'] || '')) fail(415,'json_required');
  const declared=Number(req.headers['content-length']);
  if (declared>2048) { req.resume(); fail(413,'body_too_large'); }
  const body=await new Promise((resolve,reject)=>{
    let text='',size=0,settled=false;
    req.on('data',chunk=>{
      size+=chunk.length;
      if(size>2048) {
        if(!settled) {settled=true;reject(new HttpError(413,'body_too_large'));}
        return;
      }
      if(!settled) text+=chunk.toString('utf8');
    });
    req.on('end',()=>{if(!settled){settled=true;resolve(text);}});
    req.on('error',()=>{if(!settled){settled=true;reject(new HttpError(400,'invalid_body'));}});
    req.on('aborted',()=>{if(!settled){settled=true;reject(new HttpError(400,'invalid_body'));}});
  });
  try { const value=JSON.parse(body); if (!value || Array.isArray(value) || typeof value!=='object') fail(400,'invalid_body'); return value; }
  catch (error) { if (error instanceof HttpError) throw error; fail(400,'invalid_json'); }
}

/** Single-process authoritative room service. All mutations run synchronously after body parsing. */
export function createApp({ roomTtlMs=30*60*1000, maxRooms=1000, now=Date.now,
  rateLimit=180, rateWindowMs=60_000, webRoot=WEB_ROOT }={}) {
  const rooms=new Map(), buckets=new Map();
  const expire=()=>{
    const time=now();
    for(const [key,room] of rooms) if(time-room.updatedAt>=roomTtlMs || time-room.createdAt>=24*60*60*1000) rooms.delete(key);
    for(const [key,bucket] of buckets) if(time>=bucket.until) buckets.delete(key);
  };
  const timer=setInterval(expire,Math.min(roomTtlMs,60_000)); timer.unref();
  const server=http.createServer({ requestTimeout:15_000, headersTimeout:10_000, maxHeaderSize:8192 }, async(req,res)=>{
    res.setHeader('X-Content-Type-Options','nosniff');
    res.setHeader('Referrer-Policy','no-referrer');
    res.setHeader('Content-Security-Policy',CSP);
    res.setHeader('X-Frame-Options','DENY');
    try {
      const url=new URL(req.url,'http://localhost');
      if(url.pathname==='/health' && req.method==='GET') return send(res,200,{ok:true});
      if(!url.pathname.startsWith('/api/')) {
        if(req.method!=='GET' && req.method!=='HEAD') fail(405,'method_not_allowed');
        let relative;
        try { relative=decodeURIComponent(url.pathname); } catch { fail(400,'invalid_path'); }
        if(relative==='/' || relative==='/index.html') relative='/index.html';
        // Only public web assets are served; secrets, source reports and dotfiles are inaccessible.
        if(relative.includes('\\') || relative.split('/').some(part=>part.startsWith('.') || part==='..') || !MIME[path.extname(relative)]) fail(404,'not_found');
        const filename=path.resolve(webRoot,`.${relative}`);
        if(!filename.startsWith(path.resolve(webRoot)+path.sep)) fail(404,'not_found');
        let data;try {data=await readFile(filename);} catch {fail(404,'not_found');}
        res.writeHead(200,{'Content-Type':MIME[path.extname(filename)], 'Cache-Control':'no-cache'});
        return res.end(req.method==='HEAD'?undefined:data);
      }
      expire();
      const ip=req.socket.remoteAddress || 'unknown';
      let bucket=buckets.get(ip);
      if(!bucket) {
        if(buckets.size>=5000) fail(503,'busy');
        bucket={count:0,until:now()+rateWindowMs}; buckets.set(ip,bucket);
      }
      if(++bucket.count>rateLimit) {res.setHeader('Retry-After',Math.max(1,Math.ceil((bucket.until-now())/1000)));fail(429,'rate_limited');}
      if(req.headers.origin) {
        let origin; try {origin=new URL(req.headers.origin);} catch {fail(403,'origin_forbidden');}
        if(!['http:','https:'].includes(origin.protocol) || origin.host!==req.headers.host) fail(403,'origin_forbidden');
      }
      if(req.method==='POST') {
        if(req.headers['sec-fetch-site']==='cross-site') fail(403,'origin_forbidden');
      }
      if(url.pathname==='/api/rooms' && req.method==='POST') {
        const body=await jsonBody(req);if(Object.keys(body).length) fail(400,'invalid_body');
        if(rooms.size>=maxRooms) fail(503,'rooms_full');
        let roomCode;do {roomCode=code();}while(rooms.has(roomCode));
        const room={code:roomCode,tokens:{O:token(),X:null},game:newGame(),revision:0,
          rematch:{O:false,X:false},receipts:new Map(),createdAt:now(),updatedAt:now()};
        rooms.set(roomCode,room);
        return send(res,201,{code:roomCode,token:room.tokens.O,seat:'O',room:snapshot(room)});
      }
      const match=url.pathname.match(/^\/api\/rooms\/([A-Z2-9]{6})(?:\/(join|moves|rematch))?$/);
      if(!match) fail(404,'not_found');
      const [,roomCode,action]=match;
      let body;
      if(req.method==='POST') body=await jsonBody(req);
      // Recheck expiry after reading a potentially delayed body.
      expire();
      const room=rooms.get(roomCode);if(!room) fail(404,'room_not_found');
      if(action==='join' && req.method==='POST') {
        if(Object.keys(body).length) fail(400,'invalid_body');
        if(room.tokens.X) fail(409,'room_full');
        room.tokens.X=token();room.updatedAt=now();room.revision++;
        return send(res,200,{code:roomCode,token:room.tokens.X,seat:'X',room:snapshot(room)});
      }
      const bearer=req.headers.authorization?.match(/^Bearer ([a-f0-9]{64})$/)?.[1];
      const seat=secureEquals(bearer,room.tokens.O)?'O':room.tokens.X&&secureEquals(bearer,room.tokens.X)?'X':null;
      if(!seat) fail(401,'unauthorized');
      if(!action && req.method==='GET') {room.updatedAt=now();return send(res,200,snapshot(room));}
      if(req.method!=='POST' || !['moves','rematch'].includes(action)) fail(405,'method_not_allowed');
      const allowed=action==='moves'?['index','revision','requestId']:['revision','requestId'];
      if(Object.keys(body).some(key=>!allowed.includes(key)) || !Number.isSafeInteger(body.revision) || body.revision<0 ||
        typeof body.requestId!=='string' || !/^[a-zA-Z0-9_-]{8,80}$/.test(body.requestId)) fail(400,'invalid_body');
      const requestKey=`${seat}:${body.requestId}`;
      const fingerprint=JSON.stringify([action,body.index,body.revision]);
      if(room.receipts.has(requestKey)) {
        if(room.receipts.get(requestKey)!==fingerprint) fail(409,'request_id_reused');
        room.updatedAt=now();return send(res,200,snapshot(room));
      }
      if(room.revision!==body.revision) fail(409,'stale_revision');
      if(!room.tokens.X) fail(409,'waiting_for_opponent');
      if(action==='moves') {
        if(room.game.turn!==seat) fail(409,'not_your_turn');
        if(!Number.isInteger(body.index) || body.index<0 || body.index>8) fail(400,'invalid_index');
        try {room.game=play(room.game,body.index);} catch {fail(409,'illegal_move');}
      } else {
        if(!room.game.winner && !room.game.draw) fail(409,'game_not_finished');
        if(room.rematch[seat]) fail(409,'already_requested');
        room.rematch[seat]=true;
        if(room.rematch.O && room.rematch.X) {
          room.game=newGame(other(room.game.starter));room.rematch={O:false,X:false};
        }
      }
      room.receipts.set(requestKey,fingerprint);
      // Bounded replay window; very old retries still fail revision checks.
      if(room.receipts.size>256) room.receipts.delete(room.receipts.keys().next().value);
      room.revision++;room.updatedAt=now();
      return send(res,200,snapshot(room));
    } catch(error) {
      if(res.headersSent) return res.end();
      send(res,error instanceof HttpError?error.status:500,{error:error instanceof HttpError?error.message:'internal_error'});
    }
  });
  server.on('close',()=>{clearInterval(timer);rooms.clear();buckets.clear();});
  return server;
}
