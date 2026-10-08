import { expect, test } from '@playwright/test'
import { openApp, startMatch } from './helpers'

test('last result is visible after refresh', async ({ page }) => {
  await openApp(page)
  await startMatch(page)
  await page.evaluate(() => window.__game?.endMatch('time'))
  await expect(page.getByTestId('submission-status')).toContainText(
    'Match recorded',
    { timeout: 10_000 },
  )
  await page.reload()
  await expect(page.getByTestId('last-result')).toContainText('Time expired')
  await expect(page.getByTestId('last-result')).toContainText('Recorded')
})

test('timeout on submit then retry records a single history entry', async ({
  page,
}) => {
  test.setTimeout(60_000)
  await openApp(page)
  await page.locator('select[name="networkScenario"]').selectOption('timeout-on-submit')
  await startMatch(page)
  await page.evaluate(() => window.__game?.endMatch('time'))
  await expect(page.getByTestId('submission-status')).toContainText(
    'Could not record the match',
    { timeout: 20_000 },
  )
  await page.getByRole('button', { name: 'Retry recording' }).click()
  await expect(page.getByTestId('submission-status')).toContainText(
    'Match recorded',
    { timeout: 10_000 },
  )
  await page.getByRole('button', { name: 'Main Menu' }).click()
  await page.getByRole('tab', { name: 'Match History' }).click()
  await expect(page.getByText(/0 pts/)).toHaveCount(1)
})
