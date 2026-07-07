import useStore from './store/useStore'
import { parseShopList, parseMenu } from './parsers'

const QUEUEABLE_ACTIONS = new Set([
  'saveDoneState', 'saveEnabledState', 'saveCount', 'deleteItem', 'addItem',
  'setShopList', 'revertWorkingList', 'addListName', 'removeListName',
  'setMenu', 'setUserSetting',
])

function getXsrfToken() {
  const cookie = document.cookie.split('; ').find(r => r.startsWith('XSRF_TOKEN='))
  return cookie ? cookie.split('=')[1] : null
}

async function rawPost(data) {
  const token = getXsrfToken()
  const res = await fetch('/service/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'X-XSRF-TOKEN': token } : {}),
    },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function post(data) {
  try {
    return await rawPost(data)
  } catch (err) {
    if (err instanceof TypeError && QUEUEABLE_ACTIONS.has(data.action)) {
      useStore.getState().enqueueMutation(data.action, data)
      return {}
    }
    throw err
  }
}

function applyFlushResult(action, data) {
  const store = useStore.getState()
  if (action === 'setShopList' || action === 'revertWorkingList') {
    if (data.error) {
      store.setShopList(parseShopList(data), data.ts?.ts)
      store.setMsg('An offline change to your list could not be saved because it changed elsewhere. Showing the latest version.')
    } else if (data.ts?.ts) {
      store.setShopTs(data.ts.ts)
    }
    return
  }
  if (action === 'setMenu') {
    if (data.error) {
      store.setMenu(parseMenu(data), data.ts?.ts)
      store.setMsg('An offline change to your menu could not be saved because it changed elsewhere. Showing the latest version.')
    } else if (data.ts?.ts) {
      store.setMenuTs(data.ts.ts)
    }
    return
  }
  if (data?.ts?.ts) store.setShopTs(data.ts.ts)
}

let flushing = false

export async function flushQueue() {
  if (flushing) return
  flushing = true
  try {
    while (true) {
      const [next] = useStore.getState().pendingMutations
      if (!next) break
      let data
      try {
        data = await rawPost(next.payload)
      } catch {
        break
      }
      useStore.getState().dequeueMutation(next.id)
      applyFlushResult(next.action, data)
    }
  } finally {
    flushing = false
  }
}
