import { type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Tooltip } from 'antd'
import {
  DatabaseOutlined,
  CodeOutlined,
  TableOutlined,
  HistoryOutlined,
  SettingOutlined,
  TranslationOutlined,
  BulbOutlined,
  BulbFilled,
  ApiOutlined,
  DisconnectOutlined,
} from '@ant-design/icons'
import { useFxbStore } from '@/store/index.ts'
import type { FxbState } from '@/store/index.ts'
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '@/i18n/index.ts'
import i18n from '@/i18n/index.ts'

type Tab = FxbState['activeTab']

interface NavItem {
  key: Tab
  icon: ReactNode
  labelKey: string
}

const NAV_ITEMS: NavItem[] = [
  { key: 'builder',  icon: <DatabaseOutlined />,  labelKey: 'nav.builder' },
  { key: 'result',   icon: <TableOutlined />,      labelKey: 'nav.result' },
  { key: 'code',     icon: <CodeOutlined />,       labelKey: 'nav.code' },
  { key: 'history',  icon: <HistoryOutlined />,    labelKey: 'nav.history' },
  { key: 'settings', icon: <SettingOutlined />,    labelKey: 'nav.settings' },
]

export function Header() {
  const { t } = useTranslation()
  const { activeTab, setActiveTab, settings, updateSettings, isAuthenticated, accountName } =
    useFxbStore()

  const toggleTheme = () =>
    updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' })

  const cycleLang = () => {
    const langs = Object.keys(SUPPORTED_LANGUAGES) as SupportedLanguage[]
    const next = langs[(langs.indexOf(settings.language as SupportedLanguage) + 1) % langs.length]
    updateSettings({ language: next })
    void i18n.changeLanguage(next)
  }

  return (
    <header
      style={{
        height: 52,
        background: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        gap: 4,
        flexShrink: 0,
        userSelect: 'none',
      }}
    >
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 16 }}>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 13,
            fontWeight: 700,
            color: '#fff',
            flexShrink: 0,
            boxShadow: '0 2px 8px rgba(99,102,241,0.4)',
          }}
        >
          FX
        </div>
        <span
          style={{
            fontWeight: 600,
            fontSize: 14,
            background: 'linear-gradient(135deg, #6366f1, #a78bfa)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            whiteSpace: 'nowrap',
          }}
        >
          FetchXML Builder
        </span>
      </div>

      {/* Nav Tabs */}
      <nav style={{ display: 'flex', gap: 2, flex: 1 }}>
        {NAV_ITEMS.map(({ key, icon, labelKey }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '5px 12px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 500,
              fontFamily: 'var(--font-sans)',
              transition: 'all var(--transition)',
              background: activeTab === key ? 'var(--color-accent-subtle)' : 'transparent',
              color: activeTab === key ? 'var(--color-accent-hover)' : 'var(--color-text-secondary)',
              outline: 'none',
            }}
          >
            {icon}
            <span>{t(labelKey)}</span>
          </button>
        ))}
      </nav>

      {/* Right actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {/* Auth indicator */}
        <Tooltip title={isAuthenticated ? `${accountName ?? ''} · ${t('auth.signOut')}` : t('auth.signIn')}>
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '5px 10px',
              borderRadius: 'var(--radius-sm)',
              border: `1px solid ${isAuthenticated ? 'rgba(34,197,94,0.3)' : 'var(--color-border)'}`,
              cursor: 'pointer',
              fontSize: 11,
              fontWeight: 500,
              background: isAuthenticated ? 'rgba(34,197,94,0.08)' : 'transparent',
              color: isAuthenticated ? 'var(--color-success)' : 'var(--color-text-muted)',
              fontFamily: 'var(--font-sans)',
              transition: 'all var(--transition)',
            }}
          >
            {isAuthenticated ? <ApiOutlined /> : <DisconnectOutlined />}
            <span>{isAuthenticated ? t('auth.connected') : t('auth.notConnected')}</span>
          </button>
        </Tooltip>

        {/* Language */}
        <Tooltip title={t('settings.language')}>
          <button onClick={cycleLang} className="icon-btn">
            <TranslationOutlined />
            <span style={{ fontSize: 10, fontWeight: 600 }}>
              {(settings.language ?? 'en').toUpperCase()}
            </span>
          </button>
        </Tooltip>

        {/* Theme */}
        <Tooltip title={t('settings.theme')}>
          <button onClick={toggleTheme} className="icon-btn">
            {settings.theme === 'dark' ? <BulbFilled style={{ color: '#f59e0b' }} /> : <BulbOutlined />}
          </button>
        </Tooltip>
      </div>
    </header>
  )
}
