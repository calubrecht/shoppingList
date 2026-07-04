import { useEffect, useRef, useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import DeleteWidget from './DeleteWidget'

export default function RecipeCard({
  recipe, queryMode, selected, newRecipe,
  onSelect, onEdit, onAdd, onDelete, onCancelNew,
}) {
  const [editing, setEditing] = useState(newRecipe)
  const [draft, setDraft] = useState(recipe)
  const nameInputRef = useRef(null)
  const textareaRef = useRef(null)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: recipe.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  useEffect(() => {
    if (newRecipe) nameInputRef.current?.focus()
  }, [newRecipe])

  useEffect(() => {
    const ta = textareaRef.current
    if (ta && ta.style.height !== `${ta.scrollHeight}px`) {
      ta.style.height = '1px'
      ta.style.height = `${ta.scrollHeight}px`
    }
  })

  function startEdit() {
    setDraft(recipe)
    setEditing(true)
  }

  function cancelEdit() {
    if (newRecipe) {
      onCancelNew()
    } else {
      setEditing(false)
    }
  }

  function confirmEdit() {
    if (newRecipe) {
      if (!draft.name?.trim()) return
      onAdd(draft)
    } else {
      onEdit(draft)
      setEditing(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape') {
      e.stopPropagation()
      e.preventDefault()
      cancelEdit()
    }
  }

  function handleIngredientChange(field, index, value) {
    const current = draft[field] ?? []
    let next
    if (value.trim() === '') {
      if (index >= current.length) return
      next = current.filter((_, i) => i !== index)
    } else if (index >= current.length) {
      next = [...current, value]
    } else {
      next = current.map((v, i) => (i === index ? value : v))
    }
    setDraft({ ...draft, [field]: next })
  }

  if (!editing) {
    return (
      <div ref={setNodeRef} style={style} className="recipeCard">
        <div className="cardHeader">
          <span className="dragHandle" {...attributes} {...listeners}>⠿</span>
          <span className="cardTitle">{recipe.name}</span>
        </div>
        <div className="cardBody">
          {queryMode ? (
            <button type="button" className="selectBtn" onClick={() => onSelect(recipe.name)}>
              <img src={`/sl_icons/${selected ? 'check' : 'checkOff'}.png`} alt="Select" />
            </button>
          ) : (
            <>
              <DeleteWidget onDelete={() => onDelete(recipe.name)} />
              <button type="button" className="editBtn" onClick={startEdit}>
                <img src="/sl_icons/pencil.png" alt="Edit" />
              </button>
            </>
          )}
          <p className="recipeText">{recipe.text}</p>
          <ul>
            {(recipe.keyIngredients ?? []).map(ing => <li key={ing} className="keyIngredient">{ing}</li>)}
            {(recipe.commonIngredients ?? []).map(ing => <li key={ing} className="commonIngredient">{ing}</li>)}
          </ul>
        </div>
      </div>
    )
  }

  const keyIngredients = draft.keyIngredients ?? []
  const commonIngredients = draft.commonIngredients ?? []

  return (
    <div ref={setNodeRef} style={style} className="recipeCard editing" onKeyDown={handleKeyDown}>
      <div className="cardHeader">
        {newRecipe ? (
          <input
            ref={nameInputRef}
            className="cardTitle name"
            type="text"
            value={draft.name}
            onChange={e => setDraft({ ...draft, name: e.target.value })}
            placeholder="Recipe name"
          />
        ) : (
          <span className="cardTitle">{draft.name}</span>
        )}
      </div>
      <div className="cardBody">
        <textarea
          ref={textareaRef}
          className="description"
          value={draft.text ?? ''}
          onChange={e => setDraft({ ...draft, text: e.target.value })}
          placeholder="Enter a recipe description."
        />
        <ul>
          {[...keyIngredients, ''].map((ing, i) => (
            <li key={`key${i}`} className="keyIngredient">
              <input
                type="text"
                className="keyIngredients"
                value={ing}
                onChange={e => handleIngredientChange('keyIngredients', i, e.target.value)}
                placeholder={i === keyIngredients.length ? 'New ingredient' : undefined}
              />
            </li>
          ))}
          {[...commonIngredients, ''].map((ing, i) => (
            <li key={`common${i}`} className="commonIngredient">
              <input
                type="text"
                className="commonIngredients"
                value={ing}
                onChange={e => handleIngredientChange('commonIngredients', i, e.target.value)}
                placeholder={i === commonIngredients.length ? 'New ingredient' : undefined}
              />
            </li>
          ))}
        </ul>
        <div className="cardActions">
          <button type="button" className="cancelBtn" onClick={cancelEdit}>Cancel</button>
          <button type="button" className="confirmBtn" onClick={confirmEdit}>Save</button>
        </div>
      </div>
    </div>
  )
}
