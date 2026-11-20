/**
 * 17A UX P2 — Botón único de ORBI.
 *
 * Cuatro variantes y dos tamaños en lugar de las 37 combinaciones que había:
 *  - primary:   acción principal de la pantalla (una por vista)
 *  - secondary: acciones de apoyo
 *  - danger:    acciones que borran, rechazan o anulan
 *  - ghost:     acciones discretas dentro de tarjetas
 * Tamaño "md" (por defecto) mide 44 px de alto: usable con guantes en terreno.
 * "sm" (36 px) solo para tablas densas en PC.
 */
import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type ButtonSize = 'md' | 'sm';

const base =
  'inline-flex items-center justify-center gap-2 rounded-[var(--radius-control)] font-semibold transition-colors ' +
  'disabled:opacity-50 disabled:cursor-not-allowed select-none';

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-accent-strong text-slate-950 hover:bg-accent',
  secondary: 'bg-surface-raised text-ink border border-line hover:border-slate-600',
  danger: 'bg-danger/15 text-danger border border-danger/40 hover:bg-danger hover:text-slate-950',
  ghost: 'text-ink-muted hover:text-ink hover:bg-surface-raised',
};

const sizes: Record<ButtonSize, string> = {
  md: 'min-h-11 px-4 text-sm',
  sm: 'min-h-9 px-3 text-xs',
};

export function buttonClass(variant: ButtonVariant = 'secondary', size: ButtonSize = 'md', extra = '') {
  return `${base} ${variants[variant]} ${sizes[size]} ${extra}`.trim();
}

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Ícono Lucide a la izquierda del texto. */
  icon?: React.ReactNode;
  fullWidth?: boolean;
};

export default function Button({ variant = 'secondary', size = 'md', icon, fullWidth, className = '', type = 'button', children, ...rest }: Props) {
  return (
    <button type={type} className={buttonClass(variant, size, `${fullWidth ? 'w-full' : ''} ${className}`)} {...rest}>
      {icon && <span aria-hidden="true" className="shrink-0 [&>svg]:h-4 [&>svg]:w-4">{icon}</span>}
      {children}
    </button>
  );
}
