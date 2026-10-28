import { test, expect } from 'playwright/test';
async function nativeFake(page,{delayed=false,mode='disabled'}={}){
 await page.addInitScript(({delayed,mode})=>{
  window.__adCalls=[];window.__age='';
  window.Capacitor={isNativePlatform:()=>true,nativePromise:async(_,method,data)=>{
   window.__adCalls.push({method,data});
   if(method==='getState')return {mode,age:window.__age,familiesReady:false,privacyOptions:false,privacyUrl:window.__policyUrl||''};
   if(method==='setAge'){window.__age=data.age;return {};}
   if(method==='reset'){window.__age='';return {};}
   if(method==='beginBoundary')return {boundaryToken:'test'};
   if(method==='showBetweenRounds'&&delayed)return new Promise(resolve=>{window.__closeAd=()=>resolve({shown:true});});
   return {shown:false};
  }};
 },{delayed,mode});
}
async function win(page){for(const n of [0,3,1,4,2])await page.locator(`#board [data-index="${n}"]`).click();}
test('ads only requested at completed-round restart, not abandonment or reload',async({page})=>{
 await nativeFake(page);await page.goto('/');await page.locator('[data-mode=local]').click();
 await page.locator('#board [data-index="4"]').click();page.on('dialog',d=>d.accept());await page.locator('#restart').click();
 expect(await page.evaluate(()=>window.__adCalls.some(c=>c.method==='completeRound'||c.method==='showBetweenRounds'))).toBe(false);
 // The abandoned round alternates the starter, so reset the mode for a known O start.
 await page.locator('[data-mode=ai]').click();await page.locator('[data-mode=local]').click();await win(page);
 await expect.poll(()=>page.evaluate(()=>window.__adCalls.filter(c=>c.method==='completeRound').length)).toBe(1);
 await Promise.all([page.waitForNavigation(),page.evaluate(()=>location.reload())]);
 expect(await page.evaluate(()=>window.__adCalls.filter(c=>c.method==='completeRound').length)).toBe(0);
 await page.locator('#restart').click();await expect.poll(()=>page.evaluate(()=>window.__adCalls.filter(c=>c.method==='showBetweenRounds').length)).toBe(1);
 await expect(page.locator('#board [data-mark=O]')).toHaveCount(0);
});
test('pending ad locks transition and cannot reset another mode or lose the ended game',async({page})=>{
 await nativeFake(page,{delayed:true});await page.goto('/');await page.locator('[data-mode=local]').click();await win(page);await page.locator('#restart').click();
 await expect(page.locator('#restart')).toBeDisabled();await expect(page.locator('[data-mode=ai]')).toBeDisabled();await expect(page.locator('#clear-data')).toBeDisabled();
 await page.evaluate(()=>document.querySelector('[data-mode=ai]').dispatchEvent(new Event('click')));
 await expect(page.locator('[data-mode=local]')).toHaveAttribute('aria-pressed','true');
 await page.evaluate(()=>window.__closeAd());await expect(page.locator('#restart')).toBeEnabled();await expect(page.locator('#board [data-mark=O]')).toHaveCount(0);
});
test('neutral age choices have no default and preserve local game',async({page})=>{
 await nativeFake(page);await page.goto('/');await page.locator('[data-mode=local]').click();await page.locator('#board [data-index="4"]').click();
 await page.locator('#ads-settings').click();await expect(page.locator('#ads-age')).toHaveValue('');
 await page.locator('#ads-age').selectOption('unknown');await page.locator('#ads-save').click();await expect(page.locator('#ads-dialog')).toBeHidden();
 await expect(page.locator('#board [data-index="4"]')).toHaveAttribute('data-mark','O');
 expect(await page.evaluate(()=>window.__age)).toBe('unknown');
});
test('restored completed legacy game restarts when native boundary has no data',async({page})=>{
 await nativeFake(page);await page.goto('/');await page.locator('[data-mode=local]').click();await win(page);
 await page.evaluate(()=>{const saved=JSON.parse(localStorage.getItem('threefold.v1'));delete saved.roundId;localStorage.setItem('threefold.v1',JSON.stringify(saved));});
 await Promise.all([page.waitForNavigation(),page.evaluate(()=>location.reload())]);
 await page.evaluate(()=>{const original=window.Capacitor.nativePromise;window.Capacitor.nativePromise=(plugin,method,data)=>method==='beginBoundary'?Promise.resolve(undefined):original(plugin,method,data);});
 await page.locator('#restart').click();await expect(page.locator('#board [data-mark=O]')).toHaveCount(0);await expect(page.locator('#restart')).toBeEnabled();
});
test('native privacy policy link only accepts credential-free HTTPS URLs',async({page})=>{
 await nativeFake(page);await page.goto('/');
 for(const [url,visible] of [['javascript:alert(1)',false],['https://example.org/privacy',true],['https://name@example.org/privacy',false]]){
  await page.evaluate(value=>{window.__policyUrl=value;},url);await page.locator('#ads-settings').click();
  if(visible){await expect(page.locator('#ads-policy-link')).toBeVisible();await expect(page.locator('#ads-policy-link')).toHaveAttribute('href',url);}
  else await expect(page.locator('#ads-policy-link')).toBeHidden();
  await page.locator('#ads-dialog .close-dialog').click();
 }
});

test('test-enabled internal profile opens neutral age prompt and identifies test ads',async({page})=>{
 await nativeFake(page,{mode:'test'});await page.goto('/');
 await expect(page.locator('#ads-dialog')).toBeVisible();await expect(page.locator('#ads-age')).toHaveValue('');
 await expect(page.locator('#ads-status')).toContainText(/test/i);
 await page.locator('#ads-age').selectOption('under18');await page.locator('#ads-save').click();
 await expect(page.locator('#ads-dialog')).toBeHidden();
 await page.locator('[data-mode=local]').click();await page.locator('#board [data-index="4"]').click();
 await expect(page.locator('#board [data-index="4"]')).toHaveAttribute('data-mark','O');
 await page.locator('#ads-settings').click();await expect(page.locator('#ads-age')).toHaveValue('under18');
 expect(await page.evaluate(()=>window.__adCalls.some(c=>c.method==='showBetweenRounds'))).toBe(false);
});
