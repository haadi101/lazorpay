/**
 * Card Component
 * 
 * A glassmorphism-styled card container for grouping content.
 * Supports optional header, glow effects, and interactive states.
 */

import React from 'react';
import './Card.css';

// =============================================================================
// TYPES
// =============================================================================

interface CardProps {
    /** Card content */
    children: React.ReactNode;
    /** Optional title displayed in header */
    title?: string;
    /** Optional subtitle/description */
    subtitle?: string;
    /** Add glow effect on hover */
    glow?: boolean;
    /** Make card clickable */
    onClick?: () => void;
    /** Additional CSS classes */
    className?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function Card({
    children,
    title,
    subtitle,
    glow = false,
    onClick,
    className = '',
}: CardProps) {
    const classes = [
        'card',
        glow && 'card-glow',
        onClick && 'card-interactive',
        className,
    ].filter(Boolean).join(' ');

    return (
        <div
            className={classes}
            onClick={onClick}
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
        >
            {(title || subtitle) && (
                <div className="card-header">
                    {title && <h3 className="card-title">{title}</h3>}
                    {subtitle && <p className="card-subtitle">{subtitle}</p>}
                </div>
            )}
            <div className="card-content">
                {children}
            </div>
        </div>
    );
}
