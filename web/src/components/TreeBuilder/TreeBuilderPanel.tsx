import { useState, type CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import { Dropdown, Tooltip } from 'antd'
import type { MenuProps } from 'antd'
import {
  PlusOutlined, DeleteOutlined, ArrowUpOutlined, ArrowDownOutlined,
  CopyOutlined, CommentOutlined, WarningOutlined, InfoCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons'
import { useFxbStore } from '@/store/index.ts'
import type { FetchNode, FetchNodeType } from '@/core/ast/types.ts'
import { getAllowedChildTypes, getCapability } from '@/core/ast/index.ts'
import { NODE_COLORS, NODE_ABBR, NODE_LABEL_KEYS, getNodeLabel } from './nodeColors.ts'

// ─── NodeBadge ────────────────────────────────────────────────────────────────

function NodeBadge({ type }: { type: FetchNodeType }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 22,
        height: 16,
        borderRadius: 4,
        fontSize: 9,
        fontWeight: 700,
        fontFamily: 'var(--font-mono)',
        background: `${NODE_COLORS[type]}22`,
        color: NODE_COLORS[type],
        border: `1px solid ${NODE_COLORS[type]}44`,
        flexShrink: 0,
        letterSpacing: 0,
      }}
    >
      {NODE_ABBR[type]}
    </span>
  )
}

// ─── ValidationIcon ───────────────────────────────────────────────────────────

function ValidationIcon({ level, messageKey, params }: { level: string; messageKey: string; params?: Record<string, string> }) {
  const { t } = useTranslation()
  const icons = {
    error: <CloseCircleOutlined style={{ color: 'var(--color-error)', fontSize: 11 }} />,
    warning: <WarningOutlined style={{ color: 'var(--color-warning)', fontSize: 11 }} />,
    info: <InfoCircleOutlined style={{ color: 'var(--color-info)', fontSize: 11 }} />,
  }
  const message = t(messageKey, params)
  return (
    <Tooltip title={message} placement="right">
      <span style={{ flexShrink: 0, lineHeight: 0 }}>
        {icons[level as keyof typeof icons] ?? null}
      </span>
    </Tooltip>
  )
}

// ─── TreeNode row ─────────────────────────────────────────────────────────────

interface TreeNodeRowProps {
  node: FetchNode
  depth: number
  isSelected: boolean
  onSelect: (id: string) => void
}

function TreeNodeRow({ node, depth, isSelected, onSelect }: TreeNodeRowProps) {
  const { t } = useTranslation()
  const { addChildNode, removeNode, moveNodeDir, duplicateNode, validationResults, settings } =
    useFxbStore()
  const [hovered, setHovered] = useState(false)

  const cap = getCapability(node.type)
  const allowed = getAllowedChildTypes(node.type).filter((c) => c !== '-') as FetchNodeType[]
  const validation = validationResults.get(node.id)
  const label = getNodeLabel(node.type, node.attrs)

  const addMenu: MenuProps = {
    items: allowed.map((type) => ({
      key: type,
      label: t(NODE_LABEL_KEYS[type]),
      onClick: () => addChildNode(node.id, type),
    })),
  }

  const contextMenu: MenuProps = {
    items: [
      allowed.length > 0
        ? { key: 'add', label: t('tree.addChild'), icon: <PlusOutlined />, children: addMenu.items }
        : null,
      { type: 'divider' },
      { key: 'up', label: t('tree.moveUp'), icon: <ArrowUpOutlined />, onClick: () => moveNodeDir(node.id, 'up') },
      { key: 'down', label: t('tree.moveDown'), icon: <ArrowDownOutlined />, onClick: () => moveNodeDir(node.id, 'down') },
      cap.deletable ? { key: 'dup', label: t('tree.duplicate'), icon: <CopyOutlined />, onClick: () => duplicateNode(node.id) } : null,
      cap.canComment ? { key: 'comment', label: t('tree.comment'), icon: <CommentOutlined />, onClick: () => {} } : null,
      { type: 'divider' },
      cap.deletable
        ? { key: 'del', label: t('tree.delete'), icon: <DeleteOutlined />, danger: true, onClick: () => removeNode(node.id) }
        : null,
    ].filter(Boolean) as MenuProps['items'],
  }

  const rowStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    paddingLeft: 8 + depth * 16,
    paddingRight: 8,
    height: 28,
    cursor: 'pointer',
    borderRadius: 6,
    margin: '1px 4px',
    transition: 'background var(--transition)',
    background: isSelected
      ? 'var(--color-accent-subtle)'
      : hovered
        ? 'var(--color-surface-2)'
        : 'transparent',
    color: node.type === '#comment' ? 'var(--color-text-muted)' : 'var(--color-text)',
    fontStyle: node.type === '#comment' ? 'italic' : 'normal',
    position: 'relative',
  }

  // indent guide line
  const guideStyle: CSSProperties = {
    position: 'absolute',
    left: depth * 16 + 8 - 1,
    top: 0,
    bottom: 0,
    width: 1,
    background: depth > 0 ? 'var(--color-border)' : 'transparent',
    pointerEvents: 'none',
  }

  return (
    <Dropdown menu={contextMenu} trigger={['contextMenu']}>
      <div
        style={rowStyle}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => onSelect(node.id)}
      >
        {depth > 0 && <span style={guideStyle} />}
        <NodeBadge type={node.type} />
        <span
          style={{
            flex: 1,
            fontSize: 12,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontFamily: label ? 'var(--font-mono)' : undefined,
            color: label ? 'var(--color-text)' : 'var(--color-text-muted)',
          }}
        >
          {label || <span style={{ fontFamily: 'var(--font-sans)', color: 'var(--color-text-muted)' }}>{t(NODE_LABEL_KEYS[node.type])}</span>}
        </span>
        {settings.showValidation && validation && (
          <ValidationIcon level={validation.level} messageKey={validation.message} params={validation.params} />
        )}
        {/* Hover actions */}
        {hovered && allowed.length > 0 && (
          <Dropdown menu={addMenu} trigger={['click']}>
            <span
              onClick={(e) => e.stopPropagation()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '1px 4px',
                borderRadius: 4,
                background: 'var(--color-accent-subtle)',
                color: 'var(--color-accent)',
                fontSize: 11,
                flexShrink: 0,
                cursor: 'pointer',
              }}
            >
              <PlusOutlined />
            </span>
          </Dropdown>
        )}
      </div>
    </Dropdown>
  )
}

// ─── Recursive tree ───────────────────────────────────────────────────────────

interface TreeNodeProps {
  node: FetchNode
  depth?: number
}

function TreeNodeItem({ node, depth = 0 }: TreeNodeProps) {
  const { selectedNodeId, selectNode } = useFxbStore()
  const [expanded, setExpanded] = useState(true)
  const hasChildren = node.children.length > 0

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {/* Expand / collapse toggle */}
        <button
          onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v) }}
          style={{
            width: 14,
            height: 14,
            flexShrink: 0,
            border: 'none',
            background: 'transparent',
            cursor: hasChildren ? 'pointer' : 'default',
            color: hasChildren ? 'var(--color-text-muted)' : 'transparent',
            fontSize: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: 4 + depth * 16,
            padding: 0,
            borderRadius: 3,
            transition: 'transform var(--transition)',
            transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
          }}
        >
          {hasChildren ? '▶' : ''}
        </button>
        <div style={{ flex: 1 }}>
          <TreeNodeRow
            node={node}
            depth={0}
            isSelected={selectedNodeId === node.id}
            onSelect={selectNode}
          />
        </div>
      </div>

      {hasChildren && expanded && (
        <div>
          {node.children.map((child) => (
            <TreeNodeItem key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── TreeBuilder panel ────────────────────────────────────────────────────────

export function TreeBuilderPanel() {
  const { t } = useTranslation()
  const { root } = useFxbStore()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Panel header */}
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
          {t('nav.builder')}
        </span>
      </div>

      {/* Tree */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0 8px' }}>
        <TreeNodeItem node={root} depth={0} />
      </div>
    </div>
  )
}
