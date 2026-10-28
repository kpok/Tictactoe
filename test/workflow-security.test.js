import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { checkPolicy, readWorkflows, readPins, evaluateGate, ownerContext } from '../scripts/check-workflows.js';
const workflows=await readWorkflows(),pins=await readPins();
function mutate(change){const copy=structuredClone(workflows);change(copy);assert.throws(()=>checkPolicy(copy,pins));}
test('actual workflow gates admit only the owner on main and reject hostile event contexts',()=>{
  assert.equal(checkPolicy(workflows,pins),12);
  const gate=workflows['ci-pipeline.yml'].jobs['build-and-unit-tests'].if;
  assert.equal(evaluateGate(gate,ownerContext({event_name:'workflow_dispatch'})),true);
  assert.equal(evaluateGate(gate,ownerContext({actor:'kpok',triggering_actor:'attacker'})),false);
  assert.equal(evaluateGate(gate,ownerContext({repository:'attacker/Tictactoe'})),false);
  assert.throws(()=>evaluateGate('always() || github.actor == \'kpok\'',ownerContext()));
});
test('removing any identity, branch or event restriction fails the policy',()=>{
  for(const key of Object.keys(ownerContext().github)){
    mutate(w=>{const j=w['ci-pipeline.yml'].jobs['build-and-unit-tests'];
      if(key==='event_name')j.if=j.if.replace(/\(github.event_name[^)]+\)/,"github.actor == 'kpok'");
      else j.if=j.if.replace(new RegExp(`github\\.${key} == '[^']+' &&\\s*`),'');
    });
  }
});
test('new public triggers, jobs, token escalation and cancellation fail closed',()=>{
  mutate(w=>w['ci-pipeline.yml'].on.pull_request={});
  mutate(w=>w['deploy.yml'].jobs.unreviewed={});
  mutate(w=>w['ci-pipeline.yml'].permissions={contents:'write'});
  mutate(w=>w['ci-pipeline.yml'].concurrency={group:'ci','cancel-in-progress':true});
  mutate(w=>w['deploy.yml'].jobs.package.concurrency['cancel-in-progress']=true);
  mutate(w=>w['deploy.yml'].jobs.package.permissions={contents:'write'});
});
test('mutable actions, persisted checkout tokens and reusable secret inheritance are rejected',()=>{
  mutate(w=>w['deploy.yml'].jobs.package.steps[0].uses='actions/checkout@v4');
  mutate(w=>w['deploy.yml'].jobs.package.steps[0].with['persist-credentials']=true);
  mutate(w=>w['google-play-internal.yml'].jobs.verify.secrets='inherit');
  mutate(w=>w['google-play-internal.yml'].on.workflow_dispatch.inputs.publish.default=true);
  mutate(w=>w['google-play-internal.yml'].jobs['sign-and-publish'].environment='unprotected');
});
test('duplicate YAML keys and aliases cannot hide a second workflow definition',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'workflow-policy-'));
  try{
    await writeFile(join(dir,'ci.yml'),'jobs: {}\njobs: {}\n');
    await assert.rejects(readWorkflows(dir));
    await writeFile(join(dir,'ci.yml'),'jobs: &jobs {}\nalias: *jobs\n');
    await assert.rejects(readWorkflows(dir));
  }finally{await rm(dir,{recursive:true,force:true});}
});
test('diagnostic report labels inaccessible settings UNKNOWN and filters response fields',async()=>{
  const { spawnSync }=await import('node:child_process');
  const script=workflows['repo-diagnostics.yml'].jobs.diagnostics.steps[0].run;
  const harness=`import io,json,os,tempfile,urllib.error\nfrom unittest.mock import patch\nscript=${JSON.stringify(script)}\nwith tempfile.TemporaryDirectory() as d:\n p=os.path.join(d,'summary.md')\n os.environ.update(GITHUB_REPOSITORY='kpok/Tictactoe',GH_TOKEN='test-token',GITHUB_STEP_SUMMARY=p)\n def reply(request,timeout):\n  if request.full_url.endswith('/actions/permissions'):\n   return io.StringIO(json.dumps({'enabled':False,'allowed_actions':'selected','unreviewed_field':'must-not-leak'}))\n  raise urllib.error.HTTPError(request.full_url,403,'Forbidden',None,None)\n with patch('urllib.request.urlopen',side_effect=reply):\n  exec(compile(script,'diagnostic-inline','exec'))\n print(open(p).read())\n`;
  const result=spawnSync('python3',['-c',harness],{encoding:'utf8'});
  assert.equal(result.status,0,result.stderr);
  assert.match(result.stdout,/"enabled": false/);
  assert.match(result.stdout,/UNKNOWN \(HTTP 403\)/);
  assert.doesNotMatch(result.stdout,/must-not-leak|test-token/);
  assert.match(result.stdout,/successful run does not prove/);
});

test('internal release cannot silently switch to live ads or lose native configuration checks',()=>{
  for(const flag of ['-PadsMode=test','-PdebugAdsMode=disabled','-PadsFamiliesReviewed=false','-PadsLiveReviewed=false']){
    mutate(w=>{const s=w['ci-pipeline.yml'].jobs['android-build'].steps.find(s=>s.name==='Build Android packages');s.run=s.run.replace(flag,'');});
  }
  mutate(w=>w['google-play-internal.yml'].jobs['sign-and-publish'].env.ADMOB_APP_ID='other');
  mutate(w=>{const s=w['ci-pipeline.yml'].jobs['android-build'].steps.find(s=>s.name==='Verify test-only release and disabled debug ad configuration');s.run='echo skipped';});
});
