import { test, expect } from 'playwright/test';
import { mkdtemp, cp, appendFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createApp } from '../server/app.js';
const cell=(page,i)=>page.locator(`#board button[data-index="${i}"]`);
async function clickCell(page,i){await expect(cell(page,i)).toBeEnabled();await cell(page,i).click();}
async function local(page){await page.goto('/');await page.locator('[data-mode="local"]').click();}
async function playSequence(page,moves){for(const i of moves)await clickCell(page,i);}
// User-initiated navigation avoids WebKit protocol Page.reload + SW cache-write hangs (#42273).
async function reloadLikeUser(page){await Promise.all([page.waitForNavigation({waitUntil:'load'}),page.evaluate(()=>location.reload())]);}
async function stopServer(server){const closed=new Promise(resolve=>server.close(resolve));server.closeAllConnections();await closed;}
async function readyOffline(page){await page.evaluate(async()=>{await navigator.serviceWorker.ready;if(!navigator.serviceWorker.controller)await new Promise(resolve=>navigator.serviceWorker.addEventListener('controllerchange',resolve,{once:true}));});}

test('local FIFO removes the oldest mark before checking a winning line',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));await local(page);
  await playSequence(page,[0,3,1,4,8,6]);
  await expect(cell(page,0)).toHaveClass(/oldest/);
  await clickCell(page,2);
  await expect(cell(page,0)).toHaveAttribute('data-mark','');
  await expect(page.locator('#board [data-mark="O"]')).toHaveCount(3);
  await expect(page.locator('#result')).toBeHidden();
  await expect(page.locator('#turn-status')).toContainText('X');
  expect(errors).toEqual([]);
});
test('victory, score, rematch and alternating starter',async({page})=>{
  await local(page);await expect(page.locator('#restart')).toContainText('Nowa runda');await playSequence(page,[0,3,1,4,2]);
  await expect(page.locator('#result-title')).toContainText('O');
  await expect(page.locator('#o-score')).toHaveText('1');
  await expect(page.locator('#board .win')).toHaveCount(3);
  await expect(cell(page,8)).toBeDisabled();
  await page.locator('#restart').click();
  await expect(page.locator('#board [data-mark="O"]')).toHaveCount(0);
  await expect(page.locator('#turn-status')).toContainText('X');
  await expect(page.locator('#o-score')).toHaveText('1');
});
test('AI plays and switching modes cancels an obsolete worker',async({page})=>{
  await page.goto('/');await page.locator('#difficulty').selectOption('easy');await clickCell(page,4);
  await expect(page.locator('#board [data-mark="X"]')).toHaveCount(1);
  await page.locator('[data-mode="local"]').click();
  await expect(page.locator('#move-count')).toContainText('0/100');
  await page.locator('[data-mode="ai"]').click();
  await page.locator('#difficulty').selectOption('hard');await clickCell(page,0);
  await page.locator('[data-mode="local"]').click();
  await page.waitForTimeout(500);
  await expect(page.locator('#board [data-mark="X"]')).toHaveCount(0);
  await expect(page.locator('#move-count')).toContainText('0/100');
});
test('language, instructions, keyboard focus and mobile layout',async({page})=>{
  await page.goto('/');await page.locator('#language').selectOption('en');
  await expect(page.locator('html')).toHaveAttribute('lang','en');
  await page.locator('#help').click();await expect(page.locator('#help-dialog')).toBeVisible();
  await expect(page.locator('#help-dialog')).toContainText('oldest disappears');
  await page.keyboard.press('Escape');await expect(page.locator('#help-dialog')).toBeHidden();
  await page.locator('[data-mode="local"]').click();await cell(page,0).focus();await page.keyboard.press('Enter');
  await expect(cell(page,0)).toHaveAttribute('data-mark','O');
  const dimensions=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));
  expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.width);
  await page.emulateMedia({reducedMotion:'reduce'});
  expect(await page.locator('.mark').evaluate(el=>getComputedStyle(el).animationName)).toBe('none');
});
test('local game survives reload and works when the server is unreachable',async({page})=>{
  const server=createApp();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  try{
    await page.goto(`http://127.0.0.1:${server.address().port}`);await page.locator('[data-mode="local"]').click();await playSequence(page,[4,0]);
    await readyOffline(page);
    // A real stopped server tests fallback in every engine; WebKit setOffline bypasses SW (#42775).
    await stopServer(server);await reloadLikeUser(page);
    await expect(cell(page,4)).toHaveAttribute('data-mark','O');await expect(cell(page,0)).toHaveAttribute('data-mark','X');
    await clickCell(page,8);await expect(cell(page,8)).toHaveAttribute('data-mark','O');
    await page.locator('#language').selectOption('tl');await reloadLikeUser(page);
    await expect(page.locator('html')).toHaveAttribute('lang','tl');
    await expect(page.locator('[data-mode="ai"]')).toContainText('Kompyuter');
  }finally{if(server.listening)await stopServer(server);}
});
test('two isolated browsers join, play, reconnect and accept rematch together',async({browser,baseURL},testInfo)=>{
  // Two recorded mobile contexts plus round-trip polling need a larger total budget on hosted WebKit.
  // Individual assertions retain the same short timeout; no functional check is relaxed.
  test.setTimeout(60_000);
  const use=testInfo.project.use;const options={locale:use.locale,viewport:use.viewport,userAgent:use.userAgent,deviceScaleFactor:use.deviceScaleFactor,isMobile:use.isMobile,hasTouch:use.hasTouch,recordVideo:{dir:testInfo.outputPath('online-video')}};
  const a=await browser.newContext(options),b=await browser.newContext(options);
  try{
    const first=await a.newPage(),second=await b.newPage();
    await first.goto(baseURL);await first.locator('[data-mode="online"]').click();await first.locator('#create-room').click();
    await expect(first.locator('#online-dialog')).toBeHidden();const code=await first.locator('#room-code').textContent();expect(code).toMatch(/^[A-Z2-9]{6}$/);
    await second.goto(`${baseURL}/?room=${code}`);await expect(second.locator('#join-code')).toHaveValue(code);await second.locator('#join-form button').click();
    await expect(second.locator('#online-dialog')).toBeHidden();
    for(const [n,index]of [0,3,1,4,2].entries())await clickCell(n%2?second:first,index);
    await expect(first.locator('#result-title')).toContainText('O');await expect(second.locator('#result-title')).toContainText('O');
    await reloadLikeUser(first);await expect(first.locator('#result-title')).toContainText('O');
    await first.locator('#restart').click();await expect(first.locator('#restart')).toBeDisabled();
    await expect(second.locator('#result-detail')).toContainText('rewanż');await second.locator('#restart').click();
    await expect(first.locator('#move-count')).toContainText('0/100');await expect(second.locator('#move-count')).toContainText('0/100');
    await clickCell(second,4);await expect(cell(first,4)).toHaveAttribute('data-mark','X');
    const cachedApi=await first.evaluate(async()=>{for(const name of await caches.keys())for(const request of await(await caches.open(name)).keys())if(new URL(request.url).pathname.includes('/api/'))return true;return false;});
    expect(cachedApi).toBe(false);
  }finally{await a.close();await b.close();}
});
test.describe('injected HTTP failures',()=>{
  // Playwright routing cannot reliably intercept service-worker-owned requests.
  test.use({serviceWorkers:'block'});
test('unchanged room polls preserve tap targets and reconnect still renders',async({page})=>{
  await page.goto('/');await page.locator('[data-mode="online"]').click();await page.locator('#create-room').click();
  await expect(page.locator('#online-dialog')).toBeHidden();
  await expect(page.locator('#turn-status')).toHaveText('Czekamy na znajomego…');
  const status=await page.locator('#turn-status').textContent();
  await page.evaluate(()=>{
    window.__boardTarget=document.querySelector('#board button');
    window.__restartText=document.querySelector('#restart span').firstChild;
    const original=window.fetch;
    window.fetch=async(...args)=>{
      const response=await original(...args);
      if(response.url.includes('/api/rooms/')&&(!args[1]?.method||args[1].method==='GET')){
        const json=response.json.bind(response);
        response.json=async()=>{const data=await json();setTimeout(()=>window.__pollApplied=true,0);return data;};
      }
      return response;
    };
    window.__pollApplied=false;document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect.poll(()=>page.evaluate(()=>window.__pollApplied)).toBe(true);
  expect(await page.evaluate(()=>window.__boardTarget===document.querySelector('#board button')&&window.__restartText===document.querySelector('#restart span').firstChild)).toBe(true);
  await page.evaluate(()=>window.dispatchEvent(new Event('offline')));
  await expect(page.locator('#turn-status')).not.toHaveText(status);
  await page.evaluate(()=>{window.__pollApplied=false;window.dispatchEvent(new Event('online'));});
  await expect.poll(()=>page.evaluate(()=>window.__pollApplied)).toBe(true);
  await expect(page.locator('#turn-status')).toHaveText(status);
});
test('failed connection is visible and local play remains available',async({page})=>{
  await page.route('**/api/rooms',route=>route.fulfill({status:503,contentType:'application/json',body:'{"error":"rooms_full"}'}));
  await page.goto('/');await page.locator('[data-mode="online"]').click();await page.locator('#create-room').click();
  await expect(page.locator('#online-error')).toContainText('pełny');
  await page.locator('#online-dialog .close-dialog').click();await page.locator('[data-mode="local"]').click();
  await clickCell(page,0);await expect(cell(page,0)).toHaveAttribute('data-mark','O');
});
});
test('leaving online removes its invite and reload preserves local mode',async({page})=>{
  await page.goto('/');await page.locator('[data-mode="online"]').click();await page.locator('#create-room').click();
  await expect(page.locator('#online-dialog')).toBeHidden();await expect(page).toHaveURL(/room=/);
  await page.locator('[data-mode="local"]').click();await expect(page).not.toHaveURL(/room=/);
  await clickCell(page,4);await reloadLikeUser(page);await expect(page.locator('#online-dialog')).toBeHidden();
  await expect(page.locator('[data-mode="local"]')).toHaveAttribute('aria-pressed','true');await expect(cell(page,4)).toHaveAttribute('data-mark','O');
});
test.describe('delayed HTTP replies',()=>{
  test.use({serviceWorkers:'block'});
test('an obsolete poll error cannot clear a newly created room',async({page})=>{
  await page.goto('/');await page.locator('[data-mode="online"]').click();await page.locator('#create-room').click();
  await expect(page.locator('#online-dialog')).toBeHidden();const oldCode=await page.locator('#room-code').textContent();
  let release,intercepted;const started=new Promise(resolve=>intercepted=resolve);const gate=new Promise(resolve=>release=resolve);
  await page.route(`**/api/rooms/${oldCode}`,async route=>{if(route.request().method()!=='GET')return route.continue();intercepted();await gate;await route.fulfill({status:404,contentType:'application/json',body:'{"error":"room_not_found"}'}).catch(()=>{});});
  await started;await page.locator('#online-manage').click();await page.locator('#create-room').click();
  await expect(page.locator('#online-dialog')).toBeHidden();const newCode=await page.locator('#room-code').textContent();expect(newCode).not.toBe(oldCode);release();
  await page.waitForTimeout(1200);await expect(page.locator('#room-code')).toHaveText(newCode);await expect(page.locator('#online-banner')).toBeVisible();
});
});
test('service worker fetches updated assets online and retains them offline',async({page})=>{
  const root=await mkdtemp(path.join(tmpdir(),'threefold-e2e-'));
  await cp(new URL('../web/',import.meta.url),root,{recursive:true});
  const server=createApp({webRoot:root});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  try{
    await page.goto(`http://127.0.0.1:${server.address().port}`);
    await readyOffline(page);
    await appendFile(path.join(root,'styles.css'),'\n/* new-version-marker */');
    expect(await page.evaluate(async()=>(await fetch('./styles.css')).text())).toContain('new-version-marker');
    await stopServer(server);
    expect(await page.evaluate(async()=>(await fetch('./styles.css')).text())).toContain('new-version-marker');
  }finally{if(server.listening)await stopServer(server);await rm(root,{recursive:true,force:true});}
});
