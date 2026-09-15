import Modal from './Modal.jsx';
import Button from './Button.jsx';
import { IconAlert } from '../lib/icons.jsx';

export default function ConfirmModal({ open, onClose, title, body, confirmLabel = 'Confirm', onConfirm, loading }) {
  return (
    <Modal open={open} onClose={onClose} maxWidth={380} danger>
      <div className="modal-icon">
        <IconAlert />
      </div>
      <h3 style={{ marginBottom: 8 }}>{title}</h3>
      <p className="text-muted" style={{ fontSize: 13.5, marginBottom: 0 }}>
        {body}
      </p>
      <div className="modal-actions">
        <Button variant="secondary" type="button" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="danger" type="button" loading={loading} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
