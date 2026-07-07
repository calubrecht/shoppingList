import { useRef, useState } from 'react'
import useStore from '../../store/useStore'
import { post } from '../../api'

export default function AddAisleDialog({ onClose }) {
  const { shopList, currentList, addAisle } = useStore()
  const [error, setError] = useState('')
  const aisleNameRef = useRef()

  function handleAdd(close) {
    const name = aisleNameRef.current.value.trim()
    if (!name) return
    if (shopList.aisleOrder.includes(name)) {
      setError('Please enter a unique aisle name')
      return
    }
    const id = `aisle_${name.replace(/[^a-zA-Z0-9]/g, '')}`
    addAisle(name, id)
    post({ action: 'addAisle', listName: currentList, aisleName: name, aisleId: id })
    if (close) {
      onClose()
    } else {
      aisleNameRef.current.value = ''
      aisleNameRef.current.focus()
      setError('')
    }
  }

  return (
    <div className="modalOverlay" onClick={onClose} onKeyDown={e => { if (e.key === 'Escape') onClose() }}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <span className="close" onClick={onClose}>&times;</span>
        <h3>Add Aisle</h3>
        {error && <div className="error">{error}</div>}
        <form onSubmit={e => { e.preventDefault(); handleAdd(false) }}>
          <label>
            New Aisle:
            <input ref={aisleNameRef} type="text" autoFocus autoComplete="off" />
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
