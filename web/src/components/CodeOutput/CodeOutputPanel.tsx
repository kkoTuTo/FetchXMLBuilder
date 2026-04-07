import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import MonacoEditor from '@monaco-editor/react'
import { Button, Tabs, Tooltip, message } from 'antd'
import { CopyOutlined } from '@ant-design/icons'
import { useFxbStore, selectCurrentXml } from '@/store/index.ts'
import { generateCode, CODE_LANGUAGE_LABELS, type CodeLanguage } from '@/core/codegen/index.ts'
import type { CSharpStyle } from '@/core/codegen/index.ts'

const LANG_MONACO: Record<CodeLanguage, string> = {
  fetchxml: 'xml',
  odata: 'plaintext',
  csharp: 'csharp',
  javascript: 'javascript',
  powerfx: 'plaintext',
  sql: 'sql',
}

const LANGS = Object.keys(CODE_LANGUAGE_LABELS) as CodeLanguage[]

const CSHARP_STYLES: { key: CSharpStyle; label: string }[] = [
  { key: 'fetchxml',        label: 'FetchXML string' },
  { key: 'fetchexpression', label: 'FetchExpression' },
]

export function CodeOutputPanel() {
  const { t } = useTranslation()
  const { setActiveCodeLang, activeCodeLang, settings, updateSettings } = useFxbStore()
  const currentXml = useFxbStore(selectCurrentXml)
  const [copied, setCopied] = useState(false)
  const isDark = settings.theme === 'dark'

  const csharpStyle: CSharpStyle = settings.csharpStyle ?? 'fetchxml'
  const code = generateCode(activeCodeLang, currentXml, { csharpStyle })

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    void message.success(t('code.copied'), 1.5)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div
        style={{
          padding: '10px 12px 0',
          borderBottom: '1px solid var(--color-border)',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--color-text-muted)',
            }}
          >
            {t('code.title')}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* C# style toggle – only visible on the C# tab */}
            {activeCodeLang === 'csharp' && (
              <div style={{ display: 'flex', gap: 4 }}>
                {CSHARP_STYLES.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => updateSettings({ csharpStyle: key })}
                    style={{
                      padding: '3px 10px',
                      borderRadius: 6,
                      border: csharpStyle === key
                        ? '1.5px solid var(--color-accent)'
                        : '1px solid var(--color-border)',
                      background: csharpStyle === key ? 'var(--color-accent-subtle)' : 'transparent',
                      color: csharpStyle === key ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                      cursor: 'pointer',
                      fontSize: 11,
                      fontWeight: csharpStyle === key ? 600 : 400,
                      fontFamily: 'var(--font-sans)',
                      transition: 'all var(--transition)',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
            <Tooltip title={copied ? t('code.copied') : t('code.copy')}>
              <Button
                type="text"
                size="small"
                icon={<CopyOutlined />}
                onClick={() => { void handleCopy() }}
                style={{ color: copied ? 'var(--color-success)' : 'var(--color-text-secondary)', fontSize: 12 }}
              />
            </Tooltip>
          </div>
        </div>

        {/* Language tabs */}
        <Tabs
          activeKey={activeCodeLang}
          onChange={(k) => setActiveCodeLang(k as CodeLanguage)}
          size="small"
          style={{ margin: '0 -12px' }}
          tabBarStyle={{ marginBottom: 0, paddingLeft: 8 }}
          items={LANGS.map((lang) => ({
            key: lang,
            label: (
              <span style={{ fontSize: 11, fontWeight: 500 }}>
                {CODE_LANGUAGE_LABELS[lang]}
              </span>
            ),
          }))}
        />
      </div>

      {/* Monaco */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <MonacoEditor
          height="100%"
          language={LANG_MONACO[activeCodeLang]}
          value={code}
          theme={isDark ? 'vs-dark' : 'light'}
          options={{
            readOnly: true,
            fontSize: 12,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            fontLigatures: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            lineNumbers: 'off',
            renderLineHighlight: 'none',
            folding: false,
            automaticLayout: true,
            overviewRulerLanes: 0,
            padding: { top: 8, bottom: 8 },
          }}
        />
      </div>
    </div>
  )
}
