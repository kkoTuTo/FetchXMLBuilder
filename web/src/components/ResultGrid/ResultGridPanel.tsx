import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Table, Button, Empty, Pagination, Space, message } from 'antd'
import type { TableColumnsType } from 'antd'
import { PlayCircleOutlined, DownloadOutlined, LoadingOutlined } from '@ant-design/icons'
import { useFxbStore } from '@/store/index.ts'
import { MOCK_ACCOUNT_RESULTS } from '@/services/mock/mockData.ts'

const PAGE_SIZE = 10

function jsonToCsv(data: Record<string, unknown>[]): string {
  if (!data.length) return ''
  const keys = Object.keys(data[0])
  const rows = data.map((row) => keys.map((k) => JSON.stringify(row[k] ?? '')).join(','))
  return [keys.join(','), ...rows].join('\n')
}

export function ResultGridPanel() {
  const { t } = useTranslation()
  const { queryResults, queryRunning, queryError, setQueryResults, setQueryRunning, setQueryError } =
    useFxbStore()
  const [page, setPage] = useState(1)

  const handleRun = () => {
    setQueryRunning(true)
    setQueryError(null)
    // Simulate async with mock data
    setTimeout(() => {
      setQueryResults(MOCK_ACCOUNT_RESULTS as Record<string, unknown>[], MOCK_ACCOUNT_RESULTS.length)
    }, 800)
  }

  const handleExportCsv = () => {
    const csv = jsonToCsv(queryResults)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'fetchxml-results.csv'
    a.click()
    URL.revokeObjectURL(url)
    void message.success('CSV exported', 1.5)
  }

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(queryResults, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'fetchxml-results.json'
    a.click()
    URL.revokeObjectURL(url)
    void message.success('JSON exported', 1.5)
  }

  const pageData = queryResults.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const columns: TableColumnsType<Record<string, unknown>> =
    queryResults.length > 0
      ? Object.keys(queryResults[0]).map((key) => ({
          key,
          title: <span style={{ fontSize: 11, fontWeight: 600 }}>{key}</span>,
          dataIndex: key,
          ellipsis: true,
          width: Math.max(80, Math.min(180, key.length * 10)),
          render: (val: unknown) => (
            <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)' }}>
              {val == null ? <span style={{ color: 'var(--color-text-muted)' }}>null</span> : String(val)}
            </span>
          ),
        }))
      : []

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        padding: 16,
        gap: 12,
        overflow: 'hidden',
      }}
    >
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <Button
          type="primary"
          icon={queryRunning ? <LoadingOutlined /> : <PlayCircleOutlined />}
          onClick={handleRun}
          disabled={queryRunning}
          style={{
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            border: 'none',
            borderRadius: 8,
            fontWeight: 600,
            fontSize: 13,
            height: 36,
            paddingInline: 20,
          }}
        >
          {queryRunning ? t('execute.running') : t('execute.run')}
        </Button>

        {queryResults.length > 0 && (
          <>
            <div
              style={{
                padding: '4px 12px',
                borderRadius: 6,
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                fontSize: 12,
                color: 'var(--color-text-secondary)',
              }}
            >
              {t('execute.totalRecords', { count: queryResults.length })}
            </div>
            <Space>
              <Button
                size="small"
                icon={<DownloadOutlined />}
                onClick={handleExportCsv}
                style={{ fontSize: 12, borderRadius: 6 }}
              >
                CSV
              </Button>
              <Button
                size="small"
                icon={<DownloadOutlined />}
                onClick={handleExportJson}
                style={{ fontSize: 12, borderRadius: 6 }}
              >
                JSON
              </Button>
            </Space>
          </>
        )}
      </div>

      {/* Error */}
      {queryError && (
        <div
          style={{
            padding: '8px 12px',
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 8,
            color: '#ef4444',
            fontSize: 12,
            flexShrink: 0,
          }}
        >
          ⚠ {queryError}
        </div>
      )}

      {/* Table */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {queryResults.length === 0 && !queryRunning ? (
          <Empty
            description={<span style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>{t('execute.noResults')}</span>}
            style={{ marginTop: 60 }}
          />
        ) : (
          <>
            <div style={{ flex: 1, overflow: 'auto' }}>
              <Table
                dataSource={pageData}
                columns={columns}
                rowKey={(r) => String(Object.values(r)[0])}
                pagination={false}
                size="small"
                loading={queryRunning}
                scroll={{ x: 'max-content' }}
                style={{ fontSize: 12 }}
              />
            </div>
            {queryResults.length > PAGE_SIZE && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', flexShrink: 0 }}>
                <Pagination
                  current={page}
                  pageSize={PAGE_SIZE}
                  total={queryResults.length}
                  onChange={setPage}
                  size="small"
                  showSizeChanger={false}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
