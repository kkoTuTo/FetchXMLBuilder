/**
 * Node type badge colours and icons mapped from FetchNodeType.
 */
import type { FetchNodeType } from '@/core/ast/types.ts'

export const NODE_COLORS: Record<FetchNodeType, string> = {
  'fetch':        '#6366f1',
  'entity':       '#0ea5e9',
  'link-entity':  '#8b5cf6',
  'attribute':    '#10b981',
  'all-attributes':'#14b8a6',
  'filter':       '#f59e0b',
  'condition':    '#f97316',
  'order':        '#ec4899',
  'value':        '#84cc16',
  '#comment':     '#64748b',
}

export const NODE_ABBR: Record<FetchNodeType, string> = {
  'fetch':        'FE',
  'entity':       'EN',
  'link-entity':  'LE',
  'attribute':    'AT',
  'all-attributes':'AA',
  'filter':       'FI',
  'condition':    'CO',
  'order':        'OR',
  'value':        'VA',
  '#comment':     '//  ',
}

/** Human-readable label keys for node types */
export const NODE_LABEL_KEYS: Record<FetchNodeType, string> = {
  'fetch':        'node.fetch',
  'entity':       'node.entity',
  'link-entity':  'node.linkEntity',
  'attribute':    'node.attribute',
  'all-attributes':'node.allAttributes',
  'filter':       'node.filter',
  'condition':    'node.condition',
  'order':        'node.order',
  'value':        'node.value',
  '#comment':     'node.comment',
}

/** Get a concise display label for a node (name/alias/text) */
export function getNodeLabel(type: FetchNodeType, attrs: Record<string, string>): string {
  switch (type) {
    case 'fetch':         return attrs.top ? `top:${attrs.top}` : attrs.aggregate === 'true' ? 'aggregate' : ''
    case 'entity':        return attrs.name ?? ''
    case 'link-entity':   return attrs.name ? `${attrs.name}${attrs.alias ? ` (${attrs.alias})` : ''}` : ''
    case 'attribute':     return attrs.name ? `${attrs.name}${attrs.alias ? ` → ${attrs.alias}` : ''}` : ''
    case 'all-attributes':return ''
    case 'filter':        return attrs.type ?? 'and'
    case 'condition':     return attrs.attribute ? `${attrs.attribute} ${attrs.operator ?? 'eq'}${attrs.value ? ` "${attrs.value}"` : ''}` : ''
    case 'order':         return attrs.attribute ? `${attrs.attribute}${attrs.descending === 'true' ? ' ↓' : ' ↑'}` : ''
    case 'value':         return attrs['#text'] ?? ''
    case '#comment':      return attrs['#comment'] ? `// ${attrs['#comment']}` : '//'
    default:              return ''
  }
}
