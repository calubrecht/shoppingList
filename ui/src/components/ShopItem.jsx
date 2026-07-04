import useStore from '../store/useStore'
import { post } from '../api'

export default function ShopItem({ item, currentList, onAllDone }) {
  const { toggleItemDone, shopList } = useStore()

  function handleToggle() {
    toggleItemDone(item.id)
    post({ action: 'saveDoneState', listName: currentList, id: item.id, doneState: !item.done })
      .then((data) => {
        if (data?.ts?.ts) useStore.getState().setShopTs(data.ts.ts)
        const allDone = Object.values(shopList.aisles)
          .flatMap(a => a.items)
          .every(i => (i.id === item.id ? !item.done : i.done) || !i.enabled)
        if (allDone) onAllDone?.()
      })
  }

  return (
    <div className={`shopItem${item.done ? ' done' : ''}`}>
      <span className="itemCount">{item.count}</span>
      <button
        type="button"
        className="itemName"
        onClick={handleToggle}
        title={item.done ? 'Mark undone' : 'Mark done'}
      >
        {item.name}
      </button>
    </div>
  )
}
