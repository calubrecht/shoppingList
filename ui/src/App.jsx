import { useEffect, useRef } from 'react'
import useStore from './store/useStore'
import { post, flushQueue } from './api'
import { parseShopList, parseMenu } from './parsers'
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

const LOGGED_IN_TABS = ['buildList', 'shop', 'menu', 'settings']

export default function App() {
  const {
    activeTab, isLoggedIn, openDialog, currentList, shopList, menu, settings, listNames,
    pendingMutations,
    setLoggedIn, setNotLoggedIn, setActiveTab,
    setShopList, setMenu, setListNames, setSetting,
    setError, setMsg, clearMessages, setOpenDialog,
  } = useStore()

  const initialTabRef = useRef(window.location.hash.slice(1))

  useEffect(() => {
    post({ action: 'checkLogin' }).then(data => handleCheckLogin(data, true)).catch(() => {})

    const handleOnline = () => flushQueue()
    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [])

  useEffect(() => {
    if (activeTab) history.replaceState(null, '', `#${activeTab}`)
  }, [activeTab])

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

        if (useStore.getState().pendingMutations.length > 0) flushQueue()

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

  function handleCheckLogin(data, useHash = false) {
    if (data.isLoggedIn) {
      const hashTab = useHash ? initialTabRef.current : undefined
      const tab = LOGGED_IN_TABS.includes(hashTab) ? hashTab : undefined
      setLoggedIn(true, data.enableForgot, tab)
      post({ action: 'getListNames' }).then(d => setListNames(d.lists ?? []))
      post({ action: 'getUserSetting', setting: 'playAudio' })
        .then(d => setSetting('playAudio', d.settingValue !== 'false'))
      if (tab === 'menu') loadMenu()
      else post({ action: 'getShopList', listName: currentList })
        .then(d => setShopList(parseShopList(d), d.ts?.ts))
      if (useStore.getState().pendingMutations.length > 0) flushQueue()
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
    }).catch(() => {})
  }

  function loadShopList() {
    post({ action: 'getShopList', listName: currentList }).then(data => {
      if (!data.isLoggedIn) { setNotLoggedIn(); return }
      setShopList(parseShopList(data), data.ts?.ts)
    }).catch(() => {})
  }

  function loadMenu() {
    post({ action: 'getMenu' }).then(data => {
      if (!data.isLoggedIn) { setNotLoggedIn(); return }
      setMenu(parseMenu(data), data.ts?.ts)
    }).catch(() => {})
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
        {pendingMutations.length > 0 && (
          <span className="syncStatus">{pendingMutations.length} change{pendingMutations.length === 1 ? '' : 's'} pending sync</span>
        )}
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
