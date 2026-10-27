import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { versionCode } from './android-version.js';
export async function verifyArtifacts(directory,{sha,versionName,code}){
  const manifest=JSON.parse(await readFile(new URL('manifest.json',directory),'utf8'));
  if(!/^[a-f0-9]{40}$/.test(sha||'')||manifest.sha!==sha||manifest.packageName!=='com.kpok.threefold'||manifest.versionName!==versionName||manifest.versionCode!==versionCode(String(code)))throw new Error('Android artifact does not match this revision, package or version');
  for(const name of ['app-debug.apk','app-debug-androidTest.apk','app-release-unsigned.aab']){
    const actual=createHash('sha256').update(await readFile(new URL(name,directory))).digest('hex');
    if(actual!==manifest.hashes?.[name])throw new Error(`Android artifact hash mismatch: ${name}`);
  }
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  const {version}=JSON.parse(await readFile(new URL('../package.json',import.meta.url),'utf8'));
  await verifyArtifacts(new URL('../android-artifacts/',import.meta.url),{sha:process.env.GITHUB_SHA,versionName:version,code:process.env.ANDROID_VERSION_CODE||'1'});
  console.log('Android artifact provenance, versionName and SHA-256 hashes verified.');
}
