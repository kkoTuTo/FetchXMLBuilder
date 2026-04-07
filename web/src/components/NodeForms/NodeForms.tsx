/**
 * All 8 node-specific property forms + a dispatcher component.
 * Each form reads/writes node.attrs through the Zustand store.
 */
import { useTranslation } from 'react-i18next'
import { Input, Button, Space } from 'antd'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import { useFxbStore } from '@/store/index.ts'
import { findNode } from '@/core/ast/index.ts'
import { NodeFormWrapper } from './NodeFormWrapper.tsx'
import { FieldRow, FormInput, FormSelect, FormSwitch } from './FormFields.tsx'
import { MOCK_ENTITIES, getMockAttributes, CONDITION_OPERATORS } from '@/services/mock/mockData.ts'

// ─── FetchForm ────────────────────────────────────────────────────────────────

function FetchForm({ id }: { id: string }) {
  const { t } = useTranslation()
  const { root, updateNodeAttrs } = useFxbStore()
  const node = findNode(root, id)
  if (!node) return null
  const a = node.attrs
  const up = (k: string, v: string) => updateNodeAttrs(id, { [k]: v })

  return (
    <NodeFormWrapper nodeId={id} type="fetch">
      <FieldRow label={t('form.top')} hint="e.g. 50">
        <FormInput value={a.top ?? ''} onChange={(v) => up('top', v)} placeholder="e.g. 50" mono />
      </FieldRow>
      <FieldRow label={t('form.count')}>
        <FormInput value={a.count ?? ''} onChange={(v) => up('count', v)} placeholder="e.g. 5000" mono />
      </FieldRow>
      <FieldRow label={t('form.page')}>
        <FormInput value={a.page ?? ''} onChange={(v) => up('page', v)} placeholder="1" mono />
      </FieldRow>
      <FieldRow label="Paging Cookie">
        <FormInput value={a['paging-cookie'] ?? ''} onChange={(v) => up('paging-cookie', v)} placeholder="(from previous page response)" mono />
      </FieldRow>
      <FieldRow label={t('form.datasource')}>
        <FormSelect
          value={a.datasource ?? ''}
          onChange={(v) => up('datasource', v)}
          options={[
            { value: '', label: '(default)' },
            { value: 'retained', label: 'retained (Long Term Retention)' },
          ]}
        />
      </FieldRow>
      <FieldRow label={t('form.mapping')}>
        <FormSelect
          value={a.mapping ?? 'logical'}
          onChange={(v) => up('mapping', v)}
          options={[
            { value: 'logical', label: 'logical' },
            { value: 'internal', label: 'internal' },
          ]}
        />
      </FieldRow>
      <FieldRow label="Aggregate Limit">
        <FormInput value={a.aggregatelimit ?? ''} onChange={(v) => up('aggregatelimit', v)} placeholder="e.g. 5000" mono />
      </FieldRow>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <FieldRow label={t('form.distinct')}>
          <FormSwitch
            checked={a.distinct === 'true'}
            onChange={(v) => up('distinct', v ? 'true' : 'false')}
          />
        </FieldRow>
        <FieldRow label={t('form.aggregate')}>
          <FormSwitch
            checked={a.aggregate === 'true'}
            onChange={(v) => up('aggregate', v ? 'true' : 'false')}
          />
        </FieldRow>
        <FieldRow label={t('form.noLock')}>
          <FormSwitch
            checked={a['no-lock'] === 'true'}
            onChange={(v) => up('no-lock', v ? 'true' : 'false')}
          />
        </FieldRow>
        <FieldRow label={t('form.returnTotalRecordCount')}>
          <FormSwitch
            checked={a.returntotalrecordcount === 'true'}
            onChange={(v) => up('returntotalrecordcount', v ? 'true' : 'false')}
          />
        </FieldRow>
        <FieldRow label="Late Materialize">
          <FormSwitch
            checked={a.latematerialize === 'true'}
            onChange={(v) => up('latematerialize', v ? 'true' : 'false')}
          />
        </FieldRow>
        <FieldRow label="Use Raw Order By">
          <FormSwitch
            checked={a.useraworderby === 'true'}
            onChange={(v) => up('useraworderby', v ? 'true' : 'false')}
          />
        </FieldRow>
      </div>
    </NodeFormWrapper>
  )
}

// ─── EntityForm ───────────────────────────────────────────────────────────────

function EntityForm({ id }: { id: string }) {
  const { t } = useTranslation()
  const { root, updateNodeAttrs } = useFxbStore()
  const node = findNode(root, id)
  if (!node) return null
  const a = node.attrs
  const up = (k: string, v: string) => updateNodeAttrs(id, { [k]: v })

  const entityOptions = MOCK_ENTITIES.map((e) => ({ value: e.logicalName, label: e.logicalName }))

  return (
    <NodeFormWrapper nodeId={id} type="entity">
      <FieldRow label={t('form.name')} required>
        <FormSelect
          value={a.name ?? ''}
          onChange={(v) => up('name', v)}
          options={entityOptions}
          placeholder={t('form.placeholder.entityName')}
          allowClear
        />
      </FieldRow>
    </NodeFormWrapper>
  )
}

// ─── LinkEntityForm ───────────────────────────────────────────────────────────

function LinkEntityForm({ id }: { id: string }) {
  const { t } = useTranslation()
  const { root, updateNodeAttrs } = useFxbStore()
  const node = findNode(root, id)
  if (!node) return null
  const a = node.attrs
  const up = (k: string, v: string) => updateNodeAttrs(id, { [k]: v })

  const entityOptions = MOCK_ENTITIES.map((e) => ({ value: e.logicalName, label: e.logicalName }))
  const entityName = a.name ?? ''
  const attrOptions = getMockAttributes(entityName).map((attr) => ({ value: attr.logicalName, label: attr.logicalName }))

  return (
    <NodeFormWrapper nodeId={id} type="link-entity">
      <FieldRow label={t('form.name')} required>
        <FormSelect value={entityName} onChange={(v) => up('name', v)} options={entityOptions} placeholder={t('form.placeholder.entityName')} allowClear />
      </FieldRow>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <FieldRow label={t('form.from')} required>
          <FormSelect value={a.from ?? ''} onChange={(v) => up('from', v)} options={attrOptions} placeholder="from" allowClear />
        </FieldRow>
        <FieldRow label={t('form.to')} required>
          <FormSelect value={a.to ?? ''} onChange={(v) => up('to', v)} options={attrOptions} placeholder="to" allowClear />
        </FieldRow>
      </div>
      <FieldRow label={t('form.alias')}>
        <FormInput value={a.alias ?? ''} onChange={(v) => up('alias', v)} placeholder={t('form.placeholder.alias')} mono />
      </FieldRow>
      <FieldRow label={t('form.linkType')}>
        <FormSelect
          value={a['link-type'] ?? 'inner'}
          onChange={(v) => up('link-type', v)}
          options={[
            'inner','outer','any','not any','all','not all',
            'exists','in','matchfirstrowusingcrossapply',
          ].map((v) => ({ value: v, label: v }))}
        />
      </FieldRow>
      <FieldRow label={t('form.intersect')}>
        <FormSwitch checked={a.intersect === 'true'} onChange={(v) => up('intersect', v ? 'true' : 'false')} />
      </FieldRow>
    </NodeFormWrapper>
  )
}

// ─── AttributeForm ────────────────────────────────────────────────────────────

function AttributeForm({ id }: { id: string }) {
  const { t } = useTranslation()
  const { root, updateNodeAttrs } = useFxbStore()
  const node = findNode(root, id)
  if (!node) return null
  const a = node.attrs
  const up = (k: string, v: string) => updateNodeAttrs(id, { [k]: v })

  // Determine parent entity name
  const findParentEntityName = (): string => {
    const walk = (n: typeof root, target: string, ancestors: typeof root[]): typeof root[] | null => {
      if (n.id === target) return ancestors
      for (const c of n.children) {
        const r = walk(c, target, [...ancestors, n])
        if (r) return r
      }
      return null
    }
    const path = walk(root, id, []) ?? []
    for (let i = path.length - 1; i >= 0; i--) {
      if (path[i].type === 'entity' || path[i].type === 'link-entity') {
        return path[i].attrs.name ?? ''
      }
    }
    return ''
  }

  const parentEntity = findParentEntityName()
  const attrOptions = getMockAttributes(parentEntity).map((attr) => ({ value: attr.logicalName, label: attr.logicalName }))

  return (
    <NodeFormWrapper nodeId={id} type="attribute">
      <FieldRow label={t('form.name')} required>
        <FormSelect value={a.name ?? ''} onChange={(v) => up('name', v)} options={attrOptions} placeholder={t('form.placeholder.attribute')} allowClear />
      </FieldRow>
      <FieldRow label={t('form.alias')}>
        <FormInput value={a.alias ?? ''} onChange={(v) => up('alias', v)} placeholder={t('form.placeholder.alias')} mono />
      </FieldRow>
      <FieldRow label={t('form.aggregate')}>
        <FormSelect
          value={a.aggregate ?? ''}
          onChange={(v) => up('aggregate', v)}
          options={['', 'count', 'countcolumn', 'sum', 'avg', 'min', 'max'].map((v) => ({ value: v, label: v || '(none)' }))}
          allowClear
        />
      </FieldRow>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <FieldRow label={t('form.groupby')}>
          <FormSwitch checked={a.groupby === 'true'} onChange={(v) => up('groupby', v ? 'true' : 'false')} />
        </FieldRow>
        <FieldRow label={t('form.distinct')}>
          <FormSwitch checked={a.distinct === 'true'} onChange={(v) => up('distinct', v ? 'true' : 'false')} />
        </FieldRow>
        <FieldRow label={t('form.userTimezone')}>
          <FormSwitch checked={a['user-timezone'] === 'true'} onChange={(v) => up('user-timezone', v ? 'true' : 'false')} />
        </FieldRow>
      </div>
      <FieldRow label={t('form.dategrouping')}>
        <FormSelect
          value={a.dategrouping ?? ''}
          onChange={(v) => up('dategrouping', v)}
          options={['', 'day', 'week', 'month', 'quarter', 'year', 'fiscal-period', 'fiscal-year'].map((v) => ({ value: v, label: v || '(none)' }))}
          allowClear
        />
      </FieldRow>
    </NodeFormWrapper>
  )
}

// ─── AllAttributesForm ────────────────────────────────────────────────────────

function AllAttributesForm({ id }: { id: string }) {
  const { t } = useTranslation()
  return (
    <NodeFormWrapper nodeId={id} type="all-attributes">
      <p style={{ color: 'var(--color-text-muted)', fontSize: 12, margin: 0 }}>
        {t('node.allAttributes')} — {t('form.name')}: (all)
      </p>
    </NodeFormWrapper>
  )
}

// ─── FilterForm ───────────────────────────────────────────────────────────────

function FilterForm({ id }: { id: string }) {
  const { t } = useTranslation()
  const { root, updateNodeAttrs } = useFxbStore()
  const node = findNode(root, id)
  if (!node) return null
  const a = node.attrs
  const up = (k: string, v: string) => updateNodeAttrs(id, { [k]: v })

  return (
    <NodeFormWrapper nodeId={id} type="filter">
      <FieldRow label={t('form.filterType')}>
        <FormSelect
          value={a.type ?? 'and'}
          onChange={(v) => up('type', v)}
          options={[{ value: 'and', label: 'AND' }, { value: 'or', label: 'OR' }]}
        />
      </FieldRow>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <FieldRow label={t('form.isQuickFind')}>
          <FormSwitch
            checked={a.isquickfindfields === 'true'}
            onChange={(v) => up('isquickfindfields', v ? 'true' : 'false')}
          />
        </FieldRow>
        <FieldRow label={t('form.overrideQFLimitApply')}>
          <FormSwitch
            checked={a.overridequickfindrecordlimitenabled === 'true'}
            onChange={(v) => up('overridequickfindrecordlimitenabled', v ? 'true' : 'false')}
          />
        </FieldRow>
        <FieldRow label={t('form.overrideQFLimitBypass')}>
          <FormSwitch
            checked={a.overridequickfindrecordlimitdisabled === 'true'}
            onChange={(v) => up('overridequickfindrecordlimitdisabled', v ? 'true' : 'false')}
          />
        </FieldRow>
      </div>
      <FieldRow label={t('form.hint')}>
        <FormSelect
          value={a.hint ?? ''}
          onChange={(v) => up('hint', v)}
          options={[
            { value: '', label: '(none)' },
            { value: 'union', label: 'union' },
          ]}
          allowClear
        />
      </FieldRow>
    </NodeFormWrapper>
  )
}

// ─── ConditionForm ────────────────────────────────────────────────────────────

function ConditionForm({ id }: { id: string }) {
  const { t } = useTranslation()
  const { root, updateNodeAttrs, addChildNode, removeNode } = useFxbStore()
  const node = findNode(root, id)
  if (!node) return null
  const a = node.attrs
  const up = (k: string, v: string) => updateNodeAttrs(id, { [k]: v })

  const findParentEntityName = (): string => {
    const walk = (n: typeof root, target: string, ancestors: typeof root[]): typeof root[] | null => {
      if (n.id === target) return ancestors
      for (const c of n.children) {
        const r = walk(c, target, [...ancestors, n])
        if (r) return r
      }
      return null
    }
    const path = walk(root, id, []) ?? []
    for (let i = path.length - 1; i >= 0; i--) {
      if (path[i].type === 'entity' || path[i].type === 'link-entity') {
        return path[i].attrs.name ?? ''
      }
    }
    return ''
  }

  const parentEntity = findParentEntityName()
  const attrOptions = getMockAttributes(parentEntity).map((attr) => ({ value: attr.logicalName, label: attr.logicalName }))
  const operatorOptions = CONDITION_OPERATORS.map((op) => ({ value: op.value, label: op.label }))
  const selectedOp = CONDITION_OPERATORS.find((op) => op.value === (a.operator ?? 'eq'))
  const showValue = selectedOp?.hasValue ?? true
  const isMultiValue = selectedOp?.multiValue ?? false
  const isTwoValues = selectedOp?.requiresTwoValues ?? false

  // Current <value> child nodes
  const valueChildren = node.children.filter((c) => c.type === 'value')

  const renderValueUI = () => {
    if (!showValue) return null

    if (isMultiValue && isTwoValues) {
      // Between / not-between / in-fiscal-period-and-year: exactly 2 value nodes
      const v0 = valueChildren[0]
      const v1 = valueChildren[1]
      return (
        <FieldRow label={t('form.value')}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <FormInput
              value={v0?.attrs['#text'] ?? ''}
              onChange={(v) => {
                if (v0) updateNodeAttrs(v0.id, { '#text': v })
                else addChildNode(id, 'value')
              }}
              placeholder="From"
              mono
            />
            <FormInput
              value={v1?.attrs['#text'] ?? ''}
              onChange={(v) => {
                if (v1) updateNodeAttrs(v1.id, { '#text': v })
                else addChildNode(id, 'value')
              }}
              placeholder="To"
              mono
            />
          </Space>
        </FieldRow>
      )
    }

    if (isMultiValue) {
      // In / not-in / contain-values / not-contain-values: dynamic list
      return (
        <FieldRow label={t('form.value')}>
          <Space direction="vertical" style={{ width: '100%' }}>
            {valueChildren.map((vc) => (
              <Space key={vc.id} style={{ width: '100%' }}>
                <FormInput
                  value={vc.attrs['#text'] ?? ''}
                  onChange={(v) => updateNodeAttrs(vc.id, { '#text': v })}
                  placeholder={t('form.placeholder.value')}
                  mono
                />
                <Button
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => removeNode(vc.id)}
                />
              </Space>
            ))}
            <Button
              size="small"
              icon={<PlusOutlined />}
              onClick={() => addChildNode(id, 'value')}
            >
              Add value
            </Button>
          </Space>
        </FieldRow>
      )
    }

    // Single value
    return (
      <FieldRow label={t('form.value')}>
        <FormInput value={a.value ?? ''} onChange={(v) => up('value', v)} placeholder={t('form.placeholder.value')} mono />
      </FieldRow>
    )
  }

  return (
    <NodeFormWrapper nodeId={id} type="condition">
      <FieldRow label={t('form.attribute')} required>
        <FormSelect value={a.attribute ?? ''} onChange={(v) => up('attribute', v)} options={attrOptions} placeholder={t('form.placeholder.attribute')} allowClear />
      </FieldRow>
      <FieldRow label={t('form.operator')}>
        <FormSelect value={a.operator ?? 'eq'} onChange={(v) => up('operator', v)} options={operatorOptions} />
      </FieldRow>
      {renderValueUI()}
      <FieldRow label={t('form.entityname')}>
        <FormInput value={a.entityname ?? ''} onChange={(v) => up('entityname', v)} placeholder="(cross-entity)" mono />
      </FieldRow>
    </NodeFormWrapper>
  )
}

// ─── OrderForm ────────────────────────────────────────────────────────────────

function OrderForm({ id }: { id: string }) {
  const { t } = useTranslation()
  const { root, updateNodeAttrs } = useFxbStore()
  const node = findNode(root, id)
  if (!node) return null
  const a = node.attrs
  const up = (k: string, v: string) => updateNodeAttrs(id, { [k]: v })

  const findParentEntityName = (): string => {
    const walk = (n: typeof root, target: string, ancestors: typeof root[]): typeof root[] | null => {
      if (n.id === target) return ancestors
      for (const c of n.children) {
        const r = walk(c, target, [...ancestors, n])
        if (r) return r
      }
      return null
    }
    const path = walk(root, id, []) ?? []
    for (let i = path.length - 1; i >= 0; i--) {
      if (path[i].type === 'entity' || path[i].type === 'link-entity') return path[i].attrs.name ?? ''
    }
    return ''
  }

  const parentEntity = findParentEntityName()
  const attrOptions = getMockAttributes(parentEntity).map((attr) => ({ value: attr.logicalName, label: attr.logicalName }))

  return (
    <NodeFormWrapper nodeId={id} type="order">
      <FieldRow label={t('form.attribute')}>
        <FormSelect value={a.attribute ?? ''} onChange={(v) => up('attribute', v)} options={attrOptions} placeholder={t('form.placeholder.attribute')} allowClear />
      </FieldRow>
      <FieldRow label={t('form.alias')}>
        <FormInput value={a.alias ?? ''} onChange={(v) => up('alias', v)} placeholder={t('form.placeholder.alias')} mono />
      </FieldRow>
      <FieldRow label={t('form.descending')}>
        <FormSwitch
          checked={a.descending === 'true'}
          onChange={(v) => up('descending', v ? 'true' : 'false')}
          label={a.descending === 'true' ? '↓ DESC' : '↑ ASC'}
        />
      </FieldRow>
    </NodeFormWrapper>
  )
}

// ─── ValueForm ────────────────────────────────────────────────────────────────

function ValueForm({ id }: { id: string }) {
  const { t } = useTranslation()
  const { root, updateNodeAttrs } = useFxbStore()
  const node = findNode(root, id)
  if (!node) return null
  const a = node.attrs
  const up = (k: string, v: string) => updateNodeAttrs(id, { [k]: v })

  return (
    <NodeFormWrapper nodeId={id} type="value">
      <FieldRow label={t('form.value')} required>
        <FormInput value={a['#text'] ?? ''} onChange={(v) => up('#text', v)} placeholder={t('form.placeholder.value')} mono />
      </FieldRow>
    </NodeFormWrapper>
  )
}

// ─── CommentForm ──────────────────────────────────────────────────────────────

function CommentForm({ id }: { id: string }) {
  const { t } = useTranslation()
  const { root, updateNodeAttrs } = useFxbStore()
  const node = findNode(root, id)
  if (!node) return null
  const a = node.attrs
  const up = (k: string, v: string) => updateNodeAttrs(id, { [k]: v })

  return (
    <NodeFormWrapper nodeId={id} type="#comment">
      <FieldRow label={t('node.comment')}>
        <Input.TextArea
          value={a['#comment'] ?? ''}
          onChange={(e) => up('#comment', e.target.value)}
          placeholder="// comment"
          rows={3}
          style={{ fontFamily: 'var(--font-mono)', fontSize: 12, borderRadius: 6 }}
        />
      </FieldRow>
    </NodeFormWrapper>
  )
}

// ─── Dispatcher ───────────────────────────────────────────────────────────────

interface NodeFormDispatcherProps {
  nodeId: string
}

export function NodeFormDispatcher({ nodeId }: NodeFormDispatcherProps) {
  const { root } = useFxbStore()
  const node = findNode(root, nodeId)
  if (!node) return null

  switch (node.type) {
    case 'fetch':         return <FetchForm id={nodeId} />
    case 'entity':        return <EntityForm id={nodeId} />
    case 'link-entity':   return <LinkEntityForm id={nodeId} />
    case 'attribute':     return <AttributeForm id={nodeId} />
    case 'all-attributes':return <AllAttributesForm id={nodeId} />
    case 'filter':        return <FilterForm id={nodeId} />
    case 'condition':     return <ConditionForm id={nodeId} />
    case 'order':         return <OrderForm id={nodeId} />
    case 'value':         return <ValueForm id={nodeId} />
    case '#comment':      return <CommentForm id={nodeId} />
    default:              return null
  }
}
