// =============================================================
//  GBEducation — Componentes comuns
// =============================================================

import { type ReactNode, type InputHTMLAttributes } from 'react'
import { useToast, type ToastType } from '../../contexts/ToastContext'

// ─── Button ──────────────────────────────────────────────────

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  isLoading?: boolean
  children: ReactNode
}

const variantClass: Record<ButtonVariant, string> = {
  primary:   'btn-primary',
  secondary: 'btn-secondary',
  danger:    'btn-danger',
  ghost:     'btn-ghost',
}

export function Button({
  variant = 'primary',
  isLoading,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`${variantClass[variant]} flex items-center justify-center gap-2 ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      )}
      {children}
    </button>
  )
}

// ─── Input ───────────────────────────────────────────────────

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: ReactNode
}

export function Input({ label, error, icon, className = '', id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="w-full">
      {label && <label htmlFor={inputId} className="label-base">{label}</label>}
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
            {icon}
          </span>
        )}
        <input
          id={inputId}
          className={`input-base ${icon ? 'pl-10' : ''} ${error ? 'border-red-500 focus:ring-red-500' : ''} ${className}`}
          {...props}
        />
      </div>
      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
    </div>
  )
}

// ─── Select ──────────────────────────────────────────────────

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  children: ReactNode
}

export function Select({ label, error, children, className = '', id, ...props }: SelectProps) {
  const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="w-full">
      {label && <label htmlFor={selectId} className="label-base">{label}</label>}
      <select
        id={selectId}
        className={`input-base ${error ? 'border-red-500' : ''} ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
    </div>
  )
}

// ─── Modal ───────────────────────────────────────────────────

interface ModalProps {
  title: string
  children: ReactNode
  onConfirm?: () => void
  onCancel: () => void
  confirmLabel?: string
  confirmVariant?: ButtonVariant
  isLoading?: boolean
}

export function Modal({
  title, children, onConfirm, onCancel,
  confirmLabel = 'Confirmar', confirmVariant = 'primary', isLoading,
}: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative card p-6 w-full max-w-md shadow-glow-lg animate-slide-up">
        <h2 className="font-display text-lg font-semibold text-white mb-4">{title}</h2>
        <div className="text-slate-300 text-sm mb-6">{children}</div>
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={onCancel} disabled={isLoading}>Cancelar</Button>
          {onConfirm && (
            <Button variant={confirmVariant} onClick={onConfirm} isLoading={isLoading}>
              {confirmLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Toast Container ─────────────────────────────────────────

const toastStyles: Record<ToastType, string> = {
  success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
  error:   'bg-red-500/10 border-red-500/30 text-red-300',
  warning: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
}

const toastIcons: Record<ToastType, string> = {
  success: '✓',
  error:   '✕',
  warning: '⚠',
}

export function ToastContainer() {
  const { toasts, dismiss } = useToast()

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          onClick={() => dismiss(t.id)}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl border
            text-sm font-medium shadow-lg cursor-pointer pointer-events-auto
            animate-slide-up backdrop-blur-sm ${toastStyles[t.type]}`}
        >
          <span className="text-base font-bold">{toastIcons[t.type]}</span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Skeleton ────────────────────────────────────────────────

interface SkeletonProps { className?: string }

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-surface-muted/50 rounded-lg ${className}`}
    />
  )
}

export function SkeletonCard() {
  return (
    <div className="card p-5 space-y-3">
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-4/5" />
    </div>
  )
}
