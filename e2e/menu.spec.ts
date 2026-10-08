import { expect, test } from '@playwright/test'
import { openApp } from './helpers'

test('main menu shows play, options, and ranking', async ({ page }) => {
  await openApp(page)
  await expect(page.getByRole('button', { name: 'Play' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Options' })).toBeVisible()
  await expect(page.getByRole('tab', { name: 'Ranking' })).toBeVisible()
  await expect(page.getByText('Black Flag')).toBeVisible()
})
