export default function ConfirmDialog({ title, message, confirmLabel, busy, onConfirm, onClose }) {
  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="confirm-title">{title}</h2>
        <p>{message}</p>
        <div className="button-row">
          <button className="btn btn-secondary" type="button" onClick={onClose} disabled={busy}>
            Go back
          </button>
          <button className="btn btn-primary" type="button" onClick={onConfirm} disabled={busy}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
