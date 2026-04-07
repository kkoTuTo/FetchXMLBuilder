/**
 * Validation rules – ported from Validations.cs
 * Operates on the AST without any dependency on metadata (metadata-aware
 * checks are gated behind an optional EntityMeta parameter).
 */

import type { FetchNode, ValidationResult } from '../ast/types.ts'

/** Minimal attribute metadata shape (populated from Dataverse if available) */
export interface AttrMeta {
  logicalName: string
  isValidForGrid?: boolean
  isPrimaryId?: boolean
  attributeType?: string // 'Lookup' | 'UniqueIdentifier' | …
}

export interface EntityMeta {
  logicalName: string
  primaryIdAttribute?: string
  attributes?: AttrMeta[]
}

const ALLOWED_ALIAS_CHARS = /^[A-Za-z_][A-Za-z0-9_]*$/

export function validateAlias(alias: string | undefined): ValidationResult | null {
  if (!alias) return null
  if (!ALLOWED_ALIAS_CHARS.test(alias)) {
    return {
      level: 'error',
      message: 'validation.invalidAlias',
      params: { alias },
    }
  }
  return null
}

/** Helper: get attribute value from a node */
function attr(node: FetchNode, key: string): string {
  return node.attrs[key] ?? ''
}

/** Helper: find children of a given type */
function childrenOfType(node: FetchNode, type: string): FetchNode[] {
  return node.children.filter((c) => c.type === type)
}

/** Walk up the tree to find the nearest entity/link-entity ancestor name */
function getLocalEntityName(node: FetchNode, root: FetchNode): string {
  const path = findPath(root, node.id)
  if (!path) return ''
  for (let i = path.length - 1; i >= 0; i--) {
    const n = path[i]
    if (n.type === 'entity' || n.type === 'link-entity') {
      return attr(n, 'name')
    }
  }
  return ''
}

function findPath(root: FetchNode, id: string): FetchNode[] | null {
  if (root.id === id) return [root]
  for (const child of root.children) {
    const sub = findPath(child, id)
    if (sub) return [root, ...sub]
  }
  return null
}

function isFetchAggregate(root: FetchNode): boolean {
  return attr(root, 'aggregate') === 'true'
}

function isLocalEntityRoot(node: FetchNode, root: FetchNode): boolean {
  const path = findPath(root, node.id)
  if (!path) return false
  for (let i = path.length - 1; i >= 0; i--) {
    const n = path[i]
    if (n.type === 'entity') return true
    if (n.type === 'link-entity') return false
  }
  return false
}

// ─── Per-node validators ─────────────────────────────────────────────────────

function validateFetch(
  node: FetchNode,
): ValidationResult | null {
  if (!childrenOfType(node, 'entity').length) {
    return { level: 'error', message: 'validation.missingEntity' }
  }
  const ds = attr(node, 'datasource')
  if (ds && ds !== 'retained') {
    return { level: 'error', message: 'validation.invalidDatasource' }
  }
  if (ds === 'retained' && isFetchAggregate(node)) {
    return {
      level: 'error',
      message: 'validation.aggregateWithRetained',
      helpUrl:
        'https://learn.microsoft.com/en-us/power-apps/maker/data-platform/data-retention-view#limitations-for-retrieval-of-retained-data',
    }
  }
  return null
}

function validateEntity(
  node: FetchNode,
  _root: FetchNode,
  entities?: EntityMeta[],
): ValidationResult | null {
  const name = attr(node, 'name')
  if (!name) {
    return { level: 'warning', message: 'validation.entityNameRequired' }
  }
  if (entities && !entities.find((e) => e.logicalName === name)) {
    return { level: 'warning', message: 'validation.entityNotFound', params: { name } }
  }
  return null
}

function validateLinkEntity(
  node: FetchNode,
  root: FetchNode,
): ValidationResult | null {
  if (attr(root, 'datasource') === 'retained') {
    return {
      level: 'error',
      message: 'validation.linkEntityWithRetained',
      helpUrl:
        'https://learn.microsoft.com/en-us/power-apps/maker/data-platform/data-retention-view#limitations-for-retrieval-of-retained-data',
    }
  }
  const aliasCheck = validateAlias(attr(node, 'alias'))
  if (aliasCheck) return aliasCheck

  if (!attr(node, 'name') || !attr(node, 'to') || !attr(node, 'from')) {
    return {
      level: 'warning',
      message: 'validation.linkEntityAttributesRequired',
    }
  }

  // Find parent in tree
  const path = findPath(root, node.id)
  const parent = path && path.length > 1 ? path[path.length - 2] : null
  const linkType = attr(node, 'link-type')
  const subTypes = ['any', 'not any', 'all', 'not all']

  if (parent?.type === 'filter') {
    if (!subTypes.includes(linkType)) {
      return {
        level: 'error',
        message: 'validation.linkEntityFilterLinkType',
        helpUrl:
          'https://learn.microsoft.com/power-apps/developer/data-platform/fetchxml/filter-rows#filter-on-values-in-related-records',
      }
    }
    if (childrenOfType(node, 'attribute').length > 0) {
      return {
        level: 'warning',
        message: 'validation.linkEntityFilterNoAttributes',
        helpUrl:
          'https://learn.microsoft.com/power-apps/developer/data-platform/fetchxml/filter-rows#filter-on-values-in-related-records',
      }
    }
  } else if (subTypes.includes(linkType)) {
    return {
      level: 'error',
      message: 'validation.linkTypeOnlyInFilter',
      helpUrl:
        'https://learn.microsoft.com/power-apps/developer/data-platform/fetchxml/filter-rows#filter-on-values-in-related-records',
    }
  }
  return null
}

function validateAttribute(
  node: FetchNode,
  root: FetchNode,
  entities?: EntityMeta[],
): ValidationResult | null {
  const name = attr(node, 'name')
  if (!name) {
    return { level: 'warning', message: 'validation.attributeNameRequired' }
  }
  const aliasCheck = validateAlias(attr(node, 'alias'))
  if (aliasCheck) return aliasCheck

  if (entities) {
    const entityName = getLocalEntityName(node, root)
    const entity = entities.find((e) => e.logicalName === entityName)
    if (entity && !entity.attributes?.find((a) => a.logicalName === name)) {
      return {
        level: 'warning',
        message: 'validation.attributeNotFound',
        params: { name, entityName },
      }
    }
  }

  const path = findPath(root, node.id)
  const parent = path && path.length > 1 ? path[path.length - 2] : null
  if (parent?.type === 'filter') {
    return { level: 'error', message: 'validation.attributeUnderFilter' }
  }

  if (isFetchAggregate(root)) {
    if (!attr(node, 'alias')) {
      return {
        level: 'warning',
        message: 'validation.aggregateAliasRequired',
        helpUrl:
          'https://learn.microsoft.com/power-apps/developer/data-platform/fetchxml/aggregate-data#about-aggregation',
      }
    }
  } else if (attr(node, 'alias')) {
    return {
      level: 'info',
      message: 'validation.aliasNotRecommended',
    }
  }
  return null
}

function validateFilter(node: FetchNode): ValidationResult | null {
  if (node.children.length === 0) {
    return { level: 'info', message: 'validation.filterEmpty' }
  }
  return null
}

function validateCondition(
  node: FetchNode,
  root: FetchNode,
  entities?: EntityMeta[],
): ValidationResult | null {
  const attribute = attr(node, 'attribute')
  if (!attribute) {
    return { level: 'warning', message: 'validation.conditionAttributeRequired' }
  }
  const operator = attr(node, 'operator')
  if (operator === 'contains' || operator === 'does-not-contain') {
    return {
      level: 'error',
      message: 'validation.operatorNotSupported',
      params: { operator },
      helpUrl:
        'https://learn.microsoft.com/power-apps/developer/data-platform/fetchxml/reference/',
    }
  }
  const entityname = attr(node, 'entityname')
  if (entityname && !isLocalEntityRoot(node, root)) {
    return {
      level: 'error',
      message: 'validation.entitynameOnLinkEntity',
    }
  }
  if (!entityname && entities) {
    const entityName = getLocalEntityName(node, root)
    const entity = entities.find((e) => e.logicalName === entityName)
    if (entity && !entity.attributes?.find((a) => a.logicalName === attribute)) {
      return {
        level: 'warning',
        message: 'validation.conditionAttributeNotFound',
        params: { attribute, entityName },
      }
    }
  }
  return null
}

function validateValue(node: FetchNode): ValidationResult | null {
  if (!attr(node, '#text')) {
    return { level: 'warning', message: 'validation.valueEmpty' }
  }
  return null
}

function validateOrder(
  node: FetchNode,
  root: FetchNode,
  entities?: EntityMeta[],
): ValidationResult | null {
  const path = findPath(root, node.id)
  const parent = path && path.length > 1 ? path[path.length - 2] : null

  if (isFetchAggregate(root)) {
    if (!attr(node, 'alias')) {
      return {
        level: 'warning',
        message: 'validation.orderAliasRequired',
        helpUrl:
          'https://learn.microsoft.com/power-apps/developer/data-platform/fetchxml/aggregate-data#order-by',
      }
    }
    if (attr(node, 'attribute')) {
      return {
        level: 'warning',
        message: 'validation.orderAttributeNotAllowed',
        helpUrl:
          'https://learn.microsoft.com/power-apps/developer/data-platform/fetchxml/aggregate-data#order-by',
      }
    }
  } else {
    if (!attr(node, 'attribute')) {
      return { level: 'warning', message: 'validation.orderAttributeRequired' }
    }
    if (parent?.type === 'link-entity') {
      return {
        level: 'info',
        message: 'validation.linkEntityOrderLegacy',
        helpUrl:
          'https://learn.microsoft.com/power-apps/developer/data-platform/fetchxml/order-rows#process-link-entity-orders-first',
      }
    }
    const attribute = attr(node, 'attribute')
    if (entities && attribute) {
      const entityName = getLocalEntityName(node, root)
      const entity = entities.find((e) => e.logicalName === entityName)
      if (
        entity &&
        !entity.attributes?.find((a) => a.logicalName === attribute)
      ) {
        return {
          level: 'warning',
          message: 'validation.orderAttributeNotFound',
          params: { attribute, entityName },
        }
      }
    }
  }
  return null
}

// ─── Public API ──────────────────────────────────────────────────────────────

/** Validate a single node within its tree context */
export function validateNode(
  node: FetchNode,
  root: FetchNode,
  entities?: EntityMeta[],
): ValidationResult | null {
  switch (node.type) {
    case 'fetch':
      return validateFetch(node)
    case 'entity':
      return validateEntity(node, root, entities)
    case 'link-entity':
      return validateLinkEntity(node, root)
    case 'attribute':
      return validateAttribute(node, root, entities)
    case 'filter':
      return validateFilter(node)
    case 'condition':
      return validateCondition(node, root, entities)
    case 'value':
      return validateValue(node)
    case 'order':
      return validateOrder(node, root, entities)
    default:
      return null
  }
}

/** Collect all validation results across the entire tree */
export function validateTree(
  root: FetchNode,
  entities?: EntityMeta[],
): Map<string, ValidationResult> {
  const results = new Map<string, ValidationResult>()
  walk(root, root, entities, results)
  return results
}

function walk(
  node: FetchNode,
  root: FetchNode,
  entities: EntityMeta[] | undefined,
  results: Map<string, ValidationResult>,
) {
  const result = validateNode(node, root, entities)
  if (result) results.set(node.id, result)
  for (const child of node.children) {
    walk(child, root, entities, results)
  }
}
