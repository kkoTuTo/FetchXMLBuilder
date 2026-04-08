import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Switch, Select, Input } from 'antd'
import { useFxbStore } from '@/store/index.ts'
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '@/i18n/index.ts'
import i18n from '@/i18n/index.ts'

function SectionTitle({ title }: { title: string }) {
  return (
    <div
      style={{
        fontSize: 10,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        color: 'var(--color-text-muted)',
        paddingBottom: 8,
        borderBottom: '1px solid var(--color-border)',
        marginBottom: 12,
      }}
    >
      {title}
    </div>
  )
}

interface SettingRowProps {
  label: string
  hint?: string
  children: ReactNode
}

function SettingRow({ label, hint, children }: SettingRowProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 0',
        borderBottom: '1px solid var(--color-border)',
        gap: 12,
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, color: 'var(--color-text)', fontWeight: 500 }}>{label}</div>
        {hint && <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>{hint}</div>}
      </div>
      {children}
    </div>
  )
}

export function SettingsPanel() {
  const { t } = useTranslation()
  const { settings, updateSettings } = useFxbStore()

  const langOptions = Object.entries(SUPPORTED_LANGUAGES).map(([value, label]) => ({ value, label }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 20, overflowY: 'auto' }}>
      {/* App info */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '16px 20px',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.12))',
          borderRadius: 14,
          border: '1px solid rgba(99,102,241,0.2)',
          marginBottom: 24,
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            fontWeight: 700,
            color: '#fff',
            flexShrink: 0,
          }}
        >
          FX
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)' }}>FetchXML Builder Web</div>
          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>
            v1.0.0-alpha · Phase 1 (Frontend)
          </div>
        </div>
      </div>

      {/* Appearance */}
      <SectionTitle title={t('settings.theme')} />
      <SettingRow label={t('settings.theme')}>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['light', 'dark'] as const).map((th) => (
            <button
              key={th}
              onClick={() => updateSettings({ theme: th })}
              style={{
                padding: '5px 14px',
                borderRadius: 8,
                border: settings.theme === th ? '2px solid var(--color-accent)' : '1px solid var(--color-border)',
                background: settings.theme === th ? 'var(--color-accent-subtle)' : 'transparent',
                color: settings.theme === th ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: settings.theme === th ? 600 : 400,
                fontFamily: 'var(--font-sans)',
                transition: 'all var(--transition)',
              }}
            >
              {th === 'light' ? `☀ ${t('settings.themeLight')}` : `🌙 ${t('settings.themeDark')}`}
            </button>
          ))}
        </div>
      </SettingRow>

      <div style={{ marginTop: 24 }}>
        <SectionTitle title={t('settings.language')} />
        <SettingRow label={t('settings.language')}>
          <Select
            value={settings.language}
            onChange={(v) => {
              updateSettings({ language: v })
              void i18n.changeLanguage(v as SupportedLanguage)
            }}
            options={langOptions}
            size="small"
            style={{ width: 120 }}
          />
        </SettingRow>
      </div>

      <div style={{ marginTop: 24 }}>
        <SectionTitle title="Display" />
        <SettingRow
          label={t('settings.showNodeType')}
          hint="Show node type prefix in the query tree"
        >
          <Switch
            size="small"
            checked={settings.showNodeType}
            onChange={(v) => updateSettings({ showNodeType: v })}
          />
        </SettingRow>
        <SettingRow
          label={t('settings.showValidation')}
          hint="Show error/warning icons on tree nodes"
        >
          <Switch
            size="small"
            checked={settings.showValidation}
            onChange={(v) => updateSettings({ showValidation: v })}
          />
        </SettingRow>
      </div>

      <div style={{ marginTop: 24 }}>
        <SectionTitle title="Dataverse Connection" />
        <SettingRow label={t('auth.orgUrl')}>
          <Input
            size="small"
            value={settings.orgUrl}
            onChange={(e) => updateSettings({ orgUrl: e.target.value })}
            placeholder={t('auth.orgUrlPlaceholder')}
            style={{
              width: 240,
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
            }}
          />
        </SettingRow>
      </div>

      <div
        style={{
          marginTop: 24,
          padding: '12px 16px',
          background: 'var(--color-surface)',
          borderRadius: 10,
          border: '1px solid var(--color-border)',
          fontSize: 11,
          color: 'var(--color-text-muted)',
          lineHeight: 1.8,
        }}
      >
        <div style={{ marginBottom: 4, fontWeight: 600, color: 'var(--color-text-secondary)' }}>About</div>
        Web port of{' '}
        <a href="https://fetchxmlbuilder.com" target="_blank" rel="noreferrer" style={{ color: 'var(--color-accent)' }}>
          FetchXML Builder
        </a>{' '}
        by Jonas Rapp. Built with React 19 + Vite 8 + Ant Design 6 + Tailwind CSS 4. Phase 1: Frontend with mock data. Phase 2: ASP.NET Core 9 Web API + Dataverse integration.
      </div>
    </div>
  )
}
