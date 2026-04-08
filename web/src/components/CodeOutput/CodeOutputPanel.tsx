import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import MonacoEditor from '@monaco-editor/react'
import { Button, Checkbox, InputNumber, Radio, Select, Tabs, Tooltip, message } from 'antd'
import { CopyOutlined, LinkOutlined } from '@ant-design/icons'
import { useFxbStore, selectCurrentXml } from '@/store/index.ts'
import {
  generateCode,
  CODE_LANGUAGE_LABELS,
  QEXSTYLE_LABELS,
  QEXSTYLE_INFO,
  QEXFLAVOR_LABELS,
  type CodeLanguage,
  type QExStyle,
  type QExFlavor,
} from '@/core/codegen/index.ts'

const LANG_MONACO: Record<CodeLanguage, string> = {
  fetchxml: 'xml',
  odata: 'plaintext',
  csharp: 'csharp',
  javascript: 'javascript',
  powerfx: 'plaintext',
  sql: 'sql',
}

const LANGS = Object.keys(CODE_LANGUAGE_LABELS) as CodeLanguage[]

/** Styles that cannot use Flavor (no QueryExpression SDK involved) */
const STYLE_NO_FLAVOR: QExStyle[] = ['FetchXML', 'FetchExpression', 'OrganizationServiceContext']
/** Styles that cannot use Object Initializer / Line-by-line */
const STYLE_NO_OI: QExStyle[] = ['FetchXML', 'FetchExpression', 'OrganizationServiceContext', 'QueryExpressionFactory']
/** Styles that support Filter Variables */
const STYLE_SUPPORTS_FILTER_VARS: QExStyle[] = ['QueryExpression', 'FluentQueryExpression', 'QueryByAttribute', 'QueryExpressionFactory']

const STYLE_OPTIONS = (Object.keys(QEXSTYLE_LABELS) as QExStyle[]).map((key) => ({
  value: key,
  label: QEXSTYLE_LABELS[key],
}))

const FLAVOR_OPTIONS = (Object.keys(QEXFLAVOR_LABELS) as QExFlavor[]).map((key) => ({
  value: key,
  label: QEXFLAVOR_LABELS[key],
}))

export function CodeOutputPanel() {
  const { t } = useTranslation()
  const { setActiveCodeLang, activeCodeLang, settings, updateSettings } = useFxbStore()
  const currentXml = useFxbStore(selectCurrentXml)
  const [copied, setCopied] = useState(false)
  const isDark = settings.theme === 'dark'

  const qexStyle: QExStyle = settings.qexStyle
  const qexFlavor: QExFlavor = settings.qexFlavor
  const qexOI = settings.qexObjectInitializer
  const qexIndents = settings.qexIndents
  const qexComments = settings.qexIncludeComments
  const qexFilterVars = settings.qexFilterVariables

  const isCSharp = activeCodeLang === 'csharp'
  const flavorEnabled = isCSharp && !STYLE_NO_FLAVOR.includes(qexStyle)
  const oiEnabled = isCSharp && !STYLE_NO_OI.includes(qexStyle)

  const code = generateCode(activeCodeLang, currentXml, {
    qexOptions: isCSharp
      ? {
          style: qexStyle,
          flavor: qexFlavor,
          objectInitializer: qexOI,
          indents: qexIndents,
          includeComments: qexComments,
          filterVariables: qexFilterVars,
        }
      : undefined,
    baseUrl: settings.baseApiUrl,
  })

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    void message.success(t('code.copied'), 1.5)
    setTimeout(() => setCopied(false), 2000)
  }

  const helpUrl = isCSharp ? QEXSTYLE_INFO[qexStyle]?.helpUrl : undefined

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* ── Header row ────────────────────────────────────────────────────── */}
      <div
        style={{
          padding: '10px 12px 0',
          borderBottom: '1px solid var(--color-border)',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 0,
        }}
      >
        {/* Title + copy button */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {helpUrl && (
              <Tooltip title={QEXSTYLE_INFO[qexStyle]?.className}>
                <Button
                  type="text"
                  size="small"
                  icon={<LinkOutlined />}
                  href={helpUrl}
                  target="_blank"
                  style={{ color: 'var(--color-text-secondary)', fontSize: 12 }}
                />
              </Tooltip>
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
            label: <span style={{ fontSize: 11, fontWeight: 500 }}>{CODE_LANGUAGE_LABELS[lang]}</span>,
          }))}
        />

        {/* ── C# options panel (only visible on C# tab) ─────────────────── */}
        {isCSharp && (
          <div
            style={{
              padding: '8px 0 6px',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              borderTop: '1px solid var(--color-border)',
              marginTop: 0,
            }}
          >
            {/* Row 1: Style + Flavor */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <label style={{ fontSize: 11, color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>Style</label>
              <Select
                value={qexStyle}
                onChange={(v: QExStyle) => updateSettings({ qexStyle: v })}
                options={STYLE_OPTIONS}
                size="small"
                style={{ width: 200, fontSize: 11 }}
                popupMatchSelectWidth={false}
              />
              <label style={{ fontSize: 11, color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>Flavor</label>
              <Select
                value={qexFlavor}
                onChange={(v: QExFlavor) => updateSettings({ qexFlavor: v })}
                options={FLAVOR_OPTIONS}
                size="small"
                disabled={!flavorEnabled}
                style={{ width: 200, fontSize: 11 }}
                popupMatchSelectWidth={false}
              />
            </div>

            {/* Row 2: Line-by-line / Object initializer + Indents */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <Radio.Group
                size="small"
                disabled={!oiEnabled}
                value={qexOI ? 'oi' : 'lbl'}
                onChange={(e) => updateSettings({ qexObjectInitializer: e.target.value === 'oi' })}
                optionType="button"
                options={[
                  { label: 'Line-by-line', value: 'lbl' },
                  { label: 'Object initializer', value: 'oi' },
                ]}
              />
              <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
                at{' '}
                <InputNumber
                  min={0}
                  max={10}
                  size="small"
                  value={qexIndents}
                  onChange={(v) => updateSettings({ qexIndents: v ?? 0 })}
                  style={{ width: 52 }}
                />
              </span>
            </div>

            {/* Row 3: Comments + Filter Variables */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <Checkbox
                checked={qexComments}
                onChange={(e) => updateSettings({ qexIncludeComments: e.target.checked })}
                style={{ fontSize: 11 }}
              >
                Comments
              </Checkbox>
              <Checkbox
                checked={qexFilterVars}
                onChange={(e) => updateSettings({ qexFilterVariables: e.target.checked })}
                disabled={!STYLE_SUPPORTS_FILTER_VARS.includes(qexStyle)}
                style={{ fontSize: 11 }}
              >
                Filter Variables
              </Checkbox>
            </div>
          </div>
        )}
      </div>

      {/* ── Monaco editor ─────────────────────────────────────────────────── */}
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
