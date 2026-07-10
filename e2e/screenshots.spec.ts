import { test } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'

const output = resolve('artifacts/screenshots')

test('capture final responsive console states', async ({ page }) => {
  await mkdir(output, { recursive: true })
  await page.setViewportSize({ width: 1920, height: 1080 })
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await page.screenshot({ path: resolve(output, 'asterism-main-1920x1080.png'), fullPage: true })

  await page.locator('.event-row').filter({ hasText: 'Polar line-of-sight gap' }).click()
  await page.getByRole('button', { name: /ADD RELAY/i }).click()
  const dialog = page.getByRole('dialog', { name: /Deploy communications relay/i })
  await dialog.getByLabel(/Relay designation/i).fill('POLARIS–7')
  await dialog.getByRole('slider', { name: /Initial orbital phase/i }).fill('245')
  await dialog.getByRole('slider', { name: /Transmission power/i }).fill('88')
  await dialog.getByRole('button', { name: /Deploy relay/i }).click()
  await page.getByRole('button', { name: /Dismiss notification/i }).click()
  await page.screenshot({ path: resolve(output, 'asterism-edited-plan-1920x1080.png'), fullPage: true })

  await page.setViewportSize({ width: 1366, height: 768 })
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await page.screenshot({ path: resolve(output, 'asterism-main-1366x768.png'), fullPage: true })
})
