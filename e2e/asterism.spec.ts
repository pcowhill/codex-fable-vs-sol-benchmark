import { expect, test } from '@playwright/test'

test('operator repairs a lunar gap, compares the plan, and exports it', async ({ page }) => {
  const browserErrors: string[] = []
  page.on('pageerror', (error) => browserErrors.push(error.message))
  page.on('console', (message) => { if (message.type() === 'error') browserErrors.push(message.text()) })
  await page.goto('/')
  await page.getByRole('button', { name: /Lunar South Pole Resupply/i }).click()
  await page.locator('.event-row').filter({ hasText: 'Polar line-of-sight gap' }).click()
  await expect(page.getByLabel('Mission elapsed time')).toHaveValue('7.75')

  const beforeRelays = await page.locator('.metric').filter({ hasText: 'ACTIVE RELAYS' }).locator('strong').textContent()
  await page.getByRole('button', { name: /ADD RELAY/i }).click()
  const dialog = page.getByRole('dialog', { name: /Deploy communications relay/i })
  await dialog.getByLabel(/Relay designation/i).fill('POLARIS–7')
  await dialog.getByLabel(/Deployment region/i).selectOption('moon')
  await dialog.getByRole('slider', { name: /Initial orbital phase/i }).fill('245')
  await dialog.getByRole('slider', { name: /Transmission power/i }).fill('88')
  await dialog.getByRole('button', { name: /Deploy relay/i }).click()
  await expect(page.getByRole('heading', { name: 'POLARIS–7' })).toBeVisible()
  const afterRelays = await page.locator('.metric').filter({ hasText: 'ACTIVE RELAYS' }).locator('strong').textContent()
  expect(Number(afterRelays)).toBe(Number(beforeRelays) + 1)

  await page.getByRole('button', { name: /COMPARE/i }).click()
  await page.getByRole('button', { name: /Save current baseline/i }).click()
  await expect(page.getByText(/captured as baseline/i)).toBeVisible()
  await page.getByRole('button', { name: /Close comparison/i }).click()

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: /EXPORT/i }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toMatch(/^asterism-lsp-27-plan\.json$/)
  expect(browserErrors).toEqual([])
})
