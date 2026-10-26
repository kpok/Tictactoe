import { appendFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
export function versionCode(value){
  if(!/^[1-9][0-9]{0,9}$/.test(value)||Number(value)>2100000000)throw new Error('Android versionCode must be an integer between 1 and 2100000000');
  return Number(value);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  const code=versionCode(process.env.ANDROID_VERSION_CODE||'1');
  if(process.env.GITHUB_ENV)appendFileSync(process.env.GITHUB_ENV,`ANDROID_VERSION_CODE=${code}\n`);
  console.log(`Android versionCode: ${code}`);
}
