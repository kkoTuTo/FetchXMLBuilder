/**
 * C# QueryExpression / QueryByAttribute / FluentQueryExpression / QueryExpressionFactory
 * code generator from FetchNode AST.
 *
 * Ported from Rappen.XTB.FetchXmlBuilder.Converters.CSharpCodeGenerator (C#).
 *
 * Supports LateBound (plain-strings) flavor only – EarlyBound/EBG/LCG require
 * CRM metadata not available in the browser.
 */

import { parseFetchXml } from '../parser/xmlParser.ts'
import type { FetchNode } from '../ast/types.ts'

// ─── Public types ─────────────────────────────────────────────────────────────

export type QExStyle =
  | 'QueryExpression'
  | 'FetchExpression'
  | 'QueryByAttribute'
  | 'FluentQueryExpression'
  | 'FetchXML'
  | 'OrganizationServiceContext'
  | 'QueryExpressionFactory'

export type QExFlavor =
  | 'LateBound'         // Plain strings – no metadata needed
  | 'EBGconstants'      // EBG V2 – requires metadata
  | 'LCGconstants'      // LCG   – requires metadata
  | 'EarlyBound'        // Early Bound – requires metadata

export interface QExOptions {
  style?: QExStyle
  flavor?: QExFlavor
  objectInitializer?: boolean
  indents?: number
  includeComments?: boolean
  filterVariables?: boolean
}

export const QEXSTYLE_LABELS: Record<QExStyle, string> = {
  QueryExpression: 'QueryExpression',
  FetchExpression: 'FetchExpression',
  QueryByAttribute: 'QueryByAttribute',
  FluentQueryExpression: 'FluentQueryExpression',
  FetchXML: 'FetchXML',
  OrganizationServiceContext: 'OrganizationServiceContext',
  QueryExpressionFactory: 'QueryExpressionFactory',
}

export const QEXSTYLE_INFO: Record<QExStyle, { creator: string; className: string; helpUrl: string }> = {
  QueryExpression: {
    creator: 'Microsoft',
    className: 'Microsoft.CrmSdk.CoreAssemblies',
    helpUrl: 'https://learn.microsoft.com/en-us/power-apps/developer/data-platform/org-service/samples/retrieve-multiple-queryexpression-class',
  },
  FetchExpression: {
    creator: 'Microsoft',
    className: 'Microsoft.CrmSdk.CoreAssemblies',
    helpUrl: 'https://learn.microsoft.com/power-apps/developer/data-platform/org-service/entity-operations-query-data',
  },
  QueryByAttribute: {
    creator: 'Microsoft',
    className: 'Microsoft.CrmSdk.CoreAssemblies',
    helpUrl: 'https://learn.microsoft.com/en-us/power-apps/developer/data-platform/org-service/samples/retrieve-multiple-querybyattribute-class',
  },
  FluentQueryExpression: {
    creator: 'MscrmTools',
    className: 'MscrmTools.FluentQueryExpressions',
    helpUrl: 'https://github.com/MscrmTools/MscrmTools.FluentQueryExpressions',
  },
  FetchXML: {
    creator: 'Microsoft',
    className: 'plain fetchxml',
    helpUrl: 'https://learn.microsoft.com/en-us/power-apps/developer/data-platform/use-fetchxml-construct-query',
  },
  OrganizationServiceContext: {
    creator: 'Microsoft',
    className: 'Microsoft.Xrm.Sdk.Client',
    helpUrl: 'https://learn.microsoft.com/en-us/power-apps/developer/data-platform/org-service/build-queries-with-linq-net-language-integrated-query',
  },
  QueryExpressionFactory: {
    creator: 'Daryl LaBar',
    className: 'DLaB.Xrm',
    helpUrl: 'https://github.com/daryllabar/DLaB.Xrm/wiki/Query-Helpers',
  },
}

export const QEXFLAVOR_LABELS: Record<QExFlavor, string> = {
  LateBound: 'Plain strings',
  EBGconstants: 'Early Bound by EBG V2',
  LCGconstants: 'Late Bound by LCG',
  EarlyBound: 'Early Bound with OrgSvcCntx',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const CRLF = '\n'

function ind(n: number): string {
  return '    '.repeat(n)
}

function attr(node: FetchNode, key: string): string {
  return node.attrs[key] ?? ''
}

function kids(node: FetchNode, type: string): FetchNode[] {
  return node.children.filter((c) => c.type === type)
}

/** Map FetchXML condition operator to ConditionOperator enum value. */
function toConditionOperator(op: string): string {
  const map: Record<string, string> = {
    eq: 'Equal',
    ne: 'NotEqual',
    neq: 'NotEqual',
    lt: 'LessThan',
    le: 'LessEqual',
    gt: 'GreaterThan',
    ge: 'GreaterEqual',
    null: 'Null',
    'not-null': 'NotNull',
    like: 'Like',
    'not-like': 'NotLike',
    'begins-with': 'BeginsWith',
    'not-begin-with': 'DoesNotBeginWith',
    'ends-with': 'EndsWith',
    'not-end-with': 'DoesNotEndWith',
    in: 'In',
    'not-in': 'NotIn',
    between: 'Between',
    'not-between': 'NotBetween',
    today: 'Today',
    yesterday: 'Yesterday',
    tomorrow: 'Tomorrow',
    'this-week': 'ThisWeek',
    'last-week': 'LastWeek',
    'next-week': 'NextWeek',
    'this-month': 'ThisMonth',
    'last-month': 'LastMonth',
    'next-month': 'NextMonth',
    'this-year': 'ThisYear',
    'last-year': 'LastYear',
    'next-year': 'NextYear',
    'this-fiscal-year': 'ThisFiscalYear',
    'this-fiscal-period': 'ThisFiscalPeriod',
    'last-fiscal-year': 'LastFiscalYear',
    'last-fiscal-period': 'LastFiscalPeriod',
    'next-fiscal-year': 'NextFiscalYear',
    'next-fiscal-period': 'NextFiscalPeriod',
    'last-x-days': 'LastXDays',
    'next-x-days': 'NextXDays',
    'last-x-hours': 'LastXHours',
    'next-x-hours': 'NextXHours',
    'last-x-months': 'LastXMonths',
    'next-x-months': 'NextXMonths',
    'last-x-weeks': 'LastXWeeks',
    'next-x-weeks': 'NextXWeeks',
    'last-x-years': 'LastXYears',
    'next-x-years': 'NextXYears',
    'older-than-x-minutes': 'OlderThanXMinutes',
    'older-than-x-hours': 'OlderThanXHours',
    'older-than-x-days': 'OlderThanXDays',
    'older-than-x-weeks': 'OlderThanXWeeks',
    'older-than-x-months': 'OlderThanXMonths',
    'older-than-x-years': 'OlderThanXYears',
    on: 'On',
    'on-or-before': 'OnOrBefore',
    'on-or-after': 'OnOrAfter',
    'eq-userid': 'EqualUserId',
    'ne-userid': 'NotEqualUserId',
    'eq-businessid': 'EqualBusinessId',
    'ne-businessid': 'NotEqualBusinessId',
    'eq-userlanguage': 'EqualUserLanguage',
    'eq-useroruserhierarchy': 'EqualUserOrUserHierarchy',
    'eq-useroruserhierarchyandteams': 'EqualUserOrUserHierarchyAndTeams',
    'eq-useroruserteams': 'EqualUserOrUserTeams',
    'eq-userteams': 'EqualUserTeams',
    'contain-values': 'ContainValues',
    'not-contain-values': 'DoesNotContainValues',
    containvalues: 'ContainValues',
    notcontainvalues: 'DoesNotContainValues',
  }
  return map[op] ?? op.replace(/-/g, '_').replace(/^[a-z]/, (c) => c.toUpperCase())
}

/** Map FetchXML link-type to JoinOperator enum value. */
function toJoinOperator(linkType: string): string {
  switch (linkType) {
    case 'outer':
      return 'LeftOuter'
    case 'any':
      return 'Inner'
    case 'not any':
    case 'exists':
      return 'Exists'
    case 'in':
      return 'In'
    case 'matchfirstrowusingcrossapply':
      return 'MatchFirstRowUsingCrossApply'
    default:
      return 'Inner'
  }
}

/** Convert a condition value string to a typed C# literal. */
function toValueLiteral(value: string): string {
  if (value === 'true' || value === 'false') return value
  if (/^-?\d+$/.test(value)) return value
  if (/^-?\d+\.\d+$/.test(value)) return value
  // GUID
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
    return `new Guid("${value}")`
  }
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
}

/** Get all <value> child text values from a condition node. */
function getConditionValues(cond: FetchNode): string[] {
  return kids(cond, 'value').map((v) => v.attrs['#text'] ?? '')
}

/** Build the condition values list as a comma-separated C# argument string. */
function buildConditionValueArgs(cond: FetchNode, filterVars: boolean, varMap: Map<string, string>): string {
  const inlineVal = attr(cond, 'value')
  const multiValues = getConditionValues(cond)

  if (multiValues.length > 0) {
    return ', ' + multiValues.map((v) => toValueLiteral(v)).join(', ')
  }

  if (!inlineVal) return ''

  if (filterVars) {
    const attrName = attr(cond, 'attribute')
    const key = ensureUniqueKey(attrName, varMap)
    varMap.set(key, inlineVal)
    return `, fetchData.${key} /*${inlineVal.replace(/\*\//g, '')}*/`
  }
  return ', ' + toValueLiteral(inlineVal)
}

function ensureUniqueKey(base: string, map: Map<string, string>): string {
  let key = base
  let suffix = 1
  while (map.has(key)) {
    suffix++
    key = base + suffix
  }
  return key
}

// ─── Main entry point ─────────────────────────────────────────────────────────

export function generateCSharpQueryExpression(fetchXml: string, opts: QExOptions = {}): string {
  const {
    style = 'QueryExpression',
    flavor = 'LateBound',
    objectInitializer = false,
    indents = 0,
    includeComments = true,
    filterVariables = true,
  } = opts

  // Styles that need metadata – not implemented in browser
  if (flavor !== 'LateBound') {
    return (
      `/* ${QEXFLAVOR_LABELS[flavor]} (${flavor}) flavor requires CRM metadata and is not\n` +
      ` * available in the web version without an active connection.\n` +
      ` * Use the desktop XrmToolBox plugin for this flavor.\n` +
      ` */`
    )
  }

  if (style === 'OrganizationServiceContext') {
    return (
      `/* OrganizationServiceContext / LINQ style requires generating early-bound\n` +
      ` * entity classes and is not available in the web version.\n` +
      ` */`
    )
  }

  try {
    const root = parseFetchXml(fetchXml)
    const entityNode = kids(root, 'entity')[0]
    if (!entityNode) return '/* No entity defined */'

    const gen = new QExGenerator(root, entityNode, { style, objectInitializer, indents, includeComments, filterVariables })
    return gen.generate()
  } catch (e) {
    return `/* Failed to generate ${style} code: ${e instanceof Error ? e.message : String(e)} */`
  }
}

// ─── Generator class ──────────────────────────────────────────────────────────

class QExGenerator {
  private root: FetchNode
  private entity: FetchNode
  private style: Exclude<QExStyle, 'FetchExpression' | 'FetchXML' | 'OrganizationServiceContext'>
  private oi: boolean       // object initializer
  private baseIndent: number
  private comments: boolean
  private filterVars: boolean
  private varMap = new Map<string, string>()
  private betweenChar: string

  constructor(
    root: FetchNode,
    entity: FetchNode,
    opts: Required<Omit<QExOptions, 'flavor'>>,
  ) {
    this.root = root
    this.entity = entity
    this.style = opts.style as Exclude<QExStyle, 'FetchExpression' | 'FetchXML' | 'OrganizationServiceContext'>
    this.oi = opts.objectInitializer
    this.baseIndent = opts.indents
    this.comments = opts.includeComments
    this.filterVars = opts.filterVariables
    this.betweenChar = this.style === 'FluentQueryExpression' ? '' : ','
  }

  generate(): string {
    const entityName = attr(this.entity, 'name')
    const qName = this.getVarName(this.getQueryObjectName())
    let code: string

    if (this.oi) {
      code = this.generateOI(entityName, qName)
    } else {
      code = this.generateLbL(entityName, qName)
    }

    if (this.varMap.size > 0) {
      const varLines = Array.from(this.varMap.entries())
        .map(([k, v]) => `    ${k} = "${v.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}",`)
        .join(CRLF)
      code = `var fetchData = new${CRLF}{${CRLF}${varLines}${CRLF}};${CRLF}${CRLF}` + code
    }

    // Apply base indentation
    if (this.baseIndent > 0) {
      const prefix = ind(this.baseIndent)
      code = code.split('\n').map((l) => prefix + l).join('\n')
    }

    return code
  }

  // ─── Object Initializer style ───────────────────────────────────────────

  private generateOI(entityName: string, qName: string): string {
    const className = this.getClassName()
    const ent = `"${entityName}"`

    let code = ''
    if (this.comments) {
      code += `// Instantiate ${className} ${qName}${CRLF}`
    }

    const props: string[] = []

    // Top / distinct / no-lock / page info
    const topVal = attr(this.root, 'top')
    const countVal = attr(this.root, 'count')
    const pageVal = attr(this.root, 'page')
    const distinct = attr(this.root, 'distinct')
    const noLock = attr(this.root, 'no-lock')

    // Columns
    const colsCode = this.getColumnsOI(entityName, 1)
    if (colsCode) props.push(colsCode)

    // Criteria
    const criteriaCode = this.getFilterOI(this.entity, qName, 1)
    if (criteriaCode) props.push(criteriaCode)

    // Orders (not for FluentQEx – chained differently)
    if (this.style !== 'FluentQueryExpression' && this.style !== 'QueryExpressionFactory') {
      const ordersCode = this.getOrdersOI(entityName, this.entity, 1)
      if (ordersCode) props.push(ordersCode)

      // Link entities
      const linksCode = this.getLinkEntitiesOI(this.entity, qName, 1)
      if (linksCode) props.push(linksCode)
    }

    switch (this.style) {
      case 'FluentQueryExpression':
        code += `var ${qName} = new Query(${ent})`
        if (props.length) code += CRLF + props.join(CRLF)
        code += ';'
        break

      case 'QueryExpressionFactory': {
        code += `var ${qName} = ${className}.Create(${ent}`
        if (colsCode) {
          code += `,${CRLF}${this.getColumnsOI(entityName, 1)}`
        }
        code += `);${CRLF}`
        // additional props as assignments
        const extraProps: string[] = []
        if (distinct === 'true') extraProps.push(`${qName}.Distinct = true;`)
        if (topVal) extraProps.push(`${qName}.TopCount = ${topVal};`)
        if (noLock === 'true') extraProps.push(`${qName}.NoLock = true;`)
        if (countVal) extraProps.push(`${qName}.PageInfo.Count = ${countVal};`)
        if (pageVal) extraProps.push(`${qName}.PageInfo.PageNumber = ${pageVal};`)
        if (extraProps.length) code += extraProps.join(CRLF) + CRLF
        // link entities + orders via LbL for factory
        const linksLbl = this.getLinkEntitiesLbL(this.entity, qName)
        if (linksLbl) code += linksLbl
        const ordersLbl = this.getOrdersLbL(entityName, this.entity, qName, true)
        if (ordersLbl) code += ordersLbl
        break
      }

      default: {
        code += `var ${qName} = new ${className}(${ent})${CRLF}{${CRLF}`
        // query-level options
        if (distinct === 'true') props.unshift(`    Distinct = true`)
        if (topVal) props.unshift(`    TopCount = ${topVal}`)
        if (noLock === 'true') props.unshift(`    NoLock = true`)
        if (countVal) props.unshift(`    PageInfo = new PagingInfo { Count = ${countVal}${pageVal ? `, PageNumber = ${pageVal}` : ''} }`)
        if (props.length) code += props.join(`${this.betweenChar}${CRLF}`) + CRLF
        code += `};`
        break
      }
    }

    return code
  }

  // ─── Line-by-line style ──────────────────────────────────────────────────

  private generateLbL(entityName: string, qName: string): string {
    const className = this.getClassName()
    const ent = `"${entityName}"`

    let code = ''
    if (this.comments) {
      code += `// Instantiate ${className} ${qName}${CRLF}`
    }
    // QueryExpressionFactory uses static Create() method, not new
    if (this.style === 'QueryExpressionFactory') {
      code += `var ${qName} = ${className}.Create(${ent});${CRLF}`
    } else {
      code += `var ${qName} = new ${className}(${ent});${CRLF}`
    }

    // Top / distinct / nolock / paging
    const topVal = attr(this.root, 'top')
    const countVal = attr(this.root, 'count')
    const pageVal = attr(this.root, 'page')
    const distinct = attr(this.root, 'distinct')
    const noLock = attr(this.root, 'no-lock')

    if (distinct === 'true') code += `${qName}.Distinct = true;${CRLF}`
    if (topVal) code += `${qName}.TopCount = ${topVal};${CRLF}`
    if (noLock === 'true') code += `${qName}.NoLock = true;${CRLF}`
    if (countVal) {
      code += `${qName}.PageInfo.Count = ${countVal};${CRLF}`
      if (pageVal) code += `${qName}.PageInfo.PageNumber = ${pageVal};${CRLF}`
    }

    // Columns
    const colsCode = this.getColumnsLbL(entityName, qName)
    if (colsCode) code += colsCode

    // Criteria
    const filterCode = this.getFilterLbL(this.entity, qName)
    if (filterCode) code += filterCode

    // Orders
    const ordersCode = this.getOrdersLbL(entityName, this.entity, qName, true)
    if (ordersCode) code += ordersCode

    // Link entities
    const linksCode = this.getLinkEntitiesLbL(this.entity, qName)
    if (linksCode) code += linksCode

    return code
  }

  // ─── Columns ─────────────────────────────────────────────────────────────

  private getColumnsOI(_entity: string, level: number): string {
    const allAttr = this.entity.children.find((c) => c.type === 'all-attributes')
    const attrNodes = kids(this.entity, 'attribute')

    if (allAttr) {
      return `${ind(level)}ColumnSet = new ColumnSet(true)`
    }
    if (attrNodes.length === 0) {
      return `${ind(level)}ColumnSet = new ColumnSet()`
    }
    const cols = attrNodes.map((n) => `"${attr(n, 'name')}"`).join(', ')
    return `${ind(level)}ColumnSet = new ColumnSet(${cols})`
  }

  private getColumnsLbL(_entity: string, owner: string): string {
    const allAttr = this.entity.children.find((c) => c.type === 'all-attributes')
    const attrNodes = kids(this.entity, 'attribute')
    const colOwner = this.style === 'QueryByAttribute'
      ? `${owner}.ColumnSet`
      : `${owner}.ColumnSet`

    if (allAttr) {
      if (this.comments) return `// Add all columns${CRLF}${colOwner}.AllColumns = true;${CRLF}`
      return `${colOwner}.AllColumns = true;${CRLF}`
    }
    if (attrNodes.length === 0) return ''

    const cols = attrNodes.map((n) => `"${attr(n, 'name')}"`).join(', ')
    if (this.comments) {
      return `// Add columns to ${owner}${CRLF}${colOwner}.AddColumns(${cols});${CRLF}`
    }
    return `${colOwner}.AddColumns(${cols});${CRLF}`
  }

  // ─── Filters ─────────────────────────────────────────────────────────────

  private getFilterOI(entityNode: FetchNode, _owner: string, level: number): string {
    const filters = kids(entityNode, 'filter')
    if (filters.length === 0) return ''

    const parts: string[] = []
    for (const filter of filters) {
      const part = this.buildFilterOI(filter, level)
      if (part) parts.push(part)
    }
    if (parts.length === 0) return ''

    switch (this.style) {
      case 'FluentQueryExpression':
        return parts.join(CRLF)
      default:
        return `${ind(level)}Criteria =${CRLF}${ind(level)}{${CRLF}${parts.join(`${this.betweenChar}${CRLF}`)}${CRLF}${ind(level)}}`
    }
  }

  private buildFilterOI(filter: FetchNode, level: number): string {
    const type = attr(filter, 'type') || 'and'
    const logicalOp = type === 'or' ? 'Or' : 'And'
    const conds = kids(filter, 'condition')
    const subFilters = kids(filter, 'filter')

    if (conds.length === 0 && subFilters.length === 0) return ''

    switch (this.style) {
      case 'FluentQueryExpression': {
        const lines: string[] = []
        for (const cond of conds) {
          lines.push(this.buildConditionFluent(cond, level))
        }
        for (const sub of subFilters) {
          lines.push(this.buildFilterOI(sub, level))
        }
        return lines.filter(Boolean).join(CRLF)
      }

      case 'QueryByAttribute': {
        // QueryByAttribute only supports flat attribute=value conditions
        const attrList = conds.map((c) => `"${attr(c, 'attribute')}"`).join(', ')
        const valList = conds.map((c) => this.getCondValueLiteral(c)).join(', ')
        return [
          `${ind(level)}Attributes = { ${attrList} }`,
          `${ind(level)}Values = { ${valList} }`,
        ].join(`${this.betweenChar}${CRLF}`)
      }

      default: {
        const condLines: string[] = []
        if (logicalOp !== 'And') {
          condLines.push(`${ind(level + 1)}FilterOperator = LogicalOperator.${logicalOp}`)
        }
        for (const cond of conds) {
          condLines.push(this.buildConditionOI(cond, level + 1))
        }
        for (const sub of subFilters) {
          condLines.push(this.buildSubFilterOI(sub, level + 1))
        }
        const condStr = condLines.filter(Boolean).join(`${this.betweenChar}${CRLF}`)
        return `${ind(level)}Criteria = new FilterExpression${CRLF}${ind(level)}{${CRLF}${condStr}${CRLF}${ind(level)}}`
      }
    }
  }

  private buildSubFilterOI(filter: FetchNode, level: number): string {
    const type = attr(filter, 'type') || 'and'
    const logicalOp = type === 'or' ? 'Or' : 'And'
    const conds = kids(filter, 'condition')
    const subFilters = kids(filter, 'filter')

    const parts: string[] = []
    if (logicalOp !== 'And') {
      parts.push(`${ind(level + 1)}FilterOperator = LogicalOperator.${logicalOp}`)
    }
    for (const cond of conds) {
      parts.push(this.buildConditionOI(cond, level + 1))
    }
    for (const sub of subFilters) {
      parts.push(this.buildSubFilterOI(sub, level + 1))
    }
    return `${ind(level)}new FilterExpression${CRLF}${ind(level)}{${CRLF}${parts.filter(Boolean).join(`${this.betweenChar}${CRLF}`)}${CRLF}${ind(level)}}`
  }

  private buildConditionOI(cond: FetchNode, level: number): string {
    const attribute = attr(cond, 'attribute')
    const op = attr(cond, 'operator')
    const condOp = toConditionOperator(op)
    const entityName = attr(cond, 'entityname')
    const entityArg = entityName ? `"${entityName}", ` : ''
    const values = buildConditionValueArgs(cond, this.filterVars, this.varMap)
    return `${ind(level)}new ConditionExpression(${entityArg}"${attribute}", ConditionOperator.${condOp}${values})`
  }

  private buildConditionFluent(cond: FetchNode, level: number): string {
    const attribute = attr(cond, 'attribute')
    const op = attr(cond, 'operator')
    const condOp = toConditionOperator(op)
    const values = buildConditionValueArgs(cond, this.filterVars, this.varMap)
    return `${ind(level)}.Where${condOp}("${attribute}"${values})`
  }

  private getCondValueLiteral(cond: FetchNode): string {
    const val = attr(cond, 'value')
    return toValueLiteral(val)
  }

  private getFilterLbL(entityNode: FetchNode, owner: string): string {
    const filters = kids(entityNode, 'filter')
    if (filters.length === 0) return ''

    let code = ''
    for (const filter of filters) {
      code += this.buildFilterLbL(filter, owner)
    }
    return code
  }

  private buildFilterLbL(filter: FetchNode, owner: string): string {
    const type = attr(filter, 'type') || 'and'
    const logicalOp = type === 'or' ? 'Or' : 'And'
    const conds = kids(filter, 'condition')
    const subFilters = kids(filter, 'filter')
    const criteriaOwner = `${owner}.Criteria`

    let code = ''
    if (logicalOp !== 'And') {
      code += `${criteriaOwner}.FilterOperator = LogicalOperator.${logicalOp};${CRLF}`
    }

    for (const cond of conds) {
      const attribute = attr(cond, 'attribute')
      const op = attr(cond, 'operator')
      const condOp = toConditionOperator(op)
      const entityName = attr(cond, 'entityname')
      const entityArg = entityName ? `"${entityName}", ` : ''
      const values = buildConditionValueArgs(cond, this.filterVars, this.varMap)
      if (this.style === 'QueryByAttribute') {
        const val = attr(cond, 'value')
        code += `${owner}.AddAttributeValue("${attribute}", ${toValueLiteral(val)});${CRLF}`
      } else {
        code += `${criteriaOwner}.AddCondition(${entityArg}"${attribute}", ConditionOperator.${condOp}${values});${CRLF}`
      }
    }

    for (const sub of subFilters) {
      const subType = attr(sub, 'type') || 'and'
      const subLogical = subType === 'or' ? 'Or' : 'And'
      const subName = `filter_${attribute_counter++}`
      code += `var ${subName} = ${criteriaOwner}.AddFilter(LogicalOperator.${subLogical});${CRLF}`
      const subConds = kids(sub, 'condition')
      for (const cond of subConds) {
        const attribute = attr(cond, 'attribute')
        const op = attr(cond, 'operator')
        const condOp = toConditionOperator(op)
        const values = buildConditionValueArgs(cond, this.filterVars, this.varMap)
        code += `${subName}.AddCondition("${attribute}", ConditionOperator.${condOp}${values});${CRLF}`
      }
    }
    return code
  }

  // ─── Orders ──────────────────────────────────────────────────────────────

  private getOrdersOI(_entityName: string, entityNode: FetchNode, level: number): string {
    const orderNodes = kids(entityNode, 'order')
    if (orderNodes.length === 0) return ''

    switch (this.style) {
      case 'FluentQueryExpression': {
        return orderNodes
          .map((o) => {
            const desc = attr(o, 'descending') === 'true'
            return `${ind(level)}.OrderBy${desc ? 'Descending' : ''}("${attr(o, 'attribute')}")`
          })
          .join(CRLF)
      }
      default: {
        const orderLines = orderNodes.map((o) => {
          const desc = attr(o, 'descending') === 'true' ? 'Descending' : 'Ascending'
          return `${ind(level + 1)}new OrderExpression("${attr(o, 'attribute')}", OrderType.${desc})`
        })
        return `${ind(level)}Orders =${CRLF}${ind(level)}{${CRLF}${orderLines.join(`${this.betweenChar}${CRLF}`)}${CRLF}${ind(level)}}`
      }
    }
  }

  private getOrdersLbL(_entityName: string, entityNode: FetchNode, owner: string, isRoot: boolean): string {
    const orderNodes = kids(entityNode, 'order')
    if (orderNodes.length === 0) return ''

    let code = ''
    if (this.comments && isRoot) {
      code += `// Add orders to ${owner}${CRLF}`
    }
    for (const o of orderNodes) {
      const desc = attr(o, 'descending') === 'true' ? 'Descending' : 'Ascending'
      switch (this.style) {
        case 'QueryByAttribute':
          code += `${owner}.AddOrder("${attr(o, 'attribute')}", OrderType.${desc});${CRLF}`
          break
        case 'FluentQueryExpression':
          code += `${owner}.OrderBy${desc === 'Descending' ? 'Descending' : ''}("${attr(o, 'attribute')}");${CRLF}`
          break
        default:
          code += `${owner}.AddOrder("${attr(o, 'attribute')}", OrderType.${desc});${CRLF}`
      }
    }
    return code
  }

  // ─── Link Entities ───────────────────────────────────────────────────────

  private getLinkEntitiesOI(entityNode: FetchNode, owner: string, level: number): string {
    const linkNodes = kids(entityNode, 'link-entity')
    if (linkNodes.length === 0) return ''

    if (this.style === 'QueryByAttribute') {
      return `/* Link entities are not supported for QueryByAttribute. Use QueryExpression instead. */`
    }

    switch (this.style) {
      case 'FluentQueryExpression': {
        return linkNodes.map((le) => this.buildLinkEntityFluent(le, level)).join(CRLF)
      }
      default: {
        const linkLines = linkNodes.map((le) => this.buildLinkEntityOI(le, owner, level + 1))
        return `${ind(level)}LinkEntities =${CRLF}${ind(level)}{${CRLF}${linkLines.join(`${this.betweenChar}${CRLF}`)}${CRLF}${ind(level)}}`
      }
    }
  }

  private buildLinkEntityOI(le: FetchNode, _owner: string, level: number): string {
    const name = attr(le, 'name')
    const from = attr(le, 'from')
    const to = attr(le, 'to')
    const alias = attr(le, 'alias')
    const linkType = attr(le, 'link-type') || 'inner'
    const joinOp = toJoinOperator(linkType)

    const props: string[] = [
      `${ind(level + 1)}LinkFromEntityName = "${_owner.replace(/^.*\./, '')}",`,
      // Using actual parent entity name from current context would need tracking
      // For simplicity, use the link definition
      `${ind(level + 1)}LinkToEntityName = "${name}",`,
      `${ind(level + 1)}LinkFromAttributeName = "${to}",`,
      `${ind(level + 1)}LinkToAttributeName = "${from}",`,
      `${ind(level + 1)}JoinOperator = JoinOperator.${joinOp},`,
    ]
    if (alias) props.push(`${ind(level + 1)}EntityAlias = "${alias}",`)

    const leName = alias || name
    const attrNodes = kids(le, 'attribute')
    if (attrNodes.length > 0) {
      const cols = attrNodes.map((n) => `"${attr(n, 'name')}"`).join(', ')
      props.push(`${ind(level + 1)}Columns = new ColumnSet(${cols}),`)
    }

    const filterCode = this.getFilterOI(le, leName, level + 1)
    if (filterCode) props.push(filterCode + ',')

    const orderCode = this.getOrdersOI(name, le, level + 1)
    if (orderCode) props.push(orderCode + ',')

    const subLinks = this.getLinkEntitiesOI(le, leName, level + 1)
    if (subLinks) props.push(subLinks + ',')

    return `${ind(level)}new LinkEntity${CRLF}${ind(level)}{${CRLF}${props.join(CRLF)}${CRLF}${ind(level)}}`
  }

  private buildLinkEntityFluent(le: FetchNode, level: number): string {
    const name = attr(le, 'name')
    const from = attr(le, 'from')
    const to = attr(le, 'to')
    const alias = attr(le, 'alias')
    const linkType = attr(le, 'link-type') || 'inner'
    const joinOp = toJoinOperator(linkType)

    let code = `${ind(level)}.AddLink(new Link("${name}", "${to}", "${from}", JoinOperator.${joinOp})`
    if (alias) code += `${CRLF}${ind(level + 1)}.SetAlias("${alias}")`

    const attrNodes = kids(le, 'attribute')
    if (attrNodes.length > 0) {
      const cols = attrNodes.map((n) => `"${attr(n, 'name')}"`).join(', ')
      code += `${CRLF}${ind(level + 1)}.Select(${cols})`
    }

    const filterNodes = kids(le, 'filter')
    for (const filter of filterNodes) {
      const conds = kids(filter, 'condition')
      for (const cond of conds) {
        code += CRLF + this.buildConditionFluent(cond, level + 1)
      }
    }

    const orderNodes = kids(le, 'order')
    for (const o of orderNodes) {
      const desc = attr(o, 'descending') === 'true'
      code += `${CRLF}${ind(level + 1)}.OrderBy${desc ? 'Descending' : ''}("${attr(o, 'attribute')}")`
    }

    const subLinks = kids(le, 'link-entity')
    for (const sub of subLinks) {
      code += CRLF + this.buildLinkEntityFluent(sub, level + 1)
    }

    code += ')'
    return code
  }

  private getLinkEntitiesLbL(entityNode: FetchNode, owner: string): string {
    const linkNodes = kids(entityNode, 'link-entity')
    if (linkNodes.length === 0) return ''

    if (this.style === 'QueryByAttribute') {
      return `/* Link entities are not supported for QueryByAttribute. */\n`
    }

    let code = ''
    for (const le of linkNodes) {
      code += this.buildLinkEntityLbL(le, owner)
    }
    return code
  }

  private buildLinkEntityLbL(le: FetchNode, owner: string): string {
    const name = attr(le, 'name')
    const from = attr(le, 'from')
    const to = attr(le, 'to')
    const alias = attr(le, 'alias')
    const linkType = attr(le, 'link-type') || 'inner'
    const joinOp = toJoinOperator(linkType)

    const leName = this.getVarName(alias || `${owner}_${name}`)

    let code = ''
    if (this.comments) {
      code += `// Add link-entity ${leName}${CRLF}`
    }

    switch (this.style) {
      case 'QueryExpressionFactory':
        code += `${owner}.AddLink("${name}", "${to}", "${from}", JoinOperator.${joinOp}`
        if (alias) code += `, "${alias}"`
        code += `);${CRLF}`
        break
      default: {
        code += `var ${leName} = ${owner}.AddLink("${name}", "${to}", "${from}", JoinOperator.${joinOp});${CRLF}`
        if (alias) code += `${leName}.EntityAlias = "${alias}";${CRLF}`

        const attrNodes = kids(le, 'attribute')
        if (attrNodes.length > 0) {
          const cols = attrNodes.map((n) => `"${attr(n, 'name')}"`).join(', ')
          code += `${leName}.Columns.AddColumns(${cols});${CRLF}`
        }

        code += this.getFilterLbL(le, leName)
        code += this.getOrdersLbL(name, le, leName, false)
        code += this.getLinkEntitiesLbL(le, leName)
        break
      }
    }
    return code
  }

  // ─── Style helpers ───────────────────────────────────────────────────────

  private getClassName(): string {
    switch (this.style) {
      case 'FluentQueryExpression': return 'Query'
      case 'QueryExpressionFactory': return 'QueryExpressionFactory'
      default: return this.style
    }
  }

  private getQueryObjectName(): string {
    switch (this.style) {
      case 'QueryExpression': return 'query'
      case 'QueryByAttribute': return 'qrybyattr'
      case 'QueryExpressionFactory': return 'fctqry'
      case 'FluentQueryExpression': return 'fluqry'
      default: return 'qry'
    }
  }

  private usedVarNames = new Set<string>()

  private getVarName(base: string): string {
    // sanitise
    const clean = base.replace(/[^a-zA-Z0-9_]/g, '_')
    let name = clean
    let i = 1
    while (this.usedVarNames.has(name)) {
      name = `${clean}_${i++}`
    }
    this.usedVarNames.add(name)
    return name
  }
}

// module-level counter for sub-filter variable names
let attribute_counter = 0
