import test from 'node:test';
import assert from 'node:assert/strict';
import { createAds } from '../web/ads.js';
test('web never touches native ad SDK',async()=>{
  const a=createAds({invoke:()=>{throw Error('must not run');}});
  await a.completeRound('r1');assert.equal(await a.betweenRounds('r1'),false);assert.equal((await a.state()).mode,'disabled');
});
test('completion is delivered before a single-flight between-round request',async()=>{
  const calls=[];let release;
  const a=createAds({native:true,invoke:async(method,data)=>{calls.push([method,data]);if(method==='beginBoundary')return {boundaryToken:'test'};if(method==='showBetweenRounds')return new Promise(r=>{release=r;});return {};}});
  a.completeRound('r1');const first=a.betweenRounds('r1');assert.equal(await a.betweenRounds('r1'),false);
  await new Promise(r=>setTimeout(r,0));assert.deepEqual(calls.map(x=>x[0]),['completeRound','beginBoundary','showBetweenRounds']);
  release({shown:true});assert.equal(await first,true);
});
test('no-fill, native errors and missing callbacks never break the next round',async()=>{
  for(const invoke of [async()=>({shown:false}),async()=>{throw Error('offline');},()=>new Promise(()=>{})]){
    const a=createAds({native:true,invoke,timeout:10});assert.equal(await a.betweenRounds('r1'),false);
  }
});
test('privacy and reset use native API without assuming successful consent',async()=>{
  const calls=[];const a=createAds({native:true,invoke:async(method,data)=>{calls.push([method,data]);return {};}});
  await a.age('unknown');await a.privacy();await a.reset();assert.deepEqual(calls.map(x=>x[0]),['setAge','privacyOptions','reset']);
});
test('empty Capacitor resolve data skips ads and preserves restart',async()=>{
  for(const value of [undefined,null,{},'invalid']){
    const a=createAds({native:true,invoke:async()=>value});
    assert.equal(await a.betweenRounds('restored-old-round'),false);
    assert.equal((await a.state()).mode,'disabled');
  }
});
