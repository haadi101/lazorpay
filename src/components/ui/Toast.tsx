/**
 * Toast Component
 * 
 * A notification toast for displaying success, error, and info messages.
 * Includes auto-dismiss and manual close functionality.
 */

import { useEffect, useState } from 'react';
import './Toast.css';

// =============================================================================
// TYPES
// =============================================================================

export interface ToastProps {
    /** Toast content */
    message: string;
    /** Toast type for styling */
    type?: 'success' | 'error' | 'info' | 'warning';
    /** Auto-dismiss duration in ms (0 = no auto-dismiss) */
    duration?: number;
    /** Callback when toast is dismissed */
    onClose?: () => void;
    /** Optional action button */
    action?: {
        label: string;
        onClick: () => void;
    };
}

// =============================================================================
// ICONS
// =============================================================================

const icons = {
    success: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="m9 12 2 2 4-4" />
        </svg>
    ),
    error: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="m15 9-6 6M9 9l6 6" />
        </svg>
    ),
    info: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4M12 8h.01" />
        </svg>
    ),
    warning: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
            <path d="M12 9v4M12 17h.01" />
        </svg>
    ),
};

// =============================================================================
// COMPONENT
// =============================================================================

export function Toast({
    message,
    type = 'info',
    duration = 5000,
    onClose,
    action,
}: ToastProps) {
    const [isVisible, setIsVisible] = useState(true);
    const [isExiting, setIsExiting] = useState(false);

    // Auto-dismiss
    useEffect(() => {
        if (duration > 0) {
            const timer = setTimeout(() => {
                handleClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [duration]);

    const handleClose = () => {
        setIsExiting(true);
        setTimeout(() => {
            setIsVisible(false);
            onClose?.();
        }, 200); // Match animation duration
    };

    if (!isVisible) return null;

    return (
        <div
            className={`toast toast-${type} ${isExiting ? 'toast-exit' : ''}`}
            role="alert"
        >
            <span className="toast-icon">{icons[type]}</span>
            <span className="toast-message">{message}</span>
            {action && (
                <button className="toast-action" onClick={action.onClick}>
                    {action.label}
                </button>
            )}
            <button className="toast-close" onClick={handleClose} aria-label="Close">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6 6 18M6 6l12 12" />
                </svg>
            </button>
        </div>
    );
}

// =============================================================================
// TOAST CONTAINER (for multiple toasts)
// =============================================================================

interface ToastData extends ToastProps {
    id: string;
}

interface ToastContainerProps {
    toasts: ToastData[];
    onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
    return (
        <div className="toast-container">
            {toasts.map((toast) => (
                <Toast
                    key={toast.id}
                    {...toast}
                    onClose={() => onRemove(toast.id)}
                />
            ))}
        </div>
    );
}
