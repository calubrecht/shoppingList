#!/usr/bin/env node
// Headless-Chromium driver for the shopping-list React app (ui/).
// Assumes both dev servers are already running (see SKILL.md):
//   php on :5000 (bin/runDevPhp), vite on :5173 (cd ui && npm run dev)
//
// Usage:
//   node driver.mjs <screenshot-path> [view]
//
// view is one of: login | register | buildlist (default) | shop | menu | settings | about | recipes
// Login/register uses a fixed throwaway dev account, creating it on first run.

import { chromium } from 'playwright-core'

const BASE_URL = process.env.SHOPLIST_URL || 'http://localhost:5173/app/'
const USERNAME = process.env.SHOPLIST_USER || 'devagent'
const PASSWORD = process.env.SHOPLIST_PASS || 'DevAgent123!'

const [, , outPath = 'screenshot.png', view = 'buildlist'] = process.argv

const browser = await chromium.launch({ args: ['--no-sandbox'] })
const page = await browser.newPage({ viewport: { width: 900, height: 900 } })
const errors = []
page.on('pageerror', e => errors.push(e.message))

async function loginOrRegister() {
  await page.goto(BASE_URL, { waitUntil: 'networkidle' })
  const loginInputs = await page.$$('.tabContent input')
  await loginInputs[0].fill(USERNAME)
  await loginInputs[1].fill(PASSWORD)
  await page.click('button[type="submit"]')
  await page.waitForTimeout(800)

  // If login failed (still on the login/register tabs), register instead.
  const stillOnAuth = await page.$('.navBar .tab:has-text("Login")')
  if (stillOnAuth) {
    await page.click('.navBar .tab:has-text("Register")')
    const regInputs = await page.$$('.tabContent input')
    await regInputs[0].fill(USERNAME)   // username
    await regInputs[1].fill(PASSWORD)   // password
    await regInputs[2].fill(PASSWORD)   // confirm password
    await regInputs[3].fill('Dev Agent') // display name
    await regInputs[4].fill('devagent@example.com') // email
    await page.click('button[type="submit"]')
    await page.waitForTimeout(800)
  }
}

if (view === 'login') {
  await page.goto(BASE_URL, { waitUntil: 'networkidle' })
} else if (view === 'register') {
  await page.goto(BASE_URL, { waitUntil: 'networkidle' })
  await page.click('.navBar .tab:has-text("Register")')
} else {
  await loginOrRegister()
  const tabName = { buildlist: 'Build List', shop: 'Shop', menu: 'Menu', settings: 'Settings' }[view]
  if (tabName) {
    await page.click(`.navBar .tab:has-text("${tabName}")`)
    await page.waitForTimeout(300)
  }
  if (view === 'about') {
    await page.click('.appHeader')
    await page.waitForTimeout(300)
  }
  if (view === 'recipes') {
    await page.click('.navBar .tab:has-text("Menu")')
    await page.waitForTimeout(300)
    await page.click('.buttonPane button:has-text("Show Recipes")')
    await page.waitForTimeout(500)
  }
}

await page.screenshot({ path: outPath })
console.log(`Screenshot: ${outPath}`)
if (errors.length) {
  console.log('Console page errors:', errors)
}
await browser.close()
