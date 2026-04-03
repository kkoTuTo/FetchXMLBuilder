import { useTranslation } from 'react-i18next'
import { Button, Empty, Tooltip, Popconfirm } from 'antd'
import { RestOutlined, DeleteOutlined, ClockCircleOutlined } from '@ant-design/icons'
import { useFxbStore } from '@/store/index.ts'

export function HistoryPanel() {
  const { t } = useTranslation()
  const { history, restoreHistory, clearHistory, saveToHistory } = useFxbStore()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 16, gap: 12 }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>
          {t('history.title')}
          {history.length > 0 && (
            <span style={{ marginLeft: 6, fontSize: 11, color: 'var(--color-text-muted)' }}>
              ({history.length})
            </span>
          )}
        </span>
        <div style={{ display: 'flex', gap: 6 }}>
          <Button
            size="small"
            onClick={() => saveToHistory()}
            style={{ fontSize: 12, borderRadius: 6 }}
          >
            Save current
          </Button>
          {history.length > 0 && (
            <Popconfirm
              title={t('history.clear') + '?'}
              onConfirm={clearHistory}
              okText="Yes"
              cancelText="No"
            >
              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
                style={{ fontSize: 12, borderRadius: 6 }}
              >
                {t('history.clear')}
              </Button>
            </Popconfirm>
          )}
        </div>
      </div>

      {/* List */}
      {history.length === 0 ? (
        <Empty
          description={<span style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>{t('history.empty')}</span>}
          style={{ marginTop: 40 }}
        />
      ) : (
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {history.map((entry) => (
            <div
              key={entry.id}
              style={{
                padding: '10px 12px',
                borderRadius: 10,
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface)',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                transition: 'border-color var(--transition)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--color-accent)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text)' }}>
                  {entry.label ?? `Query #${entry.id.split('_')[1]}`}
                </span>
                <Tooltip title={t('history.restore')}>
                  <Button
                    type="text"
                    size="small"
                    icon={<RestOutlined />}
                    onClick={() => restoreHistory(entry.id)}
                    style={{ color: 'var(--color-accent)', fontSize: 12 }}
                  />
                </Tooltip>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--color-text-muted)' }}>
                <ClockCircleOutlined style={{ fontSize: 10 }} />
                <span style={{ fontSize: 11 }}>
                  {new Date(entry.savedAt).toLocaleString()}
                </span>
              </div>
              <pre
                style={{
                  margin: 0,
                  padding: '6px 8px',
                  background: 'var(--color-surface-2)',
                  borderRadius: 6,
                  fontSize: 10,
                  fontFamily: 'var(--font-mono)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  color: 'var(--color-text-secondary)',
                  maxWidth: '100%',
                }}
              >
                {entry.xml.split('\n').slice(0, 2).join(' ')}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
