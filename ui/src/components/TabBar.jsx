export default function TabBar({ activeTab, isLoggedIn, onTabChange, onLogout }) {
  const loggedOutTabs = [
    { id: 'login', label: 'Login' },
    { id: 'register', label: 'Register' },
  ]
  const loggedInTabs = [
    { id: 'buildList', label: 'Build List' },
    { id: 'shop', label: 'Shop' },
    { id: 'menu', label: 'Menu' },
    { id: 'settings', label: 'Settings' },
  ]
  const tabs = isLoggedIn ? loggedInTabs : loggedOutTabs

  return (
    <nav className="navBar">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`tab${activeTab === tab.id ? ' active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
      {isLoggedIn && (
        <button className="logoutButton" onClick={onLogout} title="Logout">
          <span className="logoutLabel">Logout</span>
          <svg className="logoutIcon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </button>
      )}
    </nav>
  )
}
