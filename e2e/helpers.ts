import { expect, type Page } from '@playwright/test'

export async function openApp(page: Page) {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Pirate Battle' })).toBeVisible()
}

export async function startMatch(page: Page) {
  await page.getByRole('button', { name: 'Play' }).click()
  await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible({
    timeout: 20_000,
  })
  await page.waitForFunction(() => Boolean(window.__game), undefined, {
    timeout: 20_000,
  })
}
