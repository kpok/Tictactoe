import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { internalAds } from './internal-ads.js';
import { versionCode } from './android-version.js';
const root=new URL('../',import.meta.url),dir=new URL('android-artifacts/',root);
const files={
  'app-debug.apk':'android/app/build/outputs/apk/debug/app-debug.apk',
  'app-debug-androidTest.apk':'android/app/build/outputs/apk/androidTest/debug/app-debug-androidTest.apk',
  'app-release-unsigned.aab':'android/app/build/outputs/bundle/release/app-release.aab'
};
await mkdir(dir,{recursive:true});
const hashes={};
for(const [name,source]of Object.entries(files)){
  await copyFile(new URL(source,root),new URL(name,dir));
  hashes[name]=createHash('sha256').update(await readFile(new URL(name,dir))).digest('hex');
}
const {version}=JSON.parse(await readFile(new URL('package.json',root),'utf8'));
await writeFile(new URL('manifest.json',dir),JSON.stringify({sha:process.env.GITHUB_SHA,packageName:'com.kpok.threefold',versionName:version,versionCode:versionCode(process.env.ANDROID_VERSION_CODE||'1'),ads:internalAds(),hashes},null,2)+'\n');
console.log('Collected APKs and unsigned AAB with source revision and SHA-256 hashes.');
