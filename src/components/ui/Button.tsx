/**
 * Button Component
 * 
 * A versatile button component with multiple variants and states.
 * Supports loading states, icons, and full-width mode.
 */

import React from 'react';
import './Button.css';

// =============================================================================
// TYPES
// =============================================================================

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    /** Visual style variant */
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    /** Size of the button */
    size?: 'sm' | 'md' | 'lg';
    /** Show loading spinner */
    isLoading?: boolean;
    /** Make button full width */
    fullWidth?: boolean;
    /** Icon to show before text */
    leftIcon?: React.ReactNode;
    /** Icon to show after text */
    rightIcon?: React.ReactNode;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function Button({
    children,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    fullWidth = false,
    leftIcon,
    rightIcon,
    disabled,
    className = '',
    ...props
}: ButtonProps) {
    const classes = [
        'btn',
        `btn-${variant}`,
        `btn-${size}`,
        fullWidth && 'btn-full',
        isLoading && 'btn-loading',
        className,
    ].filter(Boolean).join(' ');

    return (
        <button
            className={classes}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading && (
                <span className="btn-spinner" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" opacity="0.25" />
                        <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
                    </svg>
                </span>
            )}
            {!isLoading && leftIcon && <span className="btn-icon-left">{leftIcon}</span>}
            <span className="btn-text">{children}</span>
            {!isLoading && rightIcon && <span className="btn-icon-right">{rightIcon}</span>}
        </button>
    );
}
