import { useRef, useState } from 'react'
import useStore, { DAYS } from '../../store/useStore'
import { post } from '../../api'
import RecipeGrid from '../RecipeGrid'

export default function AddMenuItemDialog({ onClose }) {
  const { addMenuItem } = useStore()
  const [currentDay, setCurrentDay] = useState(DAYS[0])
  const [picking, setPicking] = useState(false)
  const [recipes, setRecipes] = useState([])
  const [prefillName, setPrefillName] = useState('')
  const itemNameRef = useRef()

  function handlePickFromRecipes() {
    post({ action: 'getRecipes' }).then(data => setRecipes(data.recipes ?? []))
    setPicking(true)
  }

  function handleSelectRecipe(name) {
    setPrefillName(name)
    setPicking(false)
  }

  function handleAdd(close) {
    const name = itemNameRef.current.value.trim()
    if (!name) return
    const id = `menuItem_${name.replace(/[^a-zA-Z0-9]/g, '')}_${Date.now()}`
    const item = { id, name }
    addMenuItem(currentDay, item)
    post({ action: 'addMenuItem', itemId: id, itemName: name, weekDay: currentDay })
    if (close) {
      onClose()
    } else {
      itemNameRef.current.value = ''
      itemNameRef.current.focus()
      const nextIdx = Math.min(DAYS.indexOf(currentDay) + 1, DAYS.length - 1)
      setCurrentDay(DAYS[nextIdx])
    }
  }

  if (picking) {
    return (
      <div className="modalOverlay" onClick={onClose}>
        <div className="modal recipesModal" onClick={e => e.stopPropagation()}>
          <span className="close" onClick={onClose}>&times;</span>
          <h3>Select a Recipe</h3>
          <button type="button" onClick={() => setPicking(false)}>Back</button>
          <RecipeGrid
            recipes={recipes}
            queryMode
            onSelect={handleSelectRecipe}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="modalOverlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <span className="close" onClick={onClose}>&times;</span>
        <h3>Add Menu Item</h3>
        <form onSubmit={e => { e.preventDefault(); handleAdd(false) }}>
          <label>
            New Item:
            <input key={prefillName} ref={itemNameRef} type="text" defaultValue={prefillName} autoFocus autoComplete="off" />
          </label>
          <label>
            Day:
            <select value={currentDay} onChange={e => setCurrentDay(e.target.value)}>
              {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </label>
          <div className="actions">
            <button type="button" onClick={() => handleAdd(false)}>Add</button>
            <button type="button" onClick={() => handleAdd(true)}>Add and Close</button>
            <button type="button" onClick={handlePickFromRecipes}>Select from Recipes</button>
          </div>
        </form>
      </div>
    </div>
  )
}
