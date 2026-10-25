import { test, expect } from 'playwright/test';
import { LANGUAGES, MESSAGES } from '../web/i18n.js';

async function userReload(page){await Promise.all([page.waitForNavigation(),page.evaluate(()=>location.reload())]);}
test('all sixteen languages translate controls and preserve the current game',async({page})=>{
  // This scenario exercises sixteen complete UI renders on mobile browser engines.
  test.setTimeout(60_000);
  await page.goto('/');await page.locator('[data-mode="local"]').click();await page.locator('#board button[data-index="4"]').click();
  for(const {code}of LANGUAGES){
    await page.locator('#language').selectOption(code);
    await expect(page.locator('html')).toHaveAttribute('lang',code);
    await expect(page.locator('#language')).toHaveAccessibleName(MESSAGES[code].languageLabel);
    await expect(page.locator('[data-mode="ai"]')).toContainText(MESSAGES[code].modeAi);
    await expect(page.locator('#restart')).toContainText(MESSAGES[code].newRound);
    await expect(page.locator('#board button[data-index="4"]')).toHaveAttribute('data-mark','O');
    await expect(page.locator('#help')).toHaveAccessibleName(MESSAGES[code].help);
    const width=await page.evaluate(()=>({screen:innerWidth,content:document.documentElement.scrollWidth}));expect(width.content,`${code} overflows screen`).toBeLessThanOrEqual(width.screen);
  }
  await page.setViewportSize({width:320,height:800});
  for(const {code}of LANGUAGES){await page.locator('#language').selectOption(code);const width=await page.evaluate(()=>({screen:innerWidth,content:document.documentElement.scrollWidth}));expect(width.content,`${code} overflows 320px screen`).toBeLessThanOrEqual(width.screen);}
  await page.locator('#language').selectOption('tl');await userReload(page);
  await expect(page.locator('#language')).toHaveValue('tl');await expect(page.locator('html')).toHaveAttribute('lang','tl');
  await expect(page.locator('#board button[data-index="4"]')).toHaveAttribute('data-mark','O');
  await page.locator('#help').click();await expect(page.locator('#help-dialog')).toContainText(MESSAGES.tl.helpBody);
});
test('Arabic mirrors text but retains board coordinates and left-to-right invite codes',async({page})=>{
  await page.goto('/');await page.locator('#language').selectOption('ar');
  await expect(page.locator('html')).toHaveAttribute('dir','rtl');
  expect(await page.locator('#board').evaluate(el=>getComputedStyle(el).direction)).toBe('ltr');
  await page.locator('[data-mode="local"]').click();await page.locator('#board button[data-index="0"]').click();
  await expect(page.locator('#board button[data-index="0"]')).toHaveAttribute('data-mark','O');
  await page.locator('[data-mode="online"]').click();await expect(page.locator('#online-dialog')).toBeVisible();
  expect(await page.locator('#join-code').evaluate(el=>getComputedStyle(el).direction)).toBe('ltr');
  await page.locator('#online-dialog .close-dialog').click();await page.locator('#language').selectOption('ja');
  await expect(page.locator('html')).toHaveAttribute('dir','ltr');
});
test('new users receive their browser language including Filipino',async({browser,baseURL})=>{
  const context=await browser.newContext({locale:'fil-PH'});
  try{const page=await context.newPage();await page.goto(baseURL);await expect(page.locator('#language')).toHaveValue('tl');await expect(page.locator('html')).toHaveAttribute('lang','tl');}
  finally{await context.close();}
});
