import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseDocument } from 'yaml';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
export async function readWorkflows(directory=resolve(root,'.github/workflows')){
  const result={};
  for(const file of (await readdir(directory)).filter(f=>/\.ya?ml$/.test(f)).sort()){
    const doc=parseDocument(await readFile(resolve(directory,file),'utf8'),{uniqueKeys:true});
    if(doc.errors.length)throw doc.errors[0];
    result[file]=doc.toJS({maxAliasCount:0});
  }
  return result;
}
// Evaluate only the small documented expression subset used by authorization gates.
// Unknown syntax fails closed; missing context properties follow GitHub's empty-string behavior.
export function evaluateGate(expression,context){
 assert.equal(typeof expression,'string','Every job needs an authorization expression');
 const source=expression.trim().replace(/^\$\{\{\s*|\s*\}\}$/g,'');
 const tokens=source.match(/'[^']*'|[a-zA-Z_][a-zA-Z0-9_.]*|==|!=|&&|\|\||\(|\)/g)||[];
 assert.equal(tokens.join(''),source.replace(/\s+(?=(?:[^']*'[^']*')*[^']*$)/g,''),'Unsupported authorization syntax');
 let index=0;
 const value=()=>{const token=tokens[index++];assert.ok(token,'Incomplete authorization expression');if(token==='('){const result=or();assert.equal(tokens[index++],')');return result;}if(token.startsWith("'"))return token.slice(1,-1);assert.match(token,/^[a-zA-Z_][a-zA-Z0-9_.]*$/);return token.split('.').reduce((obj,key)=>obj?.[key],context)??'';};
 const comparison=()=>{const a=value(),operator=tokens[index];if(operator!=='=='&&operator!=='!=')return Boolean(a);index++;const b=value();const equal=typeof a==='string'&&typeof b==='string'?a.toLowerCase()===b.toLowerCase():a===b;return operator==='=='?equal:!equal;};
 const and=()=>{let result=comparison();while(tokens[index]==='&&'){index++;const next=comparison();result=result&&next;}return result;};
 const or=()=>{let result=and();while(tokens[index]==='||'){index++;const next=and();result=result||next;}return result;};
 const result=or();assert.equal(index,tokens.length,'Unexpected authorization tokens');return Boolean(result);
}

export function ownerContext(overrides={}){
  return {github:{repository:'kpok/Tictactoe',repository_id:'969630128',repository_owner_id:'10676481',actor_id:'10676481',actor:'kpok',triggering_actor:'kpok',ref:'refs/heads/main',event_name:'push',...overrides}};
}
const workflowJobs={
  'ci-pipeline.yml':['android-build','android-emulator-e2e','build-and-unit-tests','playwright'],
  'deploy.yml':['package'],
  'repo-diagnostics.yml':['actions-smoke','diagnostics','jekyll-smoke'],
  'google-play-internal.yml':['sign-and-publish','validate','verify']
};
export async function readPins(){return JSON.parse(await readFile(resolve(root,'.github/action-pins.json'),'utf8'));}
export function checkPolicy(workflows,pins){
  assert.deepEqual(Object.keys(workflows).sort(),Object.keys(workflowJobs).sort(),'Unreviewed workflow');
  let total=0;const groups=new Set();
  for(const [file,w] of Object.entries(workflows)){
    const ci=file==='ci-pipeline.yml';
    assert.deepEqual(w.permissions,{},`${file}: token must default to no permissions`);
    assert.equal(w.concurrency,undefined,`${file}: authorization must precede concurrency`);
    assert.deepEqual(Object.keys(w.on).sort(),ci?['push','workflow_call','workflow_dispatch']:['workflow_dispatch'],`${file}: unexpected trigger`);
    if(ci)assert.deepEqual(w.on.push,{branches:['main']});
    assert.deepEqual(Object.keys(w.jobs).sort(),workflowJobs[file],`${file}: unreviewed job`);
    for(const [name,job] of Object.entries(w.jobs)){
      total++;const label=`${file}/${name}`;
      assert.deepEqual(job.permissions,{contents:'read'},`${label}: excessive token permissions`);
      assert.equal(job.secrets,undefined,`${label}: do not inherit secrets`);
      for(const event_name of ['push','workflow_dispatch']){
        assert.equal(evaluateGate(job.if,ownerContext({event_name})),ci||event_name==='workflow_dispatch',`${label}: trusted event blocked`);
      }
      const denied=[{repository:'attacker/Tictactoe'},{repository:'kpok/other'},{repository_id:'999'},{repository_owner_id:'999'},{actor_id:'999'},{actor:'collaborator'},{triggering_actor:'collaborator'},{actor:'dependabot[bot]',actor_id:'49699333'},{ref:'refs/heads/feature'},{ref:'refs/tags/main'}];
      for(const event_name of ['pull_request','pull_request_target','workflow_run','workflow_call','repository_dispatch','schedule','release','issue_comment'])denied.push({event_name});
      for(const key of Object.keys(ownerContext().github))denied.push({[key]:undefined});
      for(const bad of denied)assert.equal(evaluateGate(job.if,ownerContext({event_name:'workflow_dispatch',...bad})),false,`${label}: unauthorized context ${JSON.stringify(bad)}`);
      if(name==='verify'){
        assert.equal(job.uses,'./.github/workflows/ci-pipeline.yml');
        assert.equal(job.needs,'validate');
        assert.deepEqual(job.with,{version_code:'${{ inputs.version_code }}'});
        for(const key of ['steps','runs-on','concurrency','environment','env'])assert.equal(job[key],undefined,`${label}: unexpected caller property`);
        continue;
      }
      assert.equal(job.uses,undefined,`${label}: unreviewed reusable job`);
      assert.equal(job['runs-on'],'ubuntu-latest',`${label}: hosted runner required`);
      assert.ok(Number.isInteger(job['timeout-minutes'])&&job['timeout-minutes']>0&&job['timeout-minutes']<=25,`${label}: bounded timeout required`);
      assert.equal(job.concurrency?.['cancel-in-progress'],false,`${label}: no cancellation of trusted work`);
      const group=job.concurrency?.group;
      assert.equal(group,`trusted-threefold-${name}${name==='build-and-unit-tests'?'-${{ matrix.node }}':''}`);
      assert.ok(!groups.has(group),`${label}: shared concurrency group`);groups.add(group);
      if(name==='sign-and-publish'){
        assert.equal(job.needs,'verify');assert.equal(job.environment,'google-play-internal');
      }else assert.doesNotMatch(JSON.stringify(job),/secrets[.\[]/,`${label}: credentials outside signing job`);
      for(const step of job.steps){
        if(step.run)assert.doesNotMatch(step.run,/\$\{\{/,`${label}: pass inputs via quoted environment variables`);
        if(!step.uses)continue;
        const [action,sha]=step.uses.split('@');
        assert.match(sha||'',/^[a-f0-9]{40}$/,`${label}: immutable action SHA required`);
        assert.equal(sha,pins[action],`${label}: unreviewed action pin`);
        if(action==='actions/checkout'){
          assert.equal(step.with?.ref,'${{ github.sha }}');
          assert.equal(step.with?.['persist-credentials'],false);
          assert.equal(step.with?.repository,undefined);
        }
      }
    }
  }
  assert.ok(workflows['repo-diagnostics.yml'].jobs.diagnostics.steps.every(s=>!s.uses),'Baseline diagnostics must run without external actions');
  const play=workflows['google-play-internal.yml'];
  assert.equal(play.on.workflow_dispatch.inputs.publish.default,false,'Publishing must be opt-in');
  const upload=play.jobs['sign-and-publish'].steps.find(s=>s.uses?.startsWith('r0adkll/upload-google-play@'));
  assert.equal(upload?.if,'inputs.publish');assert.equal(upload?.with?.tracks,'internal');
  assert.ok(workflows['ci-pipeline.yml'].jobs['build-and-unit-tests'].steps.some(s=>s.run==='npm run check'));
  return total;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  try{const n=checkPolicy(await readWorkflows(),await readPins());console.log(`Workflow policy PASS: ${n} owner-only jobs; adversarial contexts denied.`);}
  catch(error){console.error(error.message);process.exitCode=1;}
}
