import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import useStore from '../store/useStore'
import { post } from '../api'

export default function MenuItem({ item, day, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="menuItem">
      <span className="dragHandle" {...attributes} {...listeners}>⠿</span>
      <span className="itemName">{item.name}</span>
      <button className="deleteItem" onClick={() => onDelete(day, item.id)} title="Delete">✕</button>
    </div>
  )
}
