import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import useStore from '../store/useStore'
import { post } from '../api'

export default function Item({ item, currentList }) {
  const { toggleItemEnabled, setItemCount, deleteItem } = useStore()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  function syncTs(data) {
    if (data?.ts?.ts) useStore.getState().setShopTs(data.ts.ts)
  }

  function handleCountChange(e) {
    const val = e.target.value
    if (/^\d+$/.test(val) && parseInt(val, 10) >= 0) {
      setItemCount(item.id, parseInt(val, 10))
      post({ action: 'saveCount', listName: currentList, id: item.id, count: val }).then(syncTs)
    } else {
      e.target.value = item.count
    }
  }

  function handleToggleEnabled() {
    toggleItemEnabled(item.id)
    post({ action: 'saveEnabledState', listName: currentList, id: item.id, enabledState: !item.enabled }).then(syncTs)
  }

  function handleDelete() {
    deleteItem(item.id)
    post({ action: 'deleteItem', itemId: item.id, listName: currentList }).then(syncTs)
  }

  return (
    <div ref={setNodeRef} style={style} className={`item${item.enabled ? '' : ' disabled'}`}>
      <span className="dragHandle" {...attributes} {...listeners}>⠿</span>
      <span className="itemName">{item.name}</span>
      <input
        key={item.count}
        type="number"
        className="itemCount"
        defaultValue={item.count}
        min="0"
        disabled={!item.enabled}
        onChange={handleCountChange}
      />
      <button className="toggleEnabled" onClick={handleToggleEnabled} title={item.enabled ? 'Disable' : 'Enable'}>
        {item.enabled ? '✓' : '○'}
      </button>
      <button className="deleteItem" onClick={handleDelete} title="Delete">✕</button>
    </div>
  )
}
