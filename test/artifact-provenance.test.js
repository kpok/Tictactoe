import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { verifyArtifacts } from '../scripts/verify-android-artifacts.js';
test('artifact provenance rejects wrong versionName, source and modified package bytes',async()=>{
  const path=await mkdtemp(join(tmpdir(),'artifact-check-')),directory=pathToFileURL(path+'/');
  const expected={sha:'a'.repeat(40),versionName:'1.0.0',code:42};
  const manifest={sha:expected.sha,packageName:'com.kpok.threefold',versionName:'1.0.0',versionCode:42,hashes:{}};
  try{
    for(const name of ['app-debug.apk','app-debug-androidTest.apk','app-release-unsigned.aab']){
      await writeFile(new URL(name,directory),'fixture');manifest.hashes[name]=createHash('sha256').update('fixture').digest('hex');
    }
    const save=()=>writeFile(new URL('manifest.json',directory),JSON.stringify(manifest));
    await save();await verifyArtifacts(directory,expected);
    manifest.versionName='wrong';await save();await assert.rejects(verifyArtifacts(directory,expected),/version/);
    manifest.versionName='1.0.0';manifest.sha='b'.repeat(40);await save();await assert.rejects(verifyArtifacts(directory,expected),/revision/);
    manifest.sha=expected.sha;await save();await writeFile(new URL('app-release-unsigned.aab',directory),'changed');
    await assert.rejects(verifyArtifacts(directory,expected),/hash mismatch/);
  }finally{await rm(path,{recursive:true,force:true});}
});
