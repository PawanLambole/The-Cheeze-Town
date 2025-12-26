import React from 'react';
import { AlertCircle, CheckCircle, AlertTriangle, Info, X } from 'lucide-react';

type AlertType = 'error' | 'success' | 'warning' | 'info';

interface AlertProps {
  type: AlertType;
  title?: string;
  message: string;
  onClose?: () => void;
  dismissible?: boolean;
  className?: string;
}

const typeStyles = {
  error: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', icon: AlertCircle },
  success: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400', icon: CheckCircle },
  warning: { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400', icon: AlertTriangle },
  info: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', icon: Info },
};

export default function Alert({
  type,
  title,
  message,
  onClose,
  dismissible = false,
  className = '',
}: AlertProps) {
  const styles = typeStyles[type];
  const IconComponent = styles.icon;

  return (
    <div className={`${styles.bg} ${styles.border} border rounded-xl p-4 flex gap-3 ${className}`}>
      <IconComponent className={`w-5 h-5 flex-shrink-0 mt-0.5 ${styles.text}`} />
      <div className="flex-1">
        {title && <p className={`${styles.text} font-semibold mb-1`}>{title}</p>}
        <p className={`${styles.text} text-sm opacity-90`}>{message}</p>
      </div>
      {dismissible && onClose && (
        <button
          onClick={onClose}
          className={`flex-shrink-0 ${styles.text} hover:opacity-70 transition-opacity`}
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
