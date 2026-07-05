import { useEffect, useRef } from 'react'
import useStore from './store/useStore'
import { post } from './api'
import TabBar from './components/TabBar'
import LoginTab from './components/LoginTab'
import RegisterTab from './components/RegisterTab'
import ForgotPasswordTab from './components/ForgotPasswordTab'
import BuildListTab from './components/BuildListTab'
import ShopTab from './components/ShopTab'
import MenuTab from './components/MenuTab'
import SettingsTab from './components/SettingsTab'
import AddItemDialog from './components/dialogs/AddItemDialog'
import AddAisleDialog from './components/dialogs/AddAisleDialog'
import AddMenuItemDialog from './components/dialogs/AddMenuItemDialog'
import AddListDialog from './components/dialogs/AddListDialog'
import PrintView from './components/dialogs/PrintView'
import AboutDialog from './components/dialogs/AboutDialog'
import RecipesDialog from './components/dialogs/RecipesDialog'
import './App.css'

function parseShopList(data) {
  const aisleOrder = []
  const aisles = {}
  for (const item of data.workingList ?? []) {
    const name = item.aisle ?? 'UNKNOWN'
    if (!aisles[name]) {
      aisles[name] = { id: `aisle_${name.replace(/[^a-zA-Z0-9]/g, '_')}`, items: [] }
      aisleOrder.push(name)
    }
    aisles[name].items.push({
      id: item.id,
      name: item.name,
      count: item.count,
      enabled: item.active,
      done: item.done,
      aisle: name,
    })
  }
  return { aisleOrder, aisles }
}

function parseMenu(data) {
  const menu = { Sunday: [], Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [] }
  for (const item of data.menu ?? []) {
    const day = item.aisle
    if (menu[day]) menu[day].push({ id: item.id, name: item.name })
  }
  return menu
}

export default function App() {
  const {
    activeTab, isLoggedIn, openDialog, currentList, shopList, menu, settings, listNames,
    setLoggedIn, setNotLoggedIn, setActiveTab,
    setShopList, setMenu, setListNames, setSetting,
    setError, setMsg, clearMessages, setOpenDialog,
  } = useStore()

  useEffect(() => {
    post({ action: 'checkLogin' }).then(handleCheckLogin).catch(() => {})
  }, [])

  const latestRef = useRef({})
  latestRef.current = { activeTab, loadBuildList, loadShopList, loadMenu }

  useEffect(() => {
    if (!isLoggedIn) return

    let skips = 0
    let emptyPolls = 0

    const timer = setInterval(() => {
      if (!document.hasFocus() || document.hidden) return
      if (skips > 0) { skips--; return }

      post({ action: 'tick' }).then(data => {
        if (!data.isLoggedIn) { setNotLoggedIn(); return }

        const { activeTab: tab, loadBuildList: lb, loadShopList: ls, loadMenu: lm } = latestRef.current
        const { shopTs: curShopTs, menuTs: curMenuTs } = useStore.getState()
        let updates = 0

        if (tab === 'buildList' && data.tock?.shop !== curShopTs) { lb(); updates++ }
        else if (tab === 'shop' && data.tock?.shop !== curShopTs) { ls(); updates++ }
        else if (tab === 'menu' && data.tock?.menu !== curMenuTs) { lm(); updates++ }

        emptyPolls = updates === 0 ? emptyPolls + 1 : 0
        if (emptyPolls > 50) skips = 120
        else if (emptyPolls > 40) skips = 30
        else if (emptyPolls > 30) skips = 10
      }).catch(() => {})
    }, 1000)

    return () => clearInterval(timer)
  }, [isLoggedIn])

  function handleCheckLogin(data) {
    if (data.isLoggedIn) {
      setLoggedIn(true, data.enableForgot)
      post({ action: 'getListNames' }).then(d => setListNames(d.lists ?? []))
      post({ action: 'getUserSetting', setting: 'playAudio' })
        .then(d => setSetting('playAudio', d.settingValue !== 'false'))
      post({ action: 'getShopList', listName: currentList })
        .then(d => setShopList(parseShopList(d), d.ts?.ts))
    } else {
      setNotLoggedIn()
    }
    if (data.msg) setMsg(data.msg)
    if (data.error) setError(data.error)
  }

  function handleLogin(userName, password) {
    clearMessages()
    post({ action: 'login', userName, password }).then(handleCheckLogin)
  }

  function handleLogout() {
    post({ action: 'logout' }).then(handleCheckLogin)
  }

  function handleRegister(fields) {
    clearMessages()
    post({ action: 'register', ...fields }).then(data => {
      if (data.isLoggedIn) setLoggedIn(true)
      if (data.msg) setMsg(data.msg)
      if (data.error) setError(data.error)
    })
  }

  function handleForgotPassword(userName) {
    clearMessages()
    post({ action: 'resetPassword', userName }).then(data => {
      if (data.msg) setMsg(data.msg)
      if (data.error) setError(data.error)
    })
  }

  function loadBuildList() {
    post({ action: 'getShopList', listName: currentList }).then(data => {
      if (!data.isLoggedIn) { setNotLoggedIn(); return }
      setShopList(parseShopList(data), data.ts?.ts)
    })
  }

  function loadShopList() {
    post({ action: 'getShopList', listName: currentList }).then(data => {
      if (!data.isLoggedIn) { setNotLoggedIn(); return }
      setShopList(parseShopList(data), data.ts?.ts)
    })
  }

  function loadMenu() {
    post({ action: 'getMenu' }).then(data => {
      if (!data.isLoggedIn) { setNotLoggedIn(); return }
      setMenu(parseMenu(data), data.ts?.ts)
    })
  }

  function handleTabChange(tab) {
    clearMessages()
    setActiveTab(tab)
    if (tab === 'buildList') loadBuildList()
    if (tab === 'shop') loadShopList()
    if (tab === 'menu') loadMenu()
  }

  const tabContent = {
    login: <LoginTab onLogin={handleLogin} onForgotPassword={() => setActiveTab('password')} />,
    password: <ForgotPasswordTab onSubmit={handleForgotPassword} />,
    register: <RegisterTab onRegister={handleRegister} />,
    buildList: (
      <BuildListTab
        onReload={loadBuildList}
        onOpenAddItem={() => setOpenDialog('addItem')}
        onOpenAddAisle={() => setOpenDialog('addAisle')}
        dialogOpen={openDialog != null}
      />
    ),
    shop: (
      <ShopTab
        onOpenPrint={() => setOpenDialog('print')}
        onReload={loadShopList}
      />
    ),
    menu: (
      <MenuTab
        onOpenAddMenuItem={() => setOpenDialog('addMenuItem')}
        onOpenPrint={() => setOpenDialog('print')}
        onOpenRecipes={() => setOpenDialog('recipes')}
        onReload={loadMenu}
      />
    ),
    settings: <SettingsTab onOpenAddList={() => setOpenDialog('addList')} />,
  }

  return (
    <div id="app">
      <audio id="FinishSound" src="/audio/success.wav" preload="auto" />
      <header className="appHeader" onClick={() => setOpenDialog('about')}>
        <h1>Your Shopping List</h1>
      </header>
      <TabBar
        activeTab={activeTab}
        isLoggedIn={isLoggedIn}
        onTabChange={handleTabChange}
        onLogout={handleLogout}
      />
      <main className="tabBody">
        {tabContent[activeTab] ?? null}
      </main>

      {openDialog === 'addItem' && <AddItemDialog onClose={() => setOpenDialog(null)} />}
      {openDialog === 'addAisle' && <AddAisleDialog onClose={() => setOpenDialog(null)} />}
      {openDialog === 'addMenuItem' && <AddMenuItemDialog onClose={() => setOpenDialog(null)} />}
      {openDialog === 'addList' && <AddListDialog onClose={() => setOpenDialog(null)} />}
      {openDialog === 'print' && (
        <PrintView shopList={shopList} menu={menu} activeTab={activeTab} onClose={() => setOpenDialog(null)} />
      )}
      {openDialog === 'about' && <AboutDialog onClose={() => setOpenDialog(null)} />}
      {openDialog === 'recipes' && <RecipesDialog onClose={() => setOpenDialog(null)} />}
    </div>
  )
}
