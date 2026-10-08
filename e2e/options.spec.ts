import { expect, test } from '@playwright/test'
import { openApp } from './helpers'

test('options reject invalid session time and persist a valid save', async ({
  page,
}) => {
  await openApp(page)
  await page.getByRole('button', { name: 'Options' }).click()
  await expect(page.getByRole('heading', { name: 'Options' })).toBeVisible()

  await page.locator('input[name="sessionTimeSeconds"]').fill('10')
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByRole('alert')).toContainText(
    'Game session time must be between 60 and 180 seconds.',
  )

  await page.locator('input[name="sessionTimeSeconds"]').fill('90')
  await page.locator('input[name="enemySpawnIntervalSeconds"]').fill('3')
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByRole('status')).toContainText('Options saved')

  await page.reload()
  await page.getByRole('button', { name: 'Options' }).click()
  await expect(page.locator('input[name="sessionTimeSeconds"]')).toHaveValue('90')
  await expect(page.locator('input[name="enemySpawnIntervalSeconds"]')).toHaveValue(
    '3',
  )
})
