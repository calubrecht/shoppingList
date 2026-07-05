import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import MenuItem from './MenuItem'

export default function WeekDay({ day, items, onDeleteItem }) {
  const itemIds = items.map(i => i.id)

  return (
    <div className="weekDay">
      <div className="dayLabel">{day}</div>
      <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
        {items.map(item => (
          <MenuItem key={item.id} item={item} day={day} onDelete={onDeleteItem} />
        ))}
      </SortableContext>
    </div>
  )
}
