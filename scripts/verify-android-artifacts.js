import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { versionCode } from './android-version.js';
const directory=new URL('../android-artifacts/',import.meta.url);
const manifest=JSON.parse(await readFile(new URL('manifest.json',directory),'utf8'));
if(manifest.sha!==process.env.GITHUB_SHA||manifest.packageName!=='com.kpok.threefold'||manifest.versionCode!==versionCode(process.env.ANDROID_VERSION_CODE||'1'))throw new Error('Android artifact does not match this revision, package or versionCode');
for(const name of ['app-debug.apk','app-debug-androidTest.apk','app-release-unsigned.aab']){
  const actual=createHash('sha256').update(await readFile(new URL(name,directory))).digest('hex');
  if(actual!==manifest.hashes[name])throw new Error(`Android artifact hash mismatch: ${name}`);
}
console.log('Android artifact provenance and SHA-256 hashes verified.');
