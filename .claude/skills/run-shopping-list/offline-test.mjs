import { chromium } from 'playwright-core'

const BASE_URL = process.env.SHOPLIST_URL || 'http://localhost:5173/app/'
const USERNAME = process.env.SHOPLIST_USER || 'devagent'
const PASSWORD = process.env.SHOPLIST_PASS || 'DevAgent123!'

const browser = await chromium.launch({ args: ['--no-sandbox'] })
const context = await browser.newContext({ viewport: { width: 900, height: 900 } })
const page = await context.newPage()
page.on('console', m => console.log('[console]', m.type(), m.text()))
page.on('pageerror', e => console.log('[pageerror]', e.message))

async function loginOrRegister() {
  await page.goto(BASE_URL, { waitUntil: 'networkidle' })
  const loginInputs = await page.$$('.tabContent input')
  await loginInputs[0].fill(USERNAME)
  await loginInputs[1].fill(PASSWORD)
  await page.click('button[type="submit"]')
  await page.waitForTimeout(800)
  const stillOnAuth = await page.$('.navBar .tab:has-text("Login")')
  if (stillOnAuth) {
    await page.click('.navBar .tab:has-text("Register")')
    const regInputs = await page.$$('.tabContent input')
    await regInputs[0].fill(USERNAME)
    await regInputs[1].fill(PASSWORD)
    await regInputs[2].fill(PASSWORD)
    await regInputs[3].fill('Dev Agent')
    await regInputs[4].fill('devagent@example.com')
    await page.click('button[type="submit"]')
    await page.waitForTimeout(800)
  }
}

await loginOrRegister()
await page.click('.navBar .tab:has-text("Build List")')
await page.waitForTimeout(500)

console.log('--- localStorage before ---')
console.log(await page.evaluate(() => localStorage.getItem('shopping-list-storage')))

// A fresh test account's "Default" list is served from a hardcoded starter-list
// fallback in getWorkingList() (shoppingList.php) until the account has real DB
// rows — toggling one of those synthetic items can never persist (there's
// nothing in the `lists` table to UPDATE). Add a brand-new item first, which is
// a real INSERT, so we have something genuinely backed by the DB to test against.
const itemName = `OfflineTestItem_${Date.now()}`
const aisleCount = await page.$$eval('.aisle', els => els.length)
if (aisleCount === 0) {
  await page.click('button:has-text("Add Aisle")')
  await page.fill('.modal input', 'OfflineTestAisle')
  await page.click('.modal button:has-text("Add and Close")')
  await page.waitForTimeout(500)
}
await page.click('button:has-text("Add Item")')
await page.waitForTimeout(200)
await page.fill('.modal input[type="text"]', itemName)
await page.click('.modal button:has-text("Add and Close")')
await page.waitForTimeout(500)

console.log('--- going offline ---')
await context.setOffline(true)

// Toggle the freshly-added (really persisted) item's enabled state while offline (saveEnabledState -> queued).
const itemRow = await page.locator('.item', { hasText: itemName })
const toggleBtn = await itemRow.locator('.toggleEnabled')
const beforeLabel = await toggleBtn.getAttribute('title')
await toggleBtn.click()
await page.waitForTimeout(500)
const afterLabel = await toggleBtn.getAttribute('title')
console.log(`Toggled item title: ${beforeLabel} -> ${afterLabel}`)

console.log('--- localStorage while offline (should show pendingMutations) ---')
const storedWhileOffline = await page.evaluate(() => localStorage.getItem('shopping-list-storage'))
console.log(storedWhileOffline)

const syncStatusText = await page.$eval('.syncStatus', el => el.textContent).catch(() => null)
console.log('Sync status indicator:', syncStatusText)

await page.screenshot({ path: '/tmp/offline-pending.png' })

console.log('--- going back online ---')
await context.setOffline(false)
await page.waitForTimeout(3000) // allow 'online' event + flushQueue to run

console.log('--- localStorage after reconnect (pendingMutations should be empty) ---')
console.log(await page.evaluate(() => localStorage.getItem('shopping-list-storage')))

const syncStatusAfter = await page.$('.syncStatus')
console.log('Sync status indicator present after flush (should be null):', syncStatusAfter)

await page.screenshot({ path: '/tmp/offline-after-sync.png' })

console.log('--- reloading now that we are back online, to confirm server actually persisted the change ---')
await page.reload({ waitUntil: 'networkidle' })
await page.click('.navBar .tab:has-text("Build List")')
await page.waitForTimeout(500)
const itemRowAfterReload = await page.locator('.item', { hasText: itemName })
const itemTitleAfterOnlineReload = await itemRowAfterReload.locator('.toggleEnabled').getAttribute('title').catch(() => null)
console.log(`Item title after online reload for ${itemName} (should match the offline toggle, proving it reached the server):`, itemTitleAfterOnlineReload)
await page.screenshot({ path: '/tmp/offline-after-online-reload.png' })

await browser.close()
