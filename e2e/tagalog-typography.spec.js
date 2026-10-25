import { test, expect } from 'playwright/test';

for (const viewport of [{width:320,height:800},{width:393,height:851},{width:851,height:393},{width:1280,height:900}]) {
  test(`Tagalog typography stays compact at ${viewport.width}x${viewport.height}`,async({page})=>{
    await page.setViewportSize(viewport);
    await page.goto('/');
    await page.locator('#language').selectOption('tl');
    await page.locator('[data-mode="local"]').click();
    await page.locator('#board button[data-index="4"]').click();
    const mobile=viewport.width<=800;
    const limits=[['h1',mobile?22:40],['.game-card h2',17],['.how-title h2',16],['.mode-button',12],['#o-label',10],['#turn-status',12],['#restart',12]];
    async function checkTypography(){
      for(const [selector,max] of limits){
        const size=await page.locator(selector).first().evaluate(el=>parseFloat(getComputedStyle(el).fontSize));
        expect(size,`${selector} exceeds Tagalog font budget`).toBeLessThanOrEqual(max);
      }
      const overflow=await page.evaluate(()=>({width:innerWidth,content:document.documentElement.scrollWidth}));
      expect(overflow.content).toBeLessThanOrEqual(overflow.width);
      await expect(page.locator('#board button[data-index="4"]')).toHaveAttribute('data-mark','O');
    }
    await checkTypography();
    await page.locator('#language').selectOption('en');
    await page.locator('#language').selectOption('tl');
    await checkTypography();
    await Promise.all([page.waitForNavigation(),page.evaluate(()=>location.reload())]);
    await expect(page.locator('#language')).toHaveValue('tl');
    await checkTypography();
    await page.locator('#help').click();
    const dialogSize=await page.locator('#help-dialog h2').evaluate(el=>parseFloat(getComputedStyle(el).fontSize));
    expect(dialogSize).toBeLessThanOrEqual(20);
    await expect(page.locator('#help-dialog')).toBeVisible();
    // Browser zoom remains available; only automatic text inflation is normalized.
    const viewportMeta=await page.locator('meta[name="viewport"]').getAttribute('content');
    expect(viewportMeta).not.toMatch(/user-scalable\s*=\s*no|maximum-scale\s*=\s*1(?:,|$)/);
  });
}
