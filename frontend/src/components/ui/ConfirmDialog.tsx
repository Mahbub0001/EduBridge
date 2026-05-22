import Modal from './Modal';
import Button from './Button';
import { cn } from '../../lib/utils';

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
  loading?: boolean;
}

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'primary',
  loading = false,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{message}</p>
      <div className={cn('flex justify-end gap-3 mt-6')}>
        <Button variant="outline" size="sm" onClick={onClose} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button
          variant={variant === 'danger' ? 'danger' : 'primary'}
          size="sm"
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? 'Please wait…' : confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
