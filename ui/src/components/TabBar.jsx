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
          <img className="logoutIcon" src="/sl_icons/logout.png" alt="Logout" />
        </button>
      )}
    </nav>
  )
}
