import { useRef } from 'react'
import useStore from '../store/useStore'
import { post } from '../api'

export default function SettingsTab({ onOpenAddList }) {
  const { listNames, currentList, settings, setSetting, removeList, setError } = useStore()
  const listBoxRef = useRef()

  function handleToggleAudio(e) {
    const val = e.target.checked
    setSetting('playAudio', val)
    post({ action: 'setUserSetting', setting: 'playAudio', settingValue: String(val) })
  }

  function handleRemoveSelected() {
    const selected = Array.from(listBoxRef.current.selectedOptions).map(o => o.value)
    for (const name of selected) {
      if (name === currentList) { setError('Cannot remove the currently selected list'); return }
      if (name === 'Default') { setError('Cannot remove the Default list'); return }
      removeList(name)
      post({ action: 'removeListName', listName: name })
    }
  }

  return (
    <div className="settingsTab">
      <div className="settingRow">
        <label>
          Enable Sounds:
          <input
            type="checkbox"
            checked={settings.playAudio ?? true}
            onChange={handleToggleAudio}
          />
        </label>
      </div>
      <div className="settingRow">
        <label>Available Lists</label>
        <div className="listNamesWidget">
          <select ref={listBoxRef} multiple size={10}>
            {listNames.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <div className="buttons">
            <button onClick={onOpenAddList}>Add List</button>
            <button onClick={handleRemoveSelected}>Remove List</button>
          </div>
        </div>
      </div>
    </div>
  )
}
