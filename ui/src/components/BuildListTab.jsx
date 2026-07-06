import { useEffect, useRef, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import useStore from '../store/useStore'
import { post } from '../api'
import { parseShopList } from '../parsers'
import Aisle from './Aisle'

function ItemPreview({ item }) {
  return (
    <div className={`item${item.enabled ? '' : ' disabled'}`}>
      <span className="dragHandle">⠿</span>
      <span className="itemName">{item.name}</span>
      <input type="number" className="itemCount" defaultValue={item.count} min="0" disabled={!item.enabled} readOnly />
      <button className="toggleEnabled" title={item.enabled ? 'Disable' : 'Enable'}>{item.enabled ? '✓' : '○'}</button>
      <button className="deleteItem" title="Delete">✕</button>
    </div>
  )
}

function AislePreview({ aisleName, aisle }) {
  return (
    <div className="aisle">
      <div className="aisleLabel">
        <span className="dragHandle">⠿</span>
        <span className="aisleNameText">{aisleName}</span>
      </div>
      {aisle.items.map(item => <ItemPreview key={item.id} item={item} />)}
    </div>
  )
}

export default function BuildListTab({ onOpenAddItem, onOpenAddAisle, onReload, dialogOpen }) {
  const {
    shopList, currentList, listNames,
    setCurrentList, setShopList, setShopListOrder, renameAisle, removeAisle, shopTs,
  } = useStore()
  const [activeId, setActiveId] = useState(null)
  const containerRef = useRef(null)

  // Re-focus so Ctrl-A/Ctrl-L keep working once a dialog opened from here closes.
  useEffect(() => {
    if (!dialogOpen) containerRef.current?.focus()
  }, [dialogOpen])

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

    const { aisleOrder, aisles } = shopList
    const isAisle = aisleOrder.includes(active.id)

    if (isAisle) {
      const oldIdx = aisleOrder.indexOf(active.id)
      const newIdx = aisleOrder.indexOf(over.id)
      const newOrder = arrayMove(aisleOrder, oldIdx, newIdx)
      const newAislesItems = Object.fromEntries(newOrder.map(n => [n, aisles[n].items]))
      setShopListOrder(newOrder, newAislesItems)
      saveListOrder(newOrder, newAislesItems)
    } else {
      // Item drag — find source aisle and destination aisle or item
      let srcAisle = null
      let dstAisle = null
      for (const name of aisleOrder) {
        if (aisles[name].items.some(i => i.id === active.id)) srcAisle = name
        if (aisles[name].items.some(i => i.id === over.id) || name === over.id) dstAisle = name
      }
      if (!srcAisle) return
      if (!dstAisle) dstAisle = srcAisle

      if (srcAisle === dstAisle) {
        const items = aisles[srcAisle].items
        const oldIdx = items.findIndex(i => i.id === active.id)
        const newIdx = items.findIndex(i => i.id === over.id)
        const newItems = arrayMove(items, oldIdx, newIdx)
        const newAislesItems = Object.fromEntries(aisleOrder.map(n =>
          [n, n === srcAisle ? newItems : aisles[n].items]))
        setShopListOrder(aisleOrder, newAislesItems)
        saveListOrder(aisleOrder, newAislesItems)
      } else {
        const movedItem = aisles[srcAisle].items.find(i => i.id === active.id)
        const newAislesItems = Object.fromEntries(aisleOrder.map(n => {
          if (n === srcAisle) return [n, aisles[n].items.filter(i => i.id !== active.id)]
          if (n === dstAisle) return [n, [...aisles[n].items, { ...movedItem, aisle: dstAisle }]]
          return [n, aisles[n].items]
        }))
        setShopListOrder(aisleOrder, newAislesItems)
        saveListOrder(aisleOrder, newAislesItems)
      }
    }
  }

  function saveListOrder(aisleOrder, aislesItems) {
    const list = []
    for (const aisleName of aisleOrder) {
      for (const item of aislesItems[aisleName] ?? []) {
        list.push([item.id, item.name, aisleName, item.count, item.enabled, item.done])
      }
    }
    post({ action: 'setShopList', listName: currentList, list, aisleOrder, ts: shopTs })
      .then(data => { if (data?.ts?.ts) useStore.getState().setShopTs(data.ts.ts) })
  }

  function handleRenameAisle(oldName, newName) {
    renameAisle(oldName, newName)
    post({ action: 'renameAisle', listName: currentList, oldName, newName })
  }

  function handleRemoveAisle(aisleName) {
    removeAisle(aisleName)
    post({ action: 'removeAisle', listName: currentList, aisleName })
  }

  function handleListChange(e) {
    const name = e.target.value
    setCurrentList(name)
    post({ action: 'getShopList', listName: name }).then(data => {
      setShopList(parseShopList(data), data.ts?.ts)
    })
  }

  function handleSave() {
    const { aisleOrder, aisles } = shopList
    saveListOrder(aisleOrder, Object.fromEntries(aisleOrder.map(n => [n, aisles[n].items])))
  }

  function handleRevert() {
    post({ action: 'revertWorkingList', ts: shopTs, listName: currentList }).then(onReload)
  }

  function handleKeyDown(e) {
    if (!e.ctrlKey) return
    if (e.key === 'a') {
      e.preventDefault()
      onOpenAddItem()
    } else if (e.key === 'l') {
      e.preventDefault()
      onOpenAddAisle()
    }
  }

  const { aisleOrder, aisles } = shopList

  const activeAisle = activeId != null && aisleOrder.includes(activeId) ? activeId : null
  const activeItem = activeAisle == null && activeId != null
    ? aisleOrder.flatMap(name => aisles[name]?.items ?? []).find(i => i.id === activeId)
    : null

  return (
    <div className="buildListTab" ref={containerRef} tabIndex={0} onKeyDown={handleKeyDown}>
      {listNames.length > 1 && (
        <select value={currentList} onChange={handleListChange}>
          {listNames.map(n => <option key={n} value={n}>{n}</option>)}
        </select>
      )}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <SortableContext items={aisleOrder} strategy={verticalListSortingStrategy}>
          <div id="aisleSorter">
            {aisleOrder.map(name => (
              <Aisle
                key={name}
                aisleName={name}
                aisle={aisles[name]}
                currentList={currentList}
                onRenameAisle={handleRenameAisle}
                onRemoveAisle={handleRemoveAisle}
              />
            ))}
          </div>
        </SortableContext>
        <DragOverlay>
          {activeAisle && <AislePreview aisleName={activeAisle} aisle={aisles[activeAisle]} />}
          {activeItem && <ItemPreview item={activeItem} />}
        </DragOverlay>
      </DndContext>
      <div className="buttonPane">
        <button onClick={handleSave}>Save</button>
        <button onClick={handleRevert}>Revert</button>
      </div>
      <div className="floatingButtons">
        <button onClick={onOpenAddItem} title="Add Item (Ctrl+A)">Add Item</button>
        <button onClick={onOpenAddAisle} title="Add Aisle (Ctrl+L)">Add Aisle</button>
      </div>
    </div>
  )
}
