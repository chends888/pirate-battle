import { expect, test } from '@playwright/test'
import { openApp } from './helpers'

test('ranking paginates and honors empty and error scenarios', async ({ page }) => {
  await openApp(page)
  await expect(page.getByText('Black Flag')).toBeVisible()
  await page.getByRole('button', { name: 'Next' }).click()
  await expect(page.getByText('Tide')).toBeVisible()
  await page.getByRole('button', { name: 'Previous' }).click()
  await expect(page.getByText('Black Flag')).toBeVisible()

  await page.locator('select[name="networkScenario"]').selectOption('empty')
  await expect(
    page.getByText('No ranking entries for this configuration yet.'),
  ).toBeVisible()

  await page.locator('select[name="networkScenario"]').selectOption('error')
  await expect(page.getByRole('alert')).toContainText('Could not load ranking')
})
