import { useRef, useState } from 'react'
import useStore from '../../store/useStore'
import { post } from '../../api'

export default function AddListDialog({ onClose }) {
  const { listNames, addList } = useStore()
  const [error, setError] = useState('')
  const listNameRef = useRef()

  function handleAdd() {
    const name = listNameRef.current.value.trim()
    if (!name) return
    if (listNames.includes(name)) { setError(`The list "${name}" already exists`); return }
    if (name.includes(':')) { setError('List names cannot contain the character :'); return }
    addList(name)
    post({ action: 'addListName', listName: name })
    onClose()
  }

  return (
    <div className="modalOverlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <span className="close" onClick={onClose}>&times;</span>
        <h3>Add List</h3>
        {error && <div className="error">{error}</div>}
        <form onSubmit={e => { e.preventDefault(); handleAdd() }}>
          <label>
            New List:
            <input ref={listNameRef} type="text" autoFocus autoComplete="off" />
          </label>
          <div className="actions">
            <button type="button" onClick={handleAdd}>Add and Close</button>
          </div>
        </form>
      </div>
    </div>
  )
}
