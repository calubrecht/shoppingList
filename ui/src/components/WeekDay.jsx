import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import MenuItem from './MenuItem'

function EmptyDayDropZone({ day }) {
  const { setNodeRef, isOver } = useDroppable({ id: day })
  return <div ref={setNodeRef} className={`emptyDayDropZone${isOver ? ' isOver' : ''}`} />
}

export default function WeekDay({ day, items, onDeleteItem }) {
  const itemIds = items.map(i => i.id)

  return (
    <div className="weekDay">
      <div className="dayLabel">{day}</div>
      <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
        {items.length === 0
          ? <EmptyDayDropZone day={day} />
          : items.map(item => (
              <MenuItem key={item.id} item={item} day={day} onDelete={onDeleteItem} />
            ))}
      </SortableContext>
    </div>
  )
}
