import test from 'node:test';
import assert from 'node:assert/strict';
import { versionCode } from '../scripts/android-version.js';
import { checkInstrumentation } from '../scripts/check-android-e2e.js';
test('Android versionCode rejects unsafe, reused-placeholder and non-integer forms',()=>{
  for(const value of ['0','-1','1.5','01','1e3','2100000001','1\n','1;echo bad',''])assert.throws(()=>versionCode(value));
  assert.equal(versionCode('2100000000'),2100000000);assert.equal(versionCode('42'),42);
});
test('instrumentation gate rejects adb-success with failed or incomplete tests',()=>{
  const ok='OK (5 tests)\nINSTRUMENTATION_CODE: -1\n';
  assert.doesNotThrow(()=>checkInstrumentation(ok));
  for(const text of ['', 'OK (0 tests)\nINSTRUMENTATION_CODE: -1','OK (4 tests)\nINSTRUMENTATION_CODE: -1','OK (5 tests)',ok+'FAILURES!!!',ok+'INSTRUMENTATION_FAILED',ok+'INSTRUMENTATION_STATUS_CODE: -3',ok+ok])assert.throws(()=>checkInstrumentation(text));
});
