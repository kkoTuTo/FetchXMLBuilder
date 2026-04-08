import { useEffect, useState, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import MonacoEditor from '@monaco-editor/react'
import { Button, Tooltip, message } from 'antd'
import { CopyOutlined, FormatPainterOutlined } from '@ant-design/icons'
import { useFxbStore, selectCurrentXml } from '@/store/index.ts'
import { prettyPrintFetchXml } from '@/core/parser/index.ts'

export function XmlEditorPanel() {
  const { t } = useTranslation()
  const { importXml, settings } = useFxbStore()
  const currentXml = useFxbStore(selectCurrentXml)
  const [localXml, setLocalXml] = useState(currentXml)
  const [parseError, setParseError] = useState<string | null>(null)
  const isInternalUpdate = useRef(false)

  // Sync store → editor when XML changes externally (tree edits)
  useEffect(() => {
    if (isInternalUpdate.current) {
      isInternalUpdate.current = false
      return
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocalXml(currentXml)
    setParseError(null)
  }, [currentXml])

  const handleEditorChange = useCallback(
    (value: string | undefined) => {
      if (value === undefined) return
      setLocalXml(value)
      if (value.trim() === '') return
      isInternalUpdate.current = true
      const error = importXml(value)
      setParseError(error)
    },
    [importXml],
  )

  const handleFormat = () => {
    const formatted = prettyPrintFetchXml(localXml)
    setLocalXml(formatted)
    importXml(formatted)
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(localXml)
    void message.success(t('xml.copied'), 1.5)
  }

  const isDark = settings.theme === 'dark'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div
        style={{
          padding: '10px 12px 8px',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--color-text-muted)',
          }}
        >
          {t('xml.title')}
        </span>
        <div style={{ display: 'flex', gap: 4 }}>
          <Tooltip title={t('xml.format')}>
            <Button
              type="text"
              size="small"
              icon={<FormatPainterOutlined />}
              onClick={handleFormat}
              style={{ color: 'var(--color-text-secondary)', fontSize: 12 }}
            />
          </Tooltip>
          <Tooltip title={t('xml.copy')}>
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined />}
              onClick={() => { void handleCopy() }}
              style={{ color: 'var(--color-text-secondary)', fontSize: 12 }}
            />
          </Tooltip>
        </div>
      </div>

      {/* Error banner */}
      {parseError && (
        <div
          style={{
            padding: '6px 12px',
            background: 'rgba(239,68,68,0.1)',
            borderBottom: '1px solid rgba(239,68,68,0.2)',
            color: '#ef4444',
            fontSize: 11,
            fontFamily: 'var(--font-mono)',
          }}
        >
          ⚠ {parseError}
        </div>
      )}

      {/* Monaco */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <MonacoEditor
          height="100%"
          language="xml"
          value={localXml}
          onChange={handleEditorChange}
          theme={isDark ? 'vs-dark' : 'light'}
          options={{
            fontSize: 12,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            fontLigatures: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            lineNumbers: 'on',
            renderLineHighlight: 'gutter',
            folding: true,
            tabSize: 2,
            insertSpaces: true,
            automaticLayout: true,
            overviewRulerLanes: 0,
            padding: { top: 8, bottom: 8 },
          }}
        />
      </div>
    </div>
  )
}
