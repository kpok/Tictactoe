import test from 'node:test';
import http from 'node:http';
import assert from 'node:assert/strict';
import { createApp } from '../server/app.js';

async function setup(t, options={}) {
  const server=createApp(options);await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  t.after(()=>new Promise(resolve=>server.close(resolve)));
  const base=`http://127.0.0.1:${server.address().port}`;
  const call=async(url,{method='GET',token,body,headers={}}={})=>{
    const response=await fetch(base+url,{method,headers:{...(body!==undefined?{'Content-Type':'application/json'}:{}),...(token?{Authorization:`Bearer ${token}`} : {}),...headers},body:body===undefined?undefined:JSON.stringify(body)});
    let data;try{data=await response.json();}catch{data=null;}return {status:response.status,data,response};
  };
  const create=async()=>{const result=await call('/api/rooms',{method:'POST',body:{}});assert.equal(result.status,201);return result.data;};
  const join=async(code)=>{const result=await call(`/api/rooms/${code}/join`,{method:'POST',body:{}});assert.equal(result.status,200);return result.data;};
  return {base,call,create,join};
}
const mutation=(call,code,token,action,body)=>call(`/api/rooms/${code}/${action}`,{method:'POST',token,body});

test('two clients play authoritative game and mutually agree to rematch', async t=>{
  const {call,create,join}=await setup(t);const a=await create(),b=await join(a.code);
  assert.notEqual(a.token,b.token);assert.equal(a.seat,'O');assert.equal(b.seat,'X');assert.equal(b.room.joined,true);
  let room=b.room;
  for(const [n,index] of [0,3,1,4,2].entries()) {
    const response=await mutation(call,a.code,n%2?b.token:a.token,'moves',{index,revision:room.revision,requestId:`move-${n}-request`});
    assert.equal(response.status,200);room=response.data;
  }
  assert.equal(room.game.winner,'O');assert.equal(JSON.stringify(room).includes(a.token),false);
  const first=await mutation(call,a.code,a.token,'rematch',{revision:room.revision,requestId:'rematch-a-1'});
  assert.equal(first.status,200);assert.equal(first.data.game.winner,'O');assert(first.data.rematch.O);
  const second=await mutation(call,a.code,b.token,'rematch',{revision:first.data.revision,requestId:'rematch-b-1'});
  assert.equal(second.status,200);assert.equal(second.data.game.moves,0);assert.equal(second.data.game.turn,'X');
  const reconnect=await call(`/api/rooms/${a.code}`,{token:a.token});assert.deepEqual(reconnect.data,second.data);
});
test('auth, third seat, turn, invalid and stale moves are rejected',async t=>{
  const {call,create,join}=await setup(t);const a=await create();
  const waiting=await mutation(call,a.code,a.token,'moves',{index:0,revision:0,requestId:'waiting-1'});assert.equal(waiting.status,409);
  const b=await join(a.code);
  assert.equal((await call(`/api/rooms/${a.code}`)).status,401);
  assert.equal((await call(`/api/rooms/${a.code}`,{token:'0'.repeat(64)})).status,401);
  assert.equal((await call(`/api/rooms/${a.code}/join`,{method:'POST',body:{}})).status,409);
  const move={index:0,revision:b.room.revision,requestId:'move-first'};
  assert.equal((await mutation(call,a.code,b.token,'moves',move)).data.error,'not_your_turn');
  assert.equal((await mutation(call,a.code,a.token,'moves',{...move,index:9})).status,400);
  const result=await mutation(call,a.code,a.token,'moves',move);assert.equal(result.status,200);
  assert.equal((await mutation(call,a.code,b.token,'moves',{index:1,revision:1,requestId:'move-stale'})).data.error,'stale_revision');
  assert.equal((await mutation(call,a.code,b.token,'moves',{index:0,revision:result.data.revision,requestId:'move-occupied'})).data.error,'illegal_move');
  assert.equal((await mutation(call,a.code,b.token,'rematch',{revision:result.data.revision,requestId:'rematch-early'})).data.error,'game_not_finished');
});
test('lost-response retries and concurrent moves apply only once',async t=>{
  const {call,create,join}=await setup(t);const a=await create(),b=await join(a.code);
  const body={index:0,revision:b.room.revision,requestId:'stable-request-1'};
  const responses=await Promise.all([mutation(call,a.code,a.token,'moves',body),mutation(call,a.code,a.token,'moves',body)]);
  assert(responses.every(x=>x.status===200));assert(responses.every(x=>x.data.game.moves===1));
  assert.equal((await mutation(call,a.code,a.token,'moves',{...body,index:1})).data.error,'request_id_reused');
  const attempts=await Promise.all([1,2].map(index=>mutation(call,a.code,b.token,'moves',{index,revision:2,requestId:`concurrent-${index}`})));
  assert.deepEqual(attempts.map(x=>x.status).sort(),[200,409]);
  assert.equal((await call(`/api/rooms/${a.code}`,{token:a.token})).data.game.moves,2);
});
test('server uses FIFO and checks victory after removing old mark',async t=>{
  const {call,create,join}=await setup(t);const a=await create(),b=await join(a.code);let room=b.room;
  for(const [n,index] of [0,3,1,4,8,6,2].entries()) {
    const result=await mutation(call,a.code,n%2?b.token:a.token,'moves',{index,revision:room.revision,requestId:`fifo-request-${n}`});
    assert.equal(result.status,200);room=result.data;
  }
  assert.equal(room.game.winner,null);assert.equal(room.game.board[0],null);assert.deepEqual(room.game.queues.O,[1,8,2]);
});
test('expiry and capacity limits release memory',async t=>{
  let time=0;const {call,create}=await setup(t,{now:()=>time,roomTtlMs:100,maxRooms:1});const a=await create();
  assert.equal((await call('/api/rooms',{method:'POST',body:{}})).status,503);
  time=101;assert.equal((await call(`/api/rooms/${a.code}`,{token:a.token})).status,404);await create();
});
test('JSON, body, origin and rate limits protect API',async t=>{
  const {base,call}=await setup(t,{rateLimit:8});
  assert.equal((await fetch(base+'/api/rooms',{method:'POST',body:'{}'})).status,415);
  assert.equal((await call('/api/rooms',{method:'POST',body:{},headers:{Origin:'https://evil.example'}})).status,403);
  assert.equal((await fetch(base+'/api/rooms',{method:'POST',headers:{'Content-Type':'application/json'},body:'{'})).status,400);
  assert.equal((await call('/api/rooms',{method:'POST',body:{large:'x'.repeat(3000)}})).status,413);
  for(let i=0;i<4;i++) await call('/api/nothing');
  const limited=await call('/api/nothing');assert.equal(limited.status,429);assert(limited.response.headers.get('retry-after'));
});
test('static assets have security headers and private files are never served',async t=>{
  const {base,call}=await setup(t);
  const script=await fetch(base+'/engine.js');assert.equal(script.status,200);assert.match(script.headers.get('content-type'),/javascript/);
  assert.match(script.headers.get('content-security-policy'),/frame-ancestors 'none'/);
  assert.equal((await fetch(base+'/package.json')).status,404);
  assert.equal((await fetch(base+'/.env')).status,404);
  assert.equal((await fetch(base+'/%2e%2e%2fpackage.json')).status,404);
  assert.equal((await call('/health')).data.ok,true);
});

test('chunked requests cannot bypass body size limits',async t=>{
  const {base}=await setup(t);
  const status=await new Promise((resolve,reject)=>{
    const req=http.request(base+'/api/rooms',{method:'POST',headers:{'Content-Type':'application/json','Transfer-Encoding':'chunked'}},res=>{res.resume();resolve(res.statusCode);});
    req.on('error',reject);req.write('{"value":"');req.write('x'.repeat(3000));req.end('"}');
  });
  assert.equal(status,413);
});
