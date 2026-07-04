import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable'
import useStore, { DAYS } from '../store/useStore'
import { post } from '../api'
import WeekDay from './WeekDay'

export default function MenuTab({ onOpenAddMenuItem, onOpenPrint, onOpenRecipes, onReload }) {
  const { menu, deleteMenuItem, clearMenu, menuTs, setMenu } = useStore()

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function handleDragEnd({ active, over }) {
    if (!over || active.id === over.id) return

    let srcDay = null
    let dstDay = null
    for (const day of DAYS) {
      if (menu[day]?.some(i => i.id === active.id)) srcDay = day
      if (menu[day]?.some(i => i.id === over.id) || day === over.id) dstDay = day
    }
    if (!srcDay) return
    if (!dstDay) dstDay = srcDay

    let newMenu
    if (srcDay === dstDay) {
      const items = menu[srcDay]
      const oldIdx = items.findIndex(i => i.id === active.id)
      const newIdx = items.findIndex(i => i.id === over.id)
      newMenu = { ...menu, [srcDay]: arrayMove(items, oldIdx, newIdx) }
    } else {
      const movedItem = menu[srcDay].find(i => i.id === active.id)
      newMenu = {
        ...menu,
        [srcDay]: menu[srcDay].filter(i => i.id !== active.id),
        [dstDay]: [...menu[dstDay], movedItem],
      }
    }
    setMenu(newMenu)
    saveMenu(newMenu)
  }

  function saveMenu(menuData) {
    const list = DAYS.flatMap(day =>
      (menuData[day] ?? []).map(item => [item.id, item.name, day, 1, true, true]))
    post({ action: 'setMenu', list, ts: menuTs })
      .then(data => { if (data?.ts?.ts) useStore.getState().setMenuTs(data.ts.ts) })
  }

  function handleDeleteItem(day, id) {
    deleteMenuItem(day, id)
    const newMenu = { ...menu, [day]: menu[day].filter(i => i.id !== id) }
    saveMenu(newMenu)
  }

  function handleClearMenu() {
    clearMenu()
    post({ action: 'setMenu', list: [], ts: menuTs })
      .then(data => { if (data?.ts?.ts) useStore.getState().setMenuTs(data.ts.ts) })
  }

  const allItemIds = DAYS.flatMap(day => menu[day]?.map(i => i.id) ?? [])

  return (
    <div className="menuTab">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        {DAYS.map(day => (
          <WeekDay
            key={day}
            day={day}
            items={menu[day] ?? []}
            onDeleteItem={handleDeleteItem}
          />
        ))}
      </DndContext>
      <div className="buttonPane">
        <button onClick={onOpenAddMenuItem}>+</button>
        <button onClick={handleClearMenu}>Clear Menu</button>
        <button onClick={onOpenPrint}>Printable View</button>
        <button onClick={onOpenRecipes}>Show Recipes</button>
      </div>
    </div>
  )
}
