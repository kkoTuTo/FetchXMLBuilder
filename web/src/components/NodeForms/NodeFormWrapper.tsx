/**
 * Shared form wrapper for all node property panels.
 * Renders the form inside a styled card with a coloured header.
 */
import { type ReactNode } from 'react'
import { NODE_COLORS, NODE_LABEL_KEYS } from '../TreeBuilder/nodeColors.ts'
import type { FetchNodeType } from '@/core/ast/types.ts'
import { useTranslation } from 'react-i18next'
import { useFxbStore } from '@/store/index.ts'
import { WarningOutlined, InfoCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'
import { Alert } from 'antd'

interface NodeFormWrapperProps {
  nodeId: string
  type: FetchNodeType
  children: ReactNode
}

export function NodeFormWrapper({ nodeId, type, children }: NodeFormWrapperProps) {
  const { t } = useTranslation()
  const { validationResults } = useFxbStore()
  const validation = validationResults.get(nodeId)
  const color = NODE_COLORS[type]
  const labelKey = NODE_LABEL_KEYS[type]

  const alertType =
    validation?.level === 'error' ? 'error' :
    validation?.level === 'warning' ? 'warning' : 'info'

  const alertIcon =
    validation?.level === 'error' ? <CloseCircleOutlined /> :
    validation?.level === 'warning' ? <WarningOutlined /> : <InfoCircleOutlined />

  return (
    <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Node type header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          paddingBottom: 10,
          borderBottom: `1px solid ${color}33`,
        }}
      >
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: color,
            boxShadow: `0 0 8px ${color}88`,
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          {t(labelKey)}
        </span>
        <span style={{ fontSize: 10, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
          #{nodeId.split('_')[1]}
        </span>
      </div>

      {/* Validation alert */}
      {validation && (
        <Alert
          type={alertType}
          icon={alertIcon}
          showIcon
          message={validation.message}
          action={
            validation.helpUrl ? (
              <a href={validation.helpUrl} target="_blank" rel="noreferrer"
                style={{ fontSize: 11, color: 'inherit', opacity: 0.8 }}>
                {t('validation.learnMore')} ↗
              </a>
            ) : undefined
          }
          style={{
            padding: '6px 10px',
            fontSize: 12,
            borderRadius: 8,
          }}
        />
      )}

      {/* Form content */}
      {children}
    </div>
  )
}
