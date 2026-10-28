import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
// Public build configuration. This profile cannot enable real advertising or child requests.
export function internalAds(env=process.env){
  const appId=env.ADMOB_APP_ID||'ca-app-pub-3940256099942544~3347511713';
  const privacyUrl=env.ADS_PRIVACY_URL||'';
  if(!/^ca-app-pub-[0-9]{16}~[0-9]{10}$/.test(appId)||/\s/.test(appId))throw new Error('ADMOB_APP_ID must be an AdMob application ID (with ~, not an ad unit ID)');
  if(privacyUrl){
    let url;try{url=new URL(privacyUrl);}catch{throw new Error('ADS_PRIVACY_URL must be an HTTPS URL');}
    if(url.protocol!=='https:'||url.username||url.password||/[\s"\\\x00-\x1f\x7f]/.test(privacyUrl))throw new Error('ADS_PRIVACY_URL must be HTTPS without credentials, whitespace or unsafe characters');
  }
  return {mode:'test',debugMode:'disabled',appId,unitId:'ca-app-pub-3940256099942544/1033173712',privacyUrl,familiesReviewed:false};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)console.log(JSON.stringify(internalAds()));
