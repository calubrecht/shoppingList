import { useState } from 'react'
import {
  DndContext,
  DragOverlay,
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

function MenuItemPreview({ item }) {
  return (
    <div className="menuItem">
      <span className="dragHandle">⠿</span>
      <span className="itemName">{item.name}</span>
      <button className="deleteItem" title="Delete">✕</button>
    </div>
  )
}

export default function MenuTab({ onOpenAddMenuItem, onOpenPrint, onOpenRecipes, onReload }) {
  const { menu, deleteMenuItem, clearMenu, menuTs, setMenu } = useStore()
  const [activeId, setActiveId] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function handleDragStart({ active }) {
    setActiveId(active.id)
  }

  function handleDragEnd({ active, over }) {
    setActiveId(null)
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
  const activeItem = activeId != null
    ? DAYS.flatMap(day => menu[day] ?? []).find(i => i.id === activeId)
    : null

  return (
    <div className="menuTab">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        {DAYS.map(day => (
          <WeekDay
            key={day}
            day={day}
            items={menu[day] ?? []}
            onDeleteItem={handleDeleteItem}
          />
        ))}
        <DragOverlay>
          {activeItem && <MenuItemPreview item={activeItem} />}
        </DragOverlay>
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
