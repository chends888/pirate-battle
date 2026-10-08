import { expect, test } from '@playwright/test'
import { openApp, startMatch } from './helpers'

const idleIntent = {
  forward: false,
  rotateLeft: false,
  rotateRight: false,
  fireFront: false,
  fireLeft: false,
  fireRight: false,
}

test('the ship moves, rotates, fires, and stops on the island', async ({
  page,
}) => {
  await openApp(page)
  await startMatch(page)

  const moved = await page.evaluate((intent) => {
    const game = window.__game
    if (!game) throw new Error('missing game')
    const before = game.snapshot().player
    game.setIntent({ ...intent, forward: true })
    game.step(0.4)
    const after = game.snapshot().player
    return { beforeY: before.y, afterY: after.y, beforeRot: before.rotation }
  }, idleIntent)
  expect(moved.afterY).toBeLessThan(moved.beforeY)

  const rotated = await page.evaluate((intent) => {
    const game = window.__game
    if (!game) throw new Error('missing game')
    const before = game.snapshot().player.rotation
    game.setIntent({ ...intent, rotateRight: true })
    game.step(0.3)
    return { before, after: game.snapshot().player.rotation }
  }, idleIntent)
  expect(rotated.after).toBeGreaterThan(rotated.before)

  const shots = await page.evaluate((intent) => {
    const game = window.__game
    if (!game) throw new Error('missing game')
    game.setIntent({ ...intent, fireFront: true })
    game.step(1 / 60)
    game.setIntent(intent)
    return game.snapshot().projectiles.length
  }, idleIntent)
  expect(shots).toBeGreaterThan(0)

  const islandHit = await page.evaluate((intent) => {
    const game = window.__game
    if (!game) throw new Error('missing game')
    const island = game.snapshot().islands[0]
    if (!island) throw new Error('missing island')
    const player = game.runtime.world.player
    const dx = island.x - player.x
    const dy = island.y - player.y
    player.rotation = Math.atan2(dx, -dy)
    game.setIntent({ ...intent, forward: true })
    game.step(4)
    const after = game.snapshot().player
    const dist = Math.hypot(after.x - island.x, after.y - island.y)
    return dist >= island.radius + after.radius - 1.5
  }, idleIntent)
  expect(islandHit).toBe(true)
})

test('a chaser ram damages the player without scoring', async ({ page }) => {
  await openApp(page)
  await startMatch(page)
  const result = await page.evaluate((intent) => {
    const game = window.__game
    if (!game) throw new Error('missing game')
    const player = game.snapshot().player
    game.setIntent(intent)
    game.spawnEnemyAt('chaser', player.x, player.y)
    game.step(0.2)
    const after = game.snapshot()
    return { score: after.score, hp: after.player.hp, maxHp: after.player.maxHp }
  }, idleIntent)
  expect(result.score).toBe(0)
  expect(result.hp).toBeLessThan(result.maxHp)
})

test('death ends the match and play again starts clean', async ({ page }) => {
  await openApp(page)
  await startMatch(page)
  await page.evaluate(() => window.__game?.endMatch('death'))
  await expect(page.getByRole('heading', { name: 'Match result' })).toBeVisible()
  await expect(page.getByText('Ended by Ship destroyed')).toBeVisible()
  await expect(page.getByTestId('submission-status')).toContainText(
    'Match recorded',
    { timeout: 10_000 },
  )
  await page.getByRole('button', { name: 'Play Again' }).click()
  await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible({
    timeout: 20_000,
  })
  const score = await page.evaluate(() => window.__game?.snapshot().score ?? -1)
  expect(score).toBe(0)
})
