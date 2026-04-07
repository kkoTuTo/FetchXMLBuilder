/**
 * Code generators – produce code snippets from a FetchXML string.
 * Ported from the Converters directory of the original C# plugin.
 */

import { serialiseFetchXml, parseFetchXml } from '../parser/xmlParser.ts'
import type { FetchNode } from '../ast/types.ts'
import { generateCSharpQueryExpression } from './csharpQueryExpression.ts'
import type { QExOptions } from './csharpQueryExpression.ts'
export type { QExStyle, QExFlavor, QExOptions } from './csharpQueryExpression.ts'
export { QEXSTYLE_LABELS, QEXSTYLE_INFO, QEXFLAVOR_LABELS } from './csharpQueryExpression.ts'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function a(node: FetchNode, key: string): string {
  return node.attrs[key] ?? ''
}

function children(node: FetchNode, type: string): FetchNode[] {
  return node.children.filter((c) => c.type === type)
}

function indent(n: number): string {
  return '  '.repeat(n)
}

// ─── FetchXML (clean pretty-print) ───────────────────────────────────────────

export function generateFetchXml(fetchXml: string): string {
  try {
    return serialiseFetchXml(parseFetchXml(fetchXml))
  } catch {
    return fetchXml
  }
}

// ─── OData v4 (Web API) URL ──────────────────────────────────────────────────
// Ported from ODataCodeGenerator.cs - ConvertToOData2 method

/** Generates an OData URL representation from a FetchXML string.
 *  Ported from C# ODataCodeGenerator.cs ConvertToOData2 method.
 *  Supports $select, $expand, $filter, $orderby, $top.
 */
export function generateODataUrl(
  fetchXml: string,
  baseUrl = 'https://[org].crm.dynamics.com/api/data/v9.2',
): string {
  try {
    const root = parseFetchXml(fetchXml)
    const entity = children(root, 'entity')[0]
    if (!entity) return '(No entity defined)'

    const entityName = a(entity, 'name')
    if (!entityName) return '(Entity name not set)'

    const collectionName = entityName.endsWith('y')
      ? entityName.slice(0, -1) + 'ies'
      : entityName + 's'

    const parts: string[] = []

    // $select - from entity attributes and link-entity expanded attributes
    let select = getODataSelect(entity)
    const expand = getODataExpand(entity, (expandedSelect) => {
      if (expandedSelect) {
        select = select ? `${select},${expandedSelect}` : expandedSelect
      }
    })
    if (select) parts.push(`$select=${select}`)

    // $top
    const top = a(root, 'top') || a(root, 'count')
    if (top) parts.push(`$top=${top}`)

    // $orderby
    const order = getODataOrder(entity)
    if (order) parts.push(`$orderby=${order}`)

    // $expand
    if (expand) parts.push(`$expand=${expand}`)

    // $filter
    const filter = getODataFilter(entity)
    if (filter) parts.push(`$filter=${filter}`)

    const qs = parts.length ? '?' + parts.join('&') : ''
    return `${baseUrl}/${collectionName}${qs}`
  } catch {
    return '(Invalid FetchXML)'
  }
}

/** Get $select clause from entity attributes.
 *  Ported from ODataCodeGenerator.cs GetSelect method.
 */
function getODataSelect(entity: FetchNode): string {
  const attrs = children(entity, 'attribute')
    .filter((n) => a(n, 'name'))
    .map((n) => a(n, 'name'))
  return attrs.join(',')
}

/** Get $expand clause from link-entity nodes.
 *  Ported from ODataCodeGenerator.cs GetExpand method.
 */
function getODataExpand(entity: FetchNode, updateSelect: (expandedSelect: string) => void): string {
  const links = children(entity, 'link-entity')
  if (links.length === 0) return ''

  const expands: string[] = []
  const expandedSelects: string[] = []

  for (const link of links) {
    // Use relationship name or schema name as fallback
    const relationName = getRelationName(entity, link)
    if (!relationName) continue

    expands.push(relationName)

    // Get expanded select for this link entity
    const expanded = getODataExpandedSelect(link, relationName)
    if (expanded) expandedSelects.push(expanded)
  }

  if (expandedSelects.length > 0) {
    updateSelect(expandedSelects.join(','))
  }

  return expands.join(',')
}

/** Get expanded select for a link-entity.
 *  Ported from ODataCodeGenerator.cs GetExpandedSelect method.
 */
function getODataExpandedSelect(link: FetchNode, relation: string): string {
  const attrs = children(link, 'attribute')
    .filter((n) => a(n, 'name'))
    .map((n) => `${relation}/${a(n, 'name')}`)
  return attrs.join(',')
}

/** Get relation name for a link-entity.
 *  Simplified version - in C# this uses metadata lookup.
 */
function getRelationName(_entity: FetchNode, link: FetchNode): string {
  // Try to use alias as relation name, or construct from entity names
  const alias = a(link, 'alias')
  const linkName = a(link, 'name')
  // entity name available via a(_entity, 'name') if needed for future use
  return alias || linkName || ''
}

/** Get $orderby clause from order nodes.
 *  Ported from ODataCodeGenerator.cs GetOrder method.
 */
function getODataOrder(entity: FetchNode): string {
  const orders = children(entity, 'order')
    .filter((o) => a(o, 'attribute'))
    .map((o) => {
      const attr = a(o, 'attribute')
      const desc = a(o, 'descending') === 'true' ? ' desc' : ''
      return attr + desc
    })
  return orders.join(',')
}

/** Get $filter clause from filter nodes.
 *  Ported from ODataCodeGenerator.cs GetFilter and GetCondition methods.
 */
function getODataFilter(entity: FetchNode): string {
  const filters = children(entity, 'filter').filter(
    (f) => f.children && f.children.length > 0
  )
  if (filters.length === 0) return ''

  const results: string[] = []
  for (const filter of filters) {
    const filterStr = buildODataFilter(entity, filter)
    if (filterStr) results.push(filterStr)
  }

  // Join multiple filters with AND
  if (results.length === 0) return ''
  if (results.length === 1) return results[0]
  return results.map((r) => `(${r})`).join(' and ')
}

/** Build OData filter string from a filter node.
 *  Ported from ODataCodeGenerator.cs GetFilter method.
 */
function buildODataFilter(entity: FetchNode, filter: FetchNode): string {
  if (!filter.children || filter.children.length === 0) return ''

  const logical = a(filter, 'type') === 'or' ? ' or ' : ' and '
  const parts: string[] = []

  for (const item of filter.children) {
    if (item.type === 'condition') {
      const cond = buildODataCondition(entity, item)
      if (cond) parts.push(cond)
    } else if (item.type === 'filter') {
      const nested = buildODataFilter(entity, item)
      if (nested) parts.push(nested)
    }
  }

  if (parts.length === 0) return ''
  if (parts.length === 1) return parts[0]

  const result = parts.join(logical)
  return `(${result})`
}

/** Build OData condition string from a condition node.
 *  Ported from ODataCodeGenerator.cs GetCondition method.
 */
function buildODataCondition(_entity: FetchNode, condition: FetchNode): string {
  const attr = a(condition, 'attribute')
  if (!attr) return ''

  const op = a(condition, 'operator')
  let value = a(condition, 'value')
  const values = children(condition, 'value').map((v) => a(v, '#text') || '')

  switch (op) {
    case 'eq':
    case 'ne':
    case 'lt':
    case 'le':
    case 'gt':
    case 'ge':
      return value !== undefined && value !== ''
        ? `${attr} ${op} ${formatODataValue(value)}`
        : `${attr} ${op}`

    case 'neq':
      return value !== undefined && value !== ''
        ? `${attr} ne ${formatODataValue(value)}`
        : `${attr} ne`

    case 'null':
      return `${attr} eq null`

    case 'not-null':
      return `${attr} ne null`

    case 'like':
      // substringof for OData v2, contains for v4
      if (value) {
        const cleanValue = value.replace(/^%|%$/g, '')
        if (value.startsWith('%') && value.endsWith('%')) {
          return `contains(${attr},${formatODataValue(cleanValue)})`
        }
        return `substringof(${formatODataValue(value)},${attr})`
      }
      return ''

    case 'not-like':
      if (value) {
        return `not substringof(${formatODataValue(value)},${attr})`
      }
      return ''

    case 'begins-with':
      return value ? `startswith(${attr},${formatODataValue(value)})` : ''

    case 'ends-with':
      return value ? `endswith(${attr},${formatODataValue(value)})` : ''

    case 'in':
      if (values.length > 0) {
        return values.map((v) => `${attr} eq ${formatODataValue(v)}`).join(' or ')
      }
      if (value) {
        return `${attr} eq ${formatODataValue(value)}`
      }
      return ''

    case 'not-in':
      if (values.length > 0) {
        return values.map((v) => `${attr} ne ${formatODataValue(v)}`).join(' and ')
      }
      if (value) {
        return `${attr} ne ${formatODataValue(value)}`
      }
      return ''

    case 'between':
      if (values.length >= 2) {
        return `(${attr} ge ${formatODataValue(values[0])} and ${attr} le ${formatODataValue(values[1])})`
      }
      return ''

    default:
      // Fallback for unknown operators
      return value !== undefined && value !== ''
        ? `${attr} ${op} ${formatODataValue(value)}`
        : `${attr} ${op}`
  }
}

/** Format a value for OData query string.
 *  Ported from ODataCodeGenerator.cs value formatting logic.
 */
function formatODataValue(value: string): string {
  // Check if it's a number
  if (/^-?\d+(\.\d+)?$/.test(value)) {
    return value
  }
  // Check if it's a GUID
  if (/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(value)) {
    return `${value}`
  }
  // String value - wrap in quotes
  return `'${value.replace(/'/g, "''")}'`
}

// ─── C# code generation ──────────────────────────────────────────────────────

export type CSharpStyle = 'fetchxml' | 'fetchexpression'

/**
 * C# FetchXML style – matching CSharpCodeGeneratorFetchXML.cs from the original plugin.
 * Produces a C# verbatim interpolated string ($@"...") where " is escaped as "".
 *
 * Example:
 *   var fetchXml = $@"<?xml version=""1.0"" encoding=""utf-8""?>
 *   <fetch>
 *     <entity name=""account"" />
 *   </fetch>";
 */
export function generateCSharpFetchXml(fetchXml: string): string {
  const pretty = generateFetchXml(fetchXml)
  // Escape double quotes as "" for C# verbatim string
  const escaped = pretty.replace(/"/g, '""')
  return `var fetchXml = $@"${escaped}";`
}

/**
 * C# FetchExpression style – matching CSharpCodeGeneratorFetchExpression.cs.
 * Replaces " with ' in XML and wraps in $@"...", then adds FetchExpression construction.
 *
 * Example:
 *   var fetch = $@"<?xml version='1.0' encoding='utf-8'?>
 *   <fetch>
 *     <entity name='account' />
 *   </fetch>";
 *
 *   var query = new FetchExpression(fetch);
 */
export function generateCSharpFetchExpression(fetchXml: string): string {
  const pretty = generateFetchXml(fetchXml)
  // Replace double quotes with single quotes (verbatim string needs no escaping then)
  const singleQuoted = pretty.replace(/"/g, "'")
  return [
    `var fetch = $@"${singleQuoted}";`,
    '',
    'var query = new FetchExpression(fetch);',
  ].join('\n')
}

/** Generate C# code in the requested style (defaults to 'fetchxml'). */
export function generateCSharpCode(fetchXml: string, style: CSharpStyle = 'fetchxml'): string {
  return style === 'fetchexpression'
    ? generateCSharpFetchExpression(fetchXml)
    : generateCSharpFetchXml(fetchXml)
}

// ─── JavaScript / TypeScript snippet ─────────────────────────────────────────

/**
 * Escape a value for use inside an XML attribute delimited by single quotes.
 * Mirrors SecurityElement.Escape() used in the original JavascriptCodeGenerator.cs.
 */
function escapeXmlAttrSingleQuote(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/**
 * Recursively convert a FetchNode to an array of indented XML line strings,
 * using single-quoted attribute values (matches JavascriptCodeGenerator.cs).
 * The root <fetch> element starts at depth 0; the XML declaration is omitted.
 */
function fetchNodeToLines(node: FetchNode, depth: number, lines: string[]): void {
  if (node.type === '#comment') {
    lines.push(`${indent(depth)}<!--${node.attrs['#comment'] ?? ''}-->`)
    return
  }

  const ind = indent(depth)
  const attrStr = Object.entries(node.attrs)
    .filter(([k]) => k !== '#text')
    .map(([k, v]) => ` ${k}='${escapeXmlAttrSingleQuote(v)}'`)
    .join('')

  const hasText = node.attrs['#text'] !== undefined
  const hasChildren = node.children.length > 0

  if (!hasChildren && !hasText) {
    lines.push(`${ind}<${node.type}${attrStr}/>`)
  } else if (hasText) {
    // Inline text content, e.g. <value>42</value>
    lines.push(`${ind}<${node.type}${attrStr}>${escapeXmlAttrSingleQuote(node.attrs['#text'] ?? '')}</${node.type}>`)
  } else {
    lines.push(`${ind}<${node.type}${attrStr}>`)
    for (const child of node.children) {
      fetchNodeToLines(child, depth + 1, lines)
    }
    lines.push(`${ind}</${node.type}>`)
  }
}

/**
 * JavaScript array-join format – matching JavascriptCodeGenerator.cs from the original plugin.
 * Omits the XML declaration; each element becomes a JSON-string array entry.
 *
 * Example:
 *   var fetchXml = [
 *   "<fetch>",
 *   "  <entity name='account'/>",
 *   "</fetch>"].join("");
 */
export function generateJavaScript(fetchXml: string): string {
  try {
    const root = parseFetchXml(fetchXml)
    const lines: string[] = []
    fetchNodeToLines(root, 0, lines)
    // JSON.stringify gives properly escaped double-quoted strings, matching
    // JsonConvert.SerializeObject() in the original C# generator.
    const arrayItems = lines.map((l) => JSON.stringify(l)).join(',\n')
    return `var fetchXml = [\n${arrayItems}].join("");`
  } catch {
    return '// Invalid FetchXML'
  }
}

// ─── Power Automate / Power FX note ──────────────────────────────────────────

export function generatePowerFx(fetchXml: string): string {
  try {
    const root = parseFetchXml(fetchXml)
    const entity = children(root, 'entity')[0]
    const entityName = entity ? a(entity, 'name') : '[entity]'
    const top = a(root, 'top') || '5000'

    return [
      '// Power Fx – Use in Power Apps',
      `// Fetch up to ${top} records from ${entityName}`,
      `ClearCollect(`,
      `  colResults,`,
      `  Filter([@${entityName}], /* add your conditions here */)`,
      `);`,
      '',
      '// For FetchXML execution via Power Automate, pass the fetchXml',
      '// string to the Dataverse connector "List rows" action with',
      '// the Fetch Xml Query parameter.',
    ].join('\n')
  } catch {
    return '(Invalid FetchXML)'
  }
}

// ─── SQL-like reference (read-only preview) ──────────────────────────────────
// Ported from SQLQueryGenerator.cs - GetSQLQuery method

/** Generates a SQL-like representation from a FetchXML string.
 *  Ported from C# SQLQueryGenerator.cs GetSQLQuery method.
 *  Supports SELECT, FROM, JOIN, WHERE, ORDER BY, TOP, DISTINCT, GROUP BY, HAVING.
 */
export function generateSqlReference(fetchXml: string): string {
  try {
    const root = parseFetchXml(fetchXml)
    const entity = children(root, 'entity')[0]
    if (!entity) return '-- No entity defined'

    const tableName = a(entity, 'name') || '?'
    const entityAlias = 'e' // Default alias for main entity

    // Track alias mappings for link entities
    const aliasMap = new Map<string, string>()

    // Build SELECT columns
    const selectCols = buildSqlSelect(entity, entityAlias, aliasMap)

    // Build ORDER BY columns
    const orderCols = buildSqlOrder(entity, entityAlias, aliasMap)

    // Build JOINs
    const joins = buildSqlJoins(entity, entityAlias, aliasMap)

    // Build WHERE clause
    const whereClause = buildSqlWhere(entity, entityAlias, aliasMap)

    // Build GROUP BY and HAVING
    const { groupBy, having } = buildSqlGroupByHaving(entity, entityAlias)

    // Assemble SQL
    const sql = new SqlBuilder()

    // SELECT with optional DISTINCT and TOP
    const distinct = a(root, 'distinct') === 'true' ? 'DISTINCT ' : ''
    const top = a(root, 'top')
    const topClause = top ? `TOP ${top} ` : ''

    sql.append(`SELECT ${distinct}${topClause}${selectCols.join(', ')}`)
    sql.append(`FROM ${tableName} AS ${entityAlias}`)

    // JOINs
    if (joins.length > 0) {
      joins.forEach((join) => sql.append(join))
    }

    // WHERE
    if (whereClause) {
      sql.append(`WHERE ${whereClause}`)
    }

    // GROUP BY
    if (groupBy.length > 0) {
      sql.append(`GROUP BY ${groupBy.join(', ')}`)
    }

    // HAVING
    if (having) {
      sql.append(`HAVING ${having}`)
    }

    // ORDER BY
    if (orderCols.length > 0) {
      sql.append(`ORDER BY ${orderCols.join(', ')}`)
    }

    return `-- SQL Reference (read-only, not executable against Dataverse)\n${sql.toString()}`
  } catch {
    return '-- Invalid FetchXML'
  }
}

/** SQL builder helper class for constructing SQL statements. */
class SqlBuilder {
  private lines: string[] = []

  append(line: string): void {
    this.lines.push(line)
  }

  toString(): string {
    return this.lines.join('\n')
  }
}

/** Build SELECT columns list.
 *  Ported from SQLQueryGenerator.cs GetSelect and GetExpandedSelect methods.
 */
function buildSqlSelect(
  entity: FetchNode,
  entityAlias: string,
  _aliasMap: Map<string, string>,
  linkAlias?: string,
): string[] {
  const result: string[] = []
  const attrs = children(entity, 'attribute')
  const allAttrs = entity.children.find((c) => c.type === 'all-attributes')

  if (allAttrs) {
    result.push(`${linkAlias || entityAlias}.*`)
  } else if (attrs.length > 0) {
    for (const attr of attrs) {
      const name = a(attr, 'name')
      const alias = a(attr, 'alias')
      const aggregate = a(attr, 'aggregate')
      const colAlias = linkAlias || entityAlias

      if (aggregate) {
        // Aggregate function: COUNT, SUM, AVG, MIN, MAX
        const funcName = aggregate.toUpperCase()
        const col = alias ? `${funcName}(${colAlias}.${name}) AS ${alias}` : `${funcName}(${colAlias}.${name})`
        result.push(col)
      } else {
        const col = alias ? `${colAlias}.${name} AS ${alias}` : `${colAlias}.${name}`
        result.push(col)
      }
    }
  } else {
    result.push('*')
  }

  // Add expanded selects from link entities
  const links = children(entity, 'link-entity')
  for (const link of links) {
    const linkAliasName = a(link, 'alias') || a(link, 'name')
    const expanded = buildSqlExpandedSelect(link, linkAliasName)
    result.push(...expanded)
  }

  // _aliasMap reserved for future use (e.g., entity name resolution)
  void _aliasMap

  return result
}

/** Build expanded SELECT columns from a link-entity.
 *  Ported from SQLQueryGenerator.cs GetExpandedSelect method.
 */
function buildSqlExpandedSelect(link: FetchNode, linkAlias: string): string[] {
  const result: string[] = []
  const attrs = children(link, 'attribute')

  for (const attr of attrs) {
    const name = a(attr, 'name')
    if (name) {
      result.push(`${linkAlias}.${name}`)
    }
  }

  // Recursively handle nested link-entities
  const nestedLinks = children(link, 'link-entity')
  for (const nested of nestedLinks) {
    const nestedAlias = a(nested, 'alias') || a(nested, 'name')
    const nestedExpanded = buildSqlExpandedSelect(nested, nestedAlias)
    result.push(...nestedExpanded)
  }

  // Suppress unused parameter warning - linkAlias is used above
  void linkAlias

  return result
}

/** Build JOIN clauses.
 *  Ported from SQLQueryGenerator.cs GetJoin method.
 */
function buildSqlJoins(
  entity: FetchNode,
  entityAlias: string,
  aliasMap: Map<string, string>,
  parentAlias?: string,
): string[] {
  const result: string[] = []
  const links = children(entity, 'link-entity')

  for (const link of links) {
    const linkName = a(link, 'name')
    const linkAlias = a(link, 'alias') || linkName
    const fromField = a(link, 'from')
    const toField = a(link, 'to')
    const linkType = a(link, 'link-type') || 'inner'

    // Track alias mapping
    if (linkAlias !== linkName) {
      aliasMap.set(linkAlias, linkName)
    }

    // Determine join type
    let joinTypeStr: string
    if (linkType === 'outer' || linkType.toUpperCase().includes('OUTER')) {
      joinTypeStr = 'LEFT OUTER JOIN'
    } else {
      joinTypeStr = 'INNER JOIN'
    }

    // Build join clause
    const parent = parentAlias || entityAlias
    const joinClause = `${joinTypeStr} ${linkName} AS ${linkAlias} ON ${linkAlias}.${fromField} = ${parent}.${toField}`
    result.push(joinClause)

    // Add filter conditions from link-entity to join clause
    const linkFilters = children(link, 'filter')
    if (linkFilters.length > 0) {
      const linkWhere = buildSqlWhereFromFilters(link, linkAlias, aliasMap)
      if (linkWhere) {
        // Replace the last join with extended version
        result[result.length - 1] = `${joinClause} AND ${linkWhere}`
      }
    }

    // Recursively handle nested link-entities
    const nestedJoins = buildSqlJoins(link, entityAlias, aliasMap, linkAlias)
    result.push(...nestedJoins)
  }

  return result
}

/** Build WHERE clause.
 *  Ported from SQLQueryGenerator.cs GetWhere and GetFilter methods.
 */
function buildSqlWhere(entity: FetchNode, entityAlias: string, aliasMap: Map<string, string>): string {
  const filters = children(entity, 'filter').filter((f) => f.children && f.children.length > 0)
  if (filters.length === 0) return ''

  const parts: string[] = []
  for (const filter of filters) {
    const filterStr = buildSqlFilter(entity, entityAlias, aliasMap, filter)
    if (filterStr) parts.push(filterStr)
  }

  return parts.join(' AND ')
}

/** Build WHERE clause from filters on a link-entity.
 *  Ported from SQLQueryGenerator.cs GetJoin method filter handling.
 */
function buildSqlWhereFromFilters(link: FetchNode, linkAlias: string, aliasMap: Map<string, string>): string {
  const filters = children(link, 'filter').filter((f) => f.children && f.children.length > 0)
  if (filters.length === 0) return ''

  const parts: string[] = []
  for (const filter of filters) {
    const filterStr = buildSqlFilter(link, linkAlias, aliasMap, filter)
    if (filterStr) parts.push(filterStr)
  }

  return parts.join(' AND ')
}

/** Build SQL filter string from a filter node.
 *  Ported from SQLQueryGenerator.cs GetFilter method.
 */
function buildSqlFilter(
  entity: FetchNode,
  entityAlias: string,
  aliasMap: Map<string, string>,
  filter: FetchNode,
): string {
  if (!filter.children || filter.children.length === 0) return ''

  const logicalOp = a(filter, 'type') === 'or' ? ' OR ' : ' AND '
  const parts: string[] = []

  for (const item of filter.children) {
    if (item.type === 'condition') {
      const cond = buildSqlCondition(entity, entityAlias, aliasMap, item)
      if (cond) parts.push(cond)
    } else if (item.type === 'filter') {
      const nested = buildSqlFilter(entity, entityAlias, aliasMap, item)
      if (nested) parts.push(nested)
    }
  }

  if (parts.length === 0) return ''
  if (parts.length === 1) return parts[0]

  const result = parts.join(logicalOp)
  return `(${result})`
}

/** Build SQL condition string from a condition node.
 *  Ported from SQLQueryGenerator.cs GetCondition method.
 */
function buildSqlCondition(
  _entity: FetchNode,
  entityAlias: string,
  aliasMap: Map<string, string>,
  condition: FetchNode,
): string {
  const result: string[] = []

  // Get entity name from condition or use alias
  const condEntityName = a(condition, 'entityname')
  let colPrefix = entityAlias

  if (condEntityName) {
    if (aliasMap.has(condEntityName)) {
      colPrefix = condEntityName
    } else {
      colPrefix = condEntityName
    }
  }

  const attr = a(condition, 'attribute')
  if (!attr) return ''

  result.push(`${colPrefix}.${attr}`)

  const op = a(condition, 'operator')
  let value = a(condition, 'value')
  const values = children(condition, 'value').map((v) => a(v, '#text') || '')

  switch (op) {
    case 'eq':
    case 'on':
      result.push('=')
      break

    case 'ne':
    case 'neq':
      result.push('<>')
      break

    case 'lt':
      result.push('<')
      break

    case 'le':
    case 'onorbefore':
      result.push('<=')
      break

    case 'gt':
      result.push('>')
      break

    case 'ge':
    case 'onorafter':
      result.push('>=')
      break

    case 'null':
      result.push('IS NULL')
      return result.join(' ')

    case 'not-null':
      result.push('IS NOT NULL')
      return result.join(' ')

    case 'like':
      result.push('LIKE')
      break

    case 'not-like':
      result.push('NOT LIKE')
      break

    case 'begins-with':
    case 'notbeginwith':
      result.push(op === 'begins-with' ? 'LIKE' : 'NOT LIKE')
      value = value ? `${value}%` : '%'
      break

    case 'ends-with':
    case 'notendwith':
      result.push(op === 'ends-with' ? 'LIKE' : 'NOT LIKE')
      value = value ? `%${value}` : '%'
      break

    case 'containvalues':
    case 'notcontainvalues':
      result.push(op === 'containvalues' ? 'LIKE' : 'NOT LIKE')
      value = value ? `%${value}%` : '%%'
      break

    case 'in':
      if (values.length > 0) {
        return `${colPrefix}.${attr} IN (${values.map((v) => formatSqlValue(v)).join(', ')})`
      }
      if (value) {
        return `${colPrefix}.${attr} IN (${formatSqlValue(value)})`
      }
      return ''

    case 'not-in':
      if (values.length > 0) {
        return `${colPrefix}.${attr} NOT IN (${values.map((v) => formatSqlValue(v)).join(', ')})`
      }
      if (value) {
        return `${colPrefix}.${attr} NOT IN (${formatSqlValue(value)})`
      }
      return ''

    case 'between':
      if (values.length >= 2) {
        return `${colPrefix}.${attr} BETWEEN ${formatSqlValue(values[0])} AND ${formatSqlValue(values[1])}`
      }
      return ''

    default:
      result.push(op ? op.toUpperCase() : '=')
  }

  // Add value if present and applicable
  if (value !== undefined && value !== '' && !['null', 'not-null'].includes(op || '')) {
    result.push(formatSqlValue(value))
  }

  return result.join(' ')
}

/** Format a value for SQL query.
 *  Ported from SQLQueryGenerator.cs value formatting logic.
 */
function formatSqlValue(value: string): string {
  // Check if it's a number
  if (/^-?\d+(\.\d+)?$/.test(value)) {
    return value
  }
  // String value - wrap in quotes
  return `'${value.replace(/'/g, "''")}'`
}

/** Build ORDER BY columns.
 *  Ported from SQLQueryGenerator.cs GetOrder method.
 */
function buildSqlOrder(
  entity: FetchNode,
  entityAlias: string,
  _aliasMap: Map<string, string>,
  linkAlias?: string,
): string[] {
  const result: string[] = []
  const orders = children(entity, 'order')

  for (const order of orders) {
    const attr = a(order, 'attribute')
    const alias = a(order, 'alias')
    const descending = a(order, 'descending') === 'true'

    if (!attr && !alias) continue

    const colName = alias || attr
    const prefix = linkAlias || entityAlias
    const orderStr = descending ? `${prefix}.${colName} DESC` : `${prefix}.${colName}`
    result.push(orderStr)
  }

  // Add orders from link entities
  const links = children(entity, 'link-entity')
  for (const link of links) {
    const linkAliasName = a(link, 'alias') || a(link, 'name')
    const linkOrders = buildSqlOrder(link, entityAlias, _aliasMap, linkAliasName)
    result.push(...linkOrders)
  }

  return result
}

/** Build GROUP BY and HAVING clauses.
 *  Ported from SQLQueryGenerator.cs aggregate handling.
 */
function buildSqlGroupByHaving(
  entity: FetchNode,
  entityAlias: string,
): { groupBy: string[]; having: string } {
  const groupBy: string[] = []
  const attrs = children(entity, 'attribute')

  // Find groupby attributes
  for (const attr of attrs) {
    if (a(attr, 'groupby') === 'true') {
      const name = a(attr, 'name')
      if (name) {
        groupBy.push(`${entityAlias}.${name}`)
      }
    }
  }

  // HAVING clause would come from filter conditions on aggregated fields
  // This is a simplified implementation
  const having = ''

  // entity parameter reserved for future use (e.g., nested link-entity groupby)
  void entity

  return { groupBy, having }
}

export type CodeLanguage = 'fetchxml' | 'odata' | 'csharp' | 'javascript' | 'powerfx' | 'sql'

export const CODE_LANGUAGE_LABELS: Record<CodeLanguage, string> = {
  fetchxml: 'FetchXML',
  odata: 'OData URL',
  csharp: 'C#',
  javascript: 'JavaScript',
  powerfx: 'Power Fx',
  sql: 'SQL (preview)',
}

export interface CodegenOptions {
  /** Only used when lang='csharp' and qexOptions is not set (legacy FetchXML/FetchExpression toggle) */
  csharpStyle?: CSharpStyle
  /** Full QEx / C# code generation options (supercedes csharpStyle when set) */
  qexOptions?: QExOptions
  baseUrl?: string
}

export function generateCode(lang: CodeLanguage, fetchXml: string, options?: CodegenOptions): string {
  switch (lang) {
    case 'fetchxml':
      return generateFetchXml(fetchXml)
    case 'odata':
      return generateODataUrl(fetchXml, options?.baseUrl)
    case 'csharp': {
      const qex = options?.qexOptions
      if (qex) {
        // Full QEx path (from style dropdown)
        const style = qex.style ?? 'FetchXML'
        if (style === 'FetchXML') {
          return generateCSharpFetchXml(fetchXml)
        }
        if (style === 'FetchExpression') {
          return generateCSharpFetchExpression(fetchXml)
        }
        return generateCSharpQueryExpression(fetchXml, qex)
      }
      // Legacy simple toggle
      return generateCSharpCode(fetchXml, options?.csharpStyle ?? 'fetchxml')
    }
    case 'javascript':
      return generateJavaScript(fetchXml)
    case 'powerfx':
      return generatePowerFx(fetchXml)
    case 'sql':
      return generateSqlReference(fetchXml)
  }
}
