/** Capabilities (allowed children, deletable, etc.) for each FetchXML node type – ported from FetchNodeCapabilities.cs */

import type { FetchNodeType } from './types.ts'

export interface NodeCapability {
  multiple: boolean
  deletable: boolean
  canComment: boolean
  canUncomment: boolean
  allowedChildren: Array<FetchNodeType | '-'>
}

const CAPS: Record<FetchNodeType, NodeCapability> = {
  fetch: {
    multiple: false,
    deletable: false,
    canComment: false,
    canUncomment: false,
    allowedChildren: ['entity', '-', '#comment'],
  },
  entity: {
    multiple: false,
    deletable: true,
    canComment: true,
    canUncomment: false,
    allowedChildren: [
      '-',
      'all-attributes',
      'attribute',
      'filter',
      'order',
      'link-entity',
      '-',
      '#comment',
    ],
  },
  'link-entity': {
    multiple: true,
    deletable: true,
    canComment: true,
    canUncomment: false,
    allowedChildren: [
      '-',
      'all-attributes',
      'attribute',
      'filter',
      'order',
      'link-entity',
      '-',
      '#comment',
    ],
  },
  attribute: {
    multiple: true,
    deletable: true,
    canComment: true,
    canUncomment: false,
    allowedChildren: ['#comment'],
  },
  'all-attributes': {
    multiple: false,
    deletable: true,
    canComment: true,
    canUncomment: false,
    allowedChildren: ['#comment'],
  },
  filter: {
    multiple: true,
    deletable: true,
    canComment: true,
    canUncomment: false,
    allowedChildren: ['condition', 'link-entity', 'filter', '-', '#comment'],
  },
  condition: {
    multiple: true,
    deletable: true,
    canComment: true,
    canUncomment: false,
    allowedChildren: ['value', '-', '#comment'],
  },
  order: {
    multiple: true,
    deletable: true,
    canComment: true,
    canUncomment: false,
    allowedChildren: ['#comment'],
  },
  value: {
    multiple: true,
    deletable: true,
    canComment: true,
    canUncomment: false,
    allowedChildren: ['#comment'],
  },
  '#comment': {
    multiple: true,
    deletable: true,
    canComment: false,
    canUncomment: true,
    allowedChildren: [],
  },
}

export function getCapability(type: FetchNodeType): NodeCapability {
  return CAPS[type]
}

export function getAllowedChildTypes(
  type: FetchNodeType,
): Array<FetchNodeType | '-'> {
  return CAPS[type].allowedChildren
}
