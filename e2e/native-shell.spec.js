import { test, expect } from 'playwright/test';
test('native shell exposes offline modes without PWA registration or online API',async({page})=>{
  await page.addInitScript(()=>{window.Capacitor={isNativePlatform:()=>true};});
  const apiRequests=[];page.on('request',r=>{if(new URL(r.url()).pathname.startsWith('/api/'))apiRequests.push(r.url());});
  await page.goto('/?room=ABC234');
  await expect(page.locator('[data-mode="online"]')).toBeHidden();
  await expect(page.locator('#online-dialog')).not.toBeVisible();
  await page.locator('[data-mode="local"]').click();await page.locator('#board button[data-index="4"]').click();
  await expect(page.locator('#board button[data-index="4"]')).toHaveAttribute('data-mark','O');
  expect(await page.evaluate(()=>navigator.serviceWorker.getRegistrations().then(items=>items.length))).toBe(0);
  expect(apiRequests).toEqual([]);
});
