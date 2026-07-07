export default function AboutDialog({ onClose }) {
  return (
    <div className="modalOverlay" onClick={onClose}>
      <div className="modal aboutDialog" onClick={e => e.stopPropagation()}>
        <span className="close" onClick={onClose}>&times;</span>
        <h1>Your Shopping List</h1>
        <p>A simple app for managing your shopping lists.</p>
        <p>Copyright: Chad Lubrecht 2026</p>
      </div>
    </div>
  )
}
