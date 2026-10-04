import { AlertTriangle, X } from 'lucide-react';

/**
 * Props:
 *   open        — boolean
 *   title       — string
 *   message     — string
 *   confirmLabel — string (default "Confirm")
 *   danger      — boolean (red confirm btn vs indigo)
 *   onConfirm   — () => void
 *   onCancel    — () => void
 *   loading     — boolean
 */
const ConfirmModal = ({
  open,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  danger = false,
  onConfirm,
  onCancel,
  loading = false,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-fade-in">
        {/* Close */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon + Title */}
        <div className="flex items-start gap-4 mb-4">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
              danger ? 'bg-red-50' : 'bg-amber-50'
            }`}
          >
            <AlertTriangle
              className={`w-5 h-5 ${danger ? 'text-red-500' : 'text-amber-500'}`}
            />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{title}</h3>
            {message && (
              <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                {message}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition disabled:opacity-60 ${
              danger
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {loading ? 'Processing…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
