import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const emptyMenu = () => Object.fromEntries(DAYS.map(d => [d, []]))

function collapseKey(action, payload) {
  switch (action) {
    case 'setShopList':
    case 'revertWorkingList':
      return `${action}:${payload.listName}`
    case 'setMenu':
      return 'setMenu'
    case 'setUserSetting':
      return `setUserSetting:${payload.setting}`
    case 'saveDoneState':
    case 'saveEnabledState':
    case 'saveCount':
      return `${action}:${payload.listName}:${payload.id}`
    default:
      return null
  }
}

const useStore = create(persist((set, get) => ({
  isLoggedIn: false,
  activeTab: 'login',
  enableForgot: false,
  error: null,
  msg: null,

  currentList: 'Default',
  listNames: ['Default'],
  // { aisleOrder: string[], aisles: { [name]: { id: string, items: Item[] } } }
  shopList: { aisleOrder: [], aisles: {} },
  menu: emptyMenu(),
  settings: { playAudio: true },
  shopTs: '',
  menuTs: '',
  pendingMutations: [],

  openDialog: null,

  setActiveTab: (tab) => set({ activeTab: tab }),
  setLoggedIn: (isLoggedIn, enableForgot = false, tab) =>
    set({ isLoggedIn, enableForgot, activeTab: isLoggedIn ? (tab ?? 'buildList') : 'login' }),
  setNotLoggedIn: () =>
    set({ isLoggedIn: false, activeTab: 'login', enableForgot: false }),
  setError: (error) => set({ error }),
  setMsg: (msg) => set({ msg }),
  clearMessages: () => set({ error: null, msg: null }),

  setCurrentList: (name) => set({ currentList: name }),
  setListNames: (names) => set({ listNames: names }),
  setShopList: (shopList, ts) => set({ shopList, shopTs: ts ?? get().shopTs }),
  setShopTs: (ts) => set({ shopTs: ts }),
  setMenu: (menu, ts) => set({ menu, menuTs: ts ?? get().menuTs }),
  setMenuTs: (ts) => set({ menuTs: ts }),
  setSetting: (key, value) => set((s) => ({ settings: { ...s.settings, [key]: value } })),

  setOpenDialog: (dialog) => set({ openDialog: dialog }),

  toggleItemEnabled: (id) => set((s) => {
    const aisles = {}
    for (const name of s.shopList.aisleOrder) {
      aisles[name] = {
        ...s.shopList.aisles[name],
        items: s.shopList.aisles[name].items.map(item =>
          item.id === id ? { ...item, enabled: !item.enabled } : item),
      }
    }
    return { shopList: { ...s.shopList, aisles } }
  }),

  toggleItemDone: (id) => set((s) => {
    const aisles = {}
    for (const name of s.shopList.aisleOrder) {
      aisles[name] = {
        ...s.shopList.aisles[name],
        items: s.shopList.aisles[name].items.map(item =>
          item.id === id ? { ...item, done: !item.done } : item),
      }
    }
    return { shopList: { ...s.shopList, aisles } }
  }),

  setItemCount: (id, count) => set((s) => {
    const aisles = {}
    for (const name of s.shopList.aisleOrder) {
      aisles[name] = {
        ...s.shopList.aisles[name],
        items: s.shopList.aisles[name].items.map(item =>
          item.id === id ? { ...item, count } : item),
      }
    }
    return { shopList: { ...s.shopList, aisles } }
  }),

  deleteItem: (id) => set((s) => {
    const aisles = {}
    for (const name of s.shopList.aisleOrder) {
      aisles[name] = {
        ...s.shopList.aisles[name],
        items: s.shopList.aisles[name].items.filter(item => item.id !== id),
      }
    }
    return { shopList: { ...s.shopList, aisles } }
  }),

  addItemToAisle: (aisleName, item) => set((s) => {
    const aisle = s.shopList.aisles[aisleName]
    if (!aisle) return {}
    return {
      shopList: {
        ...s.shopList,
        aisles: {
          ...s.shopList.aisles,
          [aisleName]: { ...aisle, items: [...aisle.items, item] },
        },
      },
    }
  }),

  addAisle: (aisleName, aisleId) => set((s) => ({
    shopList: {
      aisleOrder: [...s.shopList.aisleOrder, aisleName],
      aisles: { ...s.shopList.aisles, [aisleName]: { id: aisleId, items: [] } },
    },
  })),

  renameAisle: (oldName, newName) => set((s) => {
    const aisleOrder = s.shopList.aisleOrder.map(n => n === oldName ? newName : n)
    const aisles = {}
    for (const name of s.shopList.aisleOrder) {
      const key = name === oldName ? newName : name
      aisles[key] = {
        ...s.shopList.aisles[name],
        items: s.shopList.aisles[name].items.map(item =>
          item.aisle === oldName ? { ...item, aisle: newName } : item),
      }
    }
    return { shopList: { aisleOrder, aisles } }
  }),

  setShopListOrder: (aisleOrder, aislesItems) => set((s) => {
    const aisles = {}
    for (const name of aisleOrder) {
      aisles[name] = { ...s.shopList.aisles[name], items: aislesItems[name] ?? s.shopList.aisles[name]?.items ?? [] }
    }
    return { shopList: { aisleOrder, aisles } }
  }),

  addMenuItem: (day, item) => set((s) => ({
    menu: { ...s.menu, [day]: [...(s.menu[day] ?? []), item] },
  })),

  deleteMenuItem: (day, id) => set((s) => ({
    menu: { ...s.menu, [day]: (s.menu[day] ?? []).filter(i => i.id !== id) },
  })),

  clearMenu: () => set({ menu: emptyMenu() }),

  addList: (name) => set((s) => ({ listNames: [...s.listNames, name] })),

  removeList: (name) => set((s) => ({ listNames: s.listNames.filter(n => n !== name) })),

  enqueueMutation: (action, payload) => set((s) => {
    const key = collapseKey(action, payload)
    const filtered = key ? s.pendingMutations.filter(m => m.key !== key) : s.pendingMutations
    const id = `${Date.now()}_${Math.random().toString(36).slice(2)}`
    return { pendingMutations: [...filtered, { id, key, action, payload }] }
  }),

  dequeueMutation: (id) => set((s) => ({
    pendingMutations: s.pendingMutations.filter(m => m.id !== id),
  })),
}), {
  name: 'shopping-list-storage',
  partialize: (state) => ({
    currentList: state.currentList,
    listNames: state.listNames,
    shopList: state.shopList,
    menu: state.menu,
    settings: state.settings,
    shopTs: state.shopTs,
    menuTs: state.menuTs,
    pendingMutations: state.pendingMutations,
  }),
}))

export default useStore
