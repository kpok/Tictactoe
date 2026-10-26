import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
export function checkInstrumentation(output,expected=5){
  if(/FAILURES!!!|INSTRUMENTATION_FAILED|INSTRUMENTATION_ABORTED|Process crashed|shortMsg=|INSTRUMENTATION_STATUS_CODE:\s*-[1-9]/i.test(output))throw new Error('Android instrumentation reported a failure, skipped test or crash');
  const matches=[...output.matchAll(/OK \((\d+) tests?\)/g)];
  if(matches.length!==1||Number(matches[0][1])!==expected||!/^INSTRUMENTATION_CODE:\s*-1\s*$/m.test(output))throw new Error(`Android instrumentation must complete exactly ${expected} tests successfully`);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  checkInstrumentation(readFileSync('android-e2e-results/instrumentation.txt','utf8'));
  console.log('Android E2E: 5/5 instrumented tests passed.');
}
