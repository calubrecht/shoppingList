import useStore from '../store/useStore'
import { post } from '../api'
import ShopItem from './ShopItem'

export default function ShopTab({ onOpenPrint, onReload }) {
  const { shopList, currentList } = useStore()
  const { aisleOrder, aisles } = shopList

  function handleReset() {
    post({ action: 'resetDoneState', listName: currentList }).then(onReload)
  }

  function playFinishSound() {
    if (useStore.getState().settings.playAudio) {
      const audio = document.getElementById('FinishSound')
      audio?.play()
    }
  }

  return (
    <div className="shopTab">
      {aisleOrder.map(name => {
        const enabledItems = aisles[name].items.filter(i => i.enabled)
        if (enabledItems.length === 0) return null
        return (
          <div key={name} className="aisle">
            <div className="aisleLabel">{name}</div>
            {enabledItems.map(item => (
              <ShopItem
                key={item.id}
                item={item}
                currentList={currentList}
                onAllDone={playFinishSound}
              />
            ))}
          </div>
        )
      })}
      <div className="buttonPane">
        <button onClick={handleReset}>Reset</button>
        <button onClick={onOpenPrint}>Printable View</button>
      </div>
    </div>
  )
}
