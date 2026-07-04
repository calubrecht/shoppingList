import { useState } from 'react'
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import Item from './Item'

export default function Aisle({ aisleName, aisle, currentList, onRenameAisle }) {
  const [editValue, setEditValue] = useState('')
  const [editing, setEditing] = useState(false)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: aisleName })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  function startEditing() {
    setEditValue(aisleName)
    setEditing(true)
  }

  function commitRename() {
    const newName = editValue.trim()
    setEditing(false)
    if (newName && newName !== aisleName) {
      onRenameAisle(aisleName, newName)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') commitRename()
    if (e.key === 'Escape') setEditing(false)
  }

  const itemIds = aisle.items.map(i => i.id)

  return (
    <div ref={setNodeRef} style={style} className="aisle">
      <div className="aisleLabel" onDoubleClick={startEditing}>
        {!editing && (
          <span className="dragHandle" {...attributes} {...listeners}>⠿</span>
        )}
        {editing ? (
          <input
            autoFocus
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            onBlur={commitRename}
            onKeyDown={handleKeyDown}
            onClick={e => e.stopPropagation()}
          />
        ) : (
          <span className="aisleNameText">{aisleName}</span>
        )}
      </div>
      <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
        {aisle.items.map(item => (
          <Item key={item.id} item={item} currentList={currentList} />
        ))}
      </SortableContext>
    </div>
  )
}
