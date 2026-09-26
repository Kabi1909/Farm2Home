import { useEffect, useRef, useState } from 'react';
import { Download } from 'lucide-react';
import { Modal } from '../common/UI';

export default function OrderDownloadModal({ orders, farmers, onClose }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const active = useRef(true);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);
  return (
    <Modal className="order-download-modal" title="Download your order details?" onClose={onClose}>
      <p>Your order has been placed. Would you like to save the details as a PDF?</p>
      {orders.length > 1 && <p>All {orders.length} farmer orders will be included in one PDF.</p>}
      {error && (
        <p className="error-text" role="alert">
          {error}
        </p>
      )}
      <div className="actions">
        <button type="button" className="btn secondary" onClick={onClose}>
          Not now
        </button>
        <button
          type="button"
          className="btn"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            setError('');
            try {
              const { downloadOrderPdf } = await import('../../services/orderPdf');
              if (!active.current) return;
              await downloadOrderPdf(orders, farmers);
              if (active.current) onClose();
            } catch {
              if (active.current)
                setError(
                  'The PDF could not be downloaded. Your order is still placed. Please try again.',
                );
            } finally {
              if (active.current) setBusy(false);
            }
          }}
        >
          <Download size={17} aria-hidden="true" />
          {busy ? 'Preparing PDF…' : 'Download PDF'}
        </button>
      </div>
    </Modal>
  );
}
