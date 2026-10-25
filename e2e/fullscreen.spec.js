import { test, expect } from 'playwright/test';

test('fullscreen board preserves the game and can be closed with its control',async({page})=>{
  await page.goto('/');await page.locator('[data-mode="local"]').click();await page.locator('#board button[data-index="4"]').click();
  await page.locator('#fullscreen').click();
  await expect(page.locator('body')).toHaveClass(/focus-mode/);
  await expect(page.locator('#fullscreen')).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('.intro')).toBeHidden();await expect(page.locator('.mode-tabs')).toBeHidden();
  const bounds=await page.locator('#board').boundingBox();const viewport=await page.evaluate(()=>({width:innerWidth,height:innerHeight}));
  expect(bounds.width).toBeGreaterThan(100);expect(bounds.x).toBeGreaterThanOrEqual(0);expect(bounds.x+bounds.width).toBeLessThanOrEqual(viewport.width+1);expect(bounds.y+bounds.height).toBeLessThanOrEqual(viewport.height+1);
  await expect(page.locator('#board button[data-index="4"]')).toHaveAttribute('data-mark','O');
  await page.locator('#fullscreen').click();await expect(page.locator('body')).not.toHaveClass(/focus-mode/);
  await expect(page.locator('.intro')).toBeVisible();await expect(page.locator('#board button[data-index="4"]')).toHaveAttribute('data-mark','O');
});
test('board-only fallback works in landscape without native fullscreen and Escape exits',async({page})=>{
  await page.addInitScript(()=>{Object.defineProperty(Element.prototype,'requestFullscreen',{configurable:true,value:()=>Promise.reject(new Error('Native fullscreen unavailable'))});});
  await page.setViewportSize({width:640,height:360});await page.goto('/');await page.locator('#language').selectOption('tl');
  await page.locator('[data-mode="local"]').click();await page.locator('#board button[data-index="0"]').click();
  await page.locator('#fullscreen').click();await expect(page.locator('body')).toHaveClass(/focus-mode/);
  await expect(page.locator('#fullscreen')).toHaveAccessibleName('Lumabas sa buong screen');
  const board=await page.locator('#board').boundingBox();expect(board.y).toBeGreaterThanOrEqual(0);expect(board.y+board.height).toBeLessThanOrEqual(360);
  await expect(page.locator('#board button[data-index="0"]')).toHaveAttribute('data-mark','O');
  await page.keyboard.press('Escape');await expect(page.locator('body')).not.toHaveClass(/focus-mode/);await expect(page.locator('#fullscreen')).toHaveAttribute('aria-pressed','false');
  await expect(page.locator('#board button[data-index="0"]')).toHaveAttribute('data-mark','O');
});
