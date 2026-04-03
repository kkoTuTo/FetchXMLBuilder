/**
 * Code generators – produce code snippets from a FetchXML string.
 * Ported from the Converters directory of the original C# plugin.
 */

import { serialiseFetchXml, parseFetchXml } from '../parser/xmlParser.ts'
import type { FetchNode } from '../ast/types.ts'

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

/** Generates a simple OData $filter representation from a FetchXML string.
 *  Full OData conversion requires metadata; this provides a structural preview. */
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

    // $select
    const attrs = children(entity, 'attribute').map((n) => a(n, 'name')).filter(Boolean)
    if (attrs.length > 0) parts.push(`$select=${attrs.join(',')}`)

    // $top
    const top = a(root, 'top') || a(root, 'count')
    if (top) parts.push(`$top=${top}`)

    // $orderby
    const orders = children(entity, 'order')
    if (orders.length > 0) {
      const orderParts = orders.map((o) => {
        const desc = a(o, 'descending') === 'true' ? ' desc' : ' asc'
        return a(o, 'attribute') + desc
      })
      parts.push(`$orderby=${orderParts.join(',')}`)
    }

    const qs = parts.length ? '?' + parts.join('&') : ''
    return `${baseUrl}/${collectionName}${qs}`
  } catch {
    return '(Invalid FetchXML)'
  }
}

// ─── C# FetchExpression snippet ──────────────────────────────────────────────

export function generateCSharpFetchExpression(fetchXml: string): string {
  const escaped = fetchXml
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .split('\n')
    .map((line) => `"${line}\\n"`)
    .join('\n  + ')

  return [
    '// C# – FetchExpression',
    'var fetchXml =',
    `  ${escaped};`,
    '',
    'var query = new FetchExpression(fetchXml);',
    'var results = service.RetrieveMultiple(query);',
  ].join('\n')
}

// ─── JavaScript / TypeScript snippet ─────────────────────────────────────────

export function generateJavaScript(fetchXml: string): string {
  // Escape backslashes first, then backticks and dollar signs for template literal embedding
  const escaped = fetchXml
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$/g, '\\$')
  return [
    '// JavaScript / TypeScript – Dataverse Web API',
    'const fetchXml = `',
    escaped,
    '`;',
    '',
    "const encodedFetch = encodeURIComponent(fetchXml.trim());",
    '',
    '// Adjust entity collection name as appropriate',
    "const response = await fetch(",
    "  `/api/data/v9.2/[entity-set]?fetchXml=${encodedFetch}`,",
    '  { headers: { "OData-MaxVersion": "4.0", "OData-Version": "4.0", Accept: "application/json" } }',
    ');',
    'const data = await response.json();',
    'console.log(data.value);',
  ].join('\n')
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

export function generateSqlReference(fetchXml: string): string {
  try {
    const root = parseFetchXml(fetchXml)
    const entity = children(root, 'entity')[0]
    if (!entity) return '-- No entity defined'

    const tableName = a(entity, 'name') || '?'
    const attrs = children(entity, 'attribute')
    const allAttrs = entity.children.find((c) => c.type === 'all-attributes')

    const selectCols =
      allAttrs || attrs.length === 0
        ? '*'
        : attrs
            .map((n) => {
              const name = a(n, 'name')
              const alias = a(n, 'alias')
              return alias ? `${name} AS ${alias}` : name
            })
            .join(', ')

    const lines: string[] = [`SELECT ${selectCols}`, `FROM ${tableName}`]

    // JOINs
    const links = children(entity, 'link-entity')
    for (const le of links) {
      const lt = a(le, 'link-type') || 'inner'
      const joinType = lt.toUpperCase().includes('OUTER') || lt === 'outer' ? 'LEFT OUTER JOIN' : 'INNER JOIN'
      lines.push(
        `${indent(1)}${joinType} ${a(le, 'name')} AS ${a(le, 'alias') || a(le, 'name')}` +
          ` ON ${tableName}.${a(le, 'from')} = ${a(le, 'alias') || a(le, 'name')}.${a(le, 'to')}`,
      )
    }

    // WHERE – flatten conditions
    const filters = children(entity, 'filter')
    if (filters.length > 0) {
      lines.push('WHERE')
      for (const filter of filters) {
        const conds = children(filter, 'condition')
        const filterType = (a(filter, 'type') || 'and').toUpperCase()
        const condStrs = conds.map((c) => {
          const op = a(c, 'operator')
          const val = a(c, 'value')
          const opStr = op === 'eq' ? '=' : op === 'ne' ? '<>' : op === 'gt' ? '>' : op === 'lt' ? '<' : op === 'ge' ? '>=' : op === 'le' ? '<=' : op === 'null' ? 'IS NULL' : op === 'not-null' ? 'IS NOT NULL' : op === 'like' ? 'LIKE' : op.toUpperCase()
          return val
            ? `  ${a(c, 'attribute')} ${opStr} '${val}'`
            : `  ${a(c, 'attribute')} ${opStr}`
        })
        lines.push(condStrs.join(`\n  ${filterType} `))
      }
    }

    // ORDER BY
    const orders = children(entity, 'order')
    if (orders.length > 0) {
      lines.push('ORDER BY')
      lines.push(
        orders
          .map((o) => {
            const desc = a(o, 'descending') === 'true' ? ' DESC' : ' ASC'
            return `  ${a(o, 'attribute')}${desc}`
          })
          .join(',\n'),
      )
    }

    // TOP
    const top = a(root, 'top')
    if (top) {
      lines[0] = `SELECT TOP(${top}) ${selectCols}`
    }

    return `-- SQL Reference (read-only, not executable against Dataverse)\n` + lines.join('\n')
  } catch {
    return '-- Invalid FetchXML'
  }
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

export function generateCode(lang: CodeLanguage, fetchXml: string, baseUrl?: string): string {
  switch (lang) {
    case 'fetchxml':
      return generateFetchXml(fetchXml)
    case 'odata':
      return generateODataUrl(fetchXml, baseUrl)
    case 'csharp':
      return generateCSharpFetchExpression(fetchXml)
    case 'javascript':
      return generateJavaScript(fetchXml)
    case 'powerfx':
      return generatePowerFx(fetchXml)
    case 'sql':
      return generateSqlReference(fetchXml)
  }
}
