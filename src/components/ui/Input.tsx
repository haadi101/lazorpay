/**
 * Input Component
 * 
 * A styled input field with label, error states, and validation.
 */

import React from 'react';
import './Input.css';

// =============================================================================
// TYPES
// =============================================================================

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    /** Label text */
    label?: string;
    /** Error message */
    error?: string;
    /** Helper text below input */
    helperText?: string;
    /** Icon to show on the left */
    leftIcon?: React.ReactNode;
    /** Icon to show on the right */
    rightIcon?: React.ReactNode;
    /** Full width mode */
    fullWidth?: boolean;
}

// =============================================================================
// COMPONENT
// =============================================================================

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({
    label,
    error,
    helperText,
    leftIcon,
    rightIcon,
    fullWidth = true,
    className = '',
    id,
    ...props
}, ref) => {
    // Generate unique ID if not provided
    const inputId = id || `input-${Math.random().toString(36).slice(2, 9)}`;

    const wrapperClasses = [
        'input-wrapper',
        fullWidth && 'input-full',
        error && 'input-error',
        className,
    ].filter(Boolean).join(' ');

    return (
        <div className={wrapperClasses}>
            {label && (
                <label htmlFor={inputId} className="input-label">
                    {label}
                </label>
            )}
            <div className="input-container">
                {leftIcon && <span className="input-icon input-icon-left">{leftIcon}</span>}
                <input
                    ref={ref}
                    id={inputId}
                    className="input-field"
                    {...props}
                />
                {rightIcon && <span className="input-icon input-icon-right">{rightIcon}</span>}
            </div>
            {(error || helperText) && (
                <span className={`input-helper ${error ? 'input-helper-error' : ''}`}>
                    {error || helperText}
                </span>
            )}
        </div>
    );
});

Input.displayName = 'Input';
