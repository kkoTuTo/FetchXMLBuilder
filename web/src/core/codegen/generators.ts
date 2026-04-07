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

export interface CodegenOptions {
  csharpStyle?: CSharpStyle
  baseUrl?: string
}

export function generateCode(lang: CodeLanguage, fetchXml: string, options?: CodegenOptions): string {
  switch (lang) {
    case 'fetchxml':
      return generateFetchXml(fetchXml)
    case 'odata':
      return generateODataUrl(fetchXml, options?.baseUrl)
    case 'csharp':
      return generateCSharpCode(fetchXml, options?.csharpStyle ?? 'fetchxml')
    case 'javascript':
      return generateJavaScript(fetchXml)
    case 'powerfx':
      return generatePowerFx(fetchXml)
    case 'sql':
      return generateSqlReference(fetchXml)
  }
}
