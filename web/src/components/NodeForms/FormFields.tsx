/**
 * Reusable form field components with consistent design language.
 */
import { type ReactNode, type CSSProperties } from 'react'
import { Input, Select, Switch } from 'antd'

// ─── FieldRow ─────────────────────────────────────────────────────────────────

interface FieldRowProps {
  label: string
  required?: boolean
  children: ReactNode
  hint?: string
  style?: CSSProperties
}

export function FieldRow({ label, required, children, hint, style }: FieldRowProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, ...style }}>
      <label
        style={{
          fontSize: 11,
          fontWeight: 500,
          color: 'var(--color-text-secondary)',
          display: 'flex',
          alignItems: 'center',
          gap: 3,
        }}
      >
        {label}
        {required && <span style={{ color: 'var(--color-error)', fontSize: 10 }}>*</span>}
      </label>
      {children}
      {hint && (
        <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{hint}</span>
      )}
    </div>
  )
}

// ─── FormInput ────────────────────────────────────────────────────────────────

interface FormInputProps {
  value: string
  onChange: (val: string) => void
  placeholder?: string
  mono?: boolean
  disabled?: boolean
}

export function FormInput({ value, onChange, placeholder, mono, disabled }: FormInputProps) {
  return (
    <Input
      size="small"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      style={{
        fontFamily: mono ? 'var(--font-mono)' : undefined,
        fontSize: 12,
        borderRadius: 6,
      }}
    />
  )
}

// ─── FormSelect ───────────────────────────────────────────────────────────────

interface FormSelectProps {
  value: string
  onChange: (val: string) => void
  options: { value: string; label: string }[]
  placeholder?: string
  allowClear?: boolean
}

export function FormSelect({ value, onChange, options, placeholder, allowClear }: FormSelectProps) {
  return (
    <Select
      size="small"
      value={value || undefined}
      onChange={(v) => onChange(v ?? '')}
      placeholder={placeholder}
      allowClear={allowClear}
      options={options}
      style={{ width: '100%', fontSize: 12 }}
      popupMatchSelectWidth={false}
    />
  )
}

// ─── FormSwitch ───────────────────────────────────────────────────────────────

interface FormSwitchProps {
  checked: boolean
  onChange: (val: boolean) => void
  label?: string
}

export function FormSwitch({ checked, onChange, label }: FormSwitchProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Switch
        size="small"
        checked={checked}
        onChange={onChange}
        style={{ background: checked ? 'var(--color-accent)' : undefined }}
      />
      {label && (
        <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{label}</span>
      )}
    </div>
  )
}
