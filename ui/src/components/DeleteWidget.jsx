import { useState } from 'react'

export default function DeleteWidget({ onDelete }) {
  const [confirming, setConfirming] = useState(false)

  if (confirming) {
    return (
      <div className="deleteWidget">
        <span className="label">Are you sure?</span>
        <span className="button yes" onClick={() => { setConfirming(false); onDelete() }}>Y</span>
        <span className="button no" onClick={() => setConfirming(false)}>N</span>
      </div>
    )
  }

  return (
    <div className="deleteWidget">
      <span className="button delete" onClick={() => setConfirming(true)}>X</span>
    </div>
  )
}
