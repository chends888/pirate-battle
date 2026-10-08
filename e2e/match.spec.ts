import { expect, test } from '@playwright/test'
import { openApp, startMatch } from './helpers'

test('pause freezes the match until the player resumes', async ({ page }) => {
  await openApp(page)
  await startMatch(page)
  await page.getByRole('button', { name: 'Pause' }).click()
  await expect(page.getByRole('heading', { name: 'Paused' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Resume' })).toBeVisible()
  await page.getByRole('button', { name: 'Resume' }).click()
  await expect(page.getByRole('heading', { name: 'Paused' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible()
})

test('abandoning a match returns to the menu without recording history', async ({
  page,
}) => {
  await openApp(page)
  await startMatch(page)
  await page.getByRole('button', { name: 'Abandon' }).click()
  await expect(page.getByRole('heading', { name: 'Pirate Battle' })).toBeVisible()
  await page.getByRole('tab', { name: 'Match History' }).click()
  await expect(page.getByText('No completed matches yet.')).toBeVisible()
})

test('ending a match records it in ranking and history', async ({ page }) => {
  await openApp(page)
  await startMatch(page)
  await page.evaluate(() => window.__game?.endMatch('time'))
  await expect(page.getByRole('heading', { name: 'Match result' })).toBeVisible()
  await expect(page.getByTestId('submission-status')).toContainText(
    'Match recorded',
    { timeout: 10_000 },
  )
  await page.getByRole('button', { name: 'Main Menu' }).click()
  await page.getByRole('tab', { name: 'Match History' }).click()
  await expect(page.getByText('Captain — 0 pts')).toBeVisible()
})
