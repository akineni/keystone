import { IconX } from '../lib/icons.jsx';

export default function Modal({ open, onClose, title, children, maxWidth = 440, danger = false, className = '' }) {
  return (
    <div className={`modal-backdrop${open ? ' open' : ''}`} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div className={`modal${danger ? ' danger' : ''}${className ? ' ' + className : ''}`} style={{ maxWidth }}>
        {title !== undefined && (
          <div className="modal-head">
            <h3>{title}</h3>
            <button className="modal-close" type="button" onClick={onClose} aria-label="Close">
              <IconX width="16" height="16" />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
