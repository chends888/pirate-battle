import { expect, test } from '@playwright/test'

test('main menu shows play and options', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Pirate Battle' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Play' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Options' })).toBeVisible()
})
