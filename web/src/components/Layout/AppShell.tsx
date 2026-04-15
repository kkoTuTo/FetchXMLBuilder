import { type ReactNode, useEffect } from 'react'
import { ConfigProvider, theme as antTheme } from 'antd'
import { Header } from './Header.tsx'
import { useFxbStore } from '@/store/index.ts'

interface AppShellProps {
  left: ReactNode
  center: ReactNode
  right: ReactNode
}

export function AppShell({ left, center, right }: AppShellProps) {
  const { settings } = useFxbStore()
  const isDark = settings.theme === 'dark'

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme)
  }, [settings.theme])

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
        token: {
          colorPrimary: '#6366f1',
          colorBgContainer: isDark ? '#161b27' : '#ffffff',
          colorBgElevated: isDark ? '#1e2535' : '#ffffff',
          colorBgLayout: isDark ? '#0f1117' : '#f8fafc',
          colorBorder: isDark ? '#2a3347' : '#e2e8f0',
          colorText: isDark ? '#e2e8f0' : '#1e293b',
          colorTextSecondary: isDark ? '#94a3b8' : '#475569',
          borderRadius: 8,
          fontFamily: "'Inter', system-ui, sans-serif",
          fontSize: 13,
        },
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          background: 'var(--color-bg)',
          overflow: 'hidden',
        }}
      >
        <Header />

        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
          {/* Left panel – Tree */}
          <aside
            style={{
              width: 260,
              flexShrink: 0,
              background: 'var(--color-surface)',
              borderRight: '1px solid var(--color-border)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {left}
          </aside>

          {/* Center – Main content */}
          <main
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              minWidth: 0,
              background: 'var(--color-bg)',
            }}
          >
            {center}
          </main>

          {/* Right panel – XML/Code */}
          <aside
            style={{
              width: 360,
              flexShrink: 0,
              background: 'var(--color-surface)',
              borderLeft: '1px solid var(--color-border)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {right}
          </aside>
        </div>
      </div>
    </ConfigProvider>
  )
}
