import { DAYS } from '../../store/useStore'

export default function PrintView({ shopList, menu, activeTab, onClose }) {
  function handleKeyDown(e) {
    if (e.key === 'Escape') onClose()
  }

  return (
    <div className="modalOverlay" onClick={onClose}>
      <div className="modal printView" onClick={e => e.stopPropagation()} onKeyDown={handleKeyDown} tabIndex={0}>
        <span className="close" onClick={onClose}>&times;</span>
        <div className="printContent">
          {activeTab === 'menu' ? (
            DAYS.map(day => {
              const items = menu[day] ?? []
              if (items.length === 0) return null
              return (
                <div key={day} className="printAisle">
                  <div className="printAisleLabel">{day}</div>
                  {items.map(item => (
                    <div key={item.id} className="printItem">{item.name}</div>
                  ))}
                </div>
              )
            })
          ) : (
            shopList.aisleOrder.map(aisleName => {
              const items = shopList.aisles[aisleName]?.items.filter(i => i.enabled) ?? []
              if (items.length === 0) return null
              return (
                <div key={aisleName} className="printAisle">
                  <div className="printAisleLabel">{aisleName}</div>
                  {items.map(item => (
                    <div key={item.id} className="printItem">{item.count} {item.name}</div>
                  ))}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
