import { useRef, useState } from 'react'
import useStore from '../../store/useStore'
import { post } from '../../api'

export default function AddItemDialog({ onClose }) {
  const { shopList, currentList, addItemToAisle } = useStore()
  const { aisleOrder } = shopList
  const [lastAisle, setLastAisle] = useState(aisleOrder[0] ?? '')
  const itemNameRef = useRef()
  const aisleRef = useRef()

  function handleAdd(close) {
    const name = itemNameRef.current.value.trim()
    const aisle = aisleRef.current.value
    if (!name || !aisle) return

    const id = `id_${name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 20)}_${Date.now()}`
    const item = { id, name, count: 1, enabled: true, done: false, aisle }
    addItemToAisle(aisle, item)
    setLastAisle(aisle)
    post({ action: 'addItem', listName: currentList, itemId: id, itemName: name, aisleName: aisle, order: 0 })
      .then(data => { if (data?.ts?.ts) useStore.getState().setShopTs(data.ts.ts) })

    if (close) {
      onClose()
    } else {
      itemNameRef.current.value = ''
      itemNameRef.current.focus()
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape') onClose()
    if (e.key === 'Enter') handleAdd(false)
  }

  return (
    <div className="modalOverlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <span className="close" onClick={onClose}>&times;</span>
        <h3>Add Item</h3>
        <form onSubmit={e => { e.preventDefault(); handleAdd(false) }}>
          <label>
            New Item:
            <input
              ref={itemNameRef}
              type="text"
              autoFocus
              autoComplete="off"
              onKeyDown={handleKeyDown}
            />
          </label>
          <label>
            Aisle:
            <select ref={aisleRef} defaultValue={lastAisle}>
              {aisleOrder.map(name => <option key={name} value={name}>{name}</option>)}
            </select>
          </label>
          <div className="actions">
            <button type="button" onClick={() => handleAdd(false)}>Add</button>
            <button type="button" onClick={() => handleAdd(true)}>Add and Close</button>
          </div>
        </form>
      </div>
    </div>
  )
}
