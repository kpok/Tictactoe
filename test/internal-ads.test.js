import test from 'node:test';
import assert from 'node:assert/strict';
import { internalAds } from '../scripts/internal-ads.js';
test('internal builds always use test units with disabled child and debug advertising',()=>{
  const sample=internalAds({});
  assert.equal(sample.mode,'test');assert.equal(sample.familiesReviewed,false);assert.equal(sample.debugMode,'disabled');
  assert.equal(sample.unitId,'ca-app-pub-3940256099942544/1033173712');
  const configured=internalAds({ADMOB_APP_ID:'ca-app-pub-1234567890123456~1234567890',ADS_PRIVACY_URL:'https://example.com/privacy',ADS_MODE:'live'});
  assert.equal(configured.mode,'test');assert.equal(configured.unitId,sample.unitId);
  assert.equal(configured.appId,'ca-app-pub-1234567890123456~1234567890');
});
test('invalid public ad configuration fails before Gradle execution',()=>{
  for(const appId of ['invalid','ca-app-pub-1234567890123456/1234567890','$(touch file)','ca-app-pub-1234567890123456~1234567890\n'])assert.throws(()=>internalAds({ADMOB_APP_ID:appId}));
  for(const url of ['http://example.com','https://user:password@example.com','https://example.com/\n','https://example.com/"','https://example.com/\\x','bad'])assert.throws(()=>internalAds({ADS_PRIVACY_URL:url}));
});
