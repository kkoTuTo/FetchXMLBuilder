/** FetchXML AST – mirrors the XML schema used by Microsoft Dataverse */

export type FetchNodeType =
  | 'fetch'
  | 'entity'
  | 'link-entity'
  | 'attribute'
  | 'all-attributes'
  | 'filter'
  | 'condition'
  | 'order'
  | 'value'
  | '#comment'

export type FilterType = 'and' | 'or'

export type LinkType =
  | 'inner'
  | 'outer'
  | 'any'
  | 'not any'
  | 'all'
  | 'not all'
  | 'exists'
  | 'in'
  | 'matchfirstrowusingcrossapply'

export type AggregateType =
  | 'count'
  | 'countcolumn'
  | 'sum'
  | 'avg'
  | 'min'
  | 'max'

export type DateGroupingType =
  | 'day'
  | 'week'
  | 'month'
  | 'quarter'
  | 'year'
  | 'fiscal-period'
  | 'fiscal-year'

/** Generic attribute bag – key/value pairs from the XML element */
export type AttrBag = Record<string, string>

/** A single node in the FetchXML AST */
export interface FetchNode {
  /** Unique runtime id (not persisted in XML) */
  id: string
  /** XML element name  */
  type: FetchNodeType
  /** XML attributes */
  attrs: AttrBag
  /** Child nodes */
  children: FetchNode[]
}

// ─── Typed attribute helpers ───────────────────────────────────────────────

export interface FetchAttrs {
  version?: string
  count?: string
  page?: string
  'paging-cookie'?: string
  top?: string
  aggregate?: 'true' | 'false'
  distinct?: 'true' | 'false'
  'no-lock'?: 'true' | 'false'
  datasource?: '' | 'retained'
  returntotalrecordcount?: 'true' | 'false'
  mapping?: 'logical' | 'internal'
  latematerialize?: 'true' | 'false'
  useraworderby?: 'true' | 'false'
  aggregatelimit?: string
}

export interface EntityAttrs {
  name?: string
}

export interface LinkEntityAttrs {
  name?: string
  from?: string
  to?: string
  alias?: string
  'link-type'?: LinkType
  intersect?: 'true' | 'false'
}

export interface AttributeAttrs {
  name?: string
  alias?: string
  aggregate?: AggregateType
  groupby?: 'true' | 'false'
  distinct?: 'true' | 'false'
  dategrouping?: DateGroupingType
  'user-timezone'?: 'true' | 'false'
}

export interface FilterAttrs {
  type?: FilterType
  isquickfindfields?: 'true' | 'false'
  overridequickfindrecordlimitenabled?: 'true' | 'false'
}

export interface ConditionAttrs {
  attribute?: string
  operator?: string
  value?: string
  entityname?: string
  alias?: string
  aggregate?: AggregateType
  uiname?: string
  uitype?: string
}

export interface OrderAttrs {
  attribute?: string
  alias?: string
  descending?: 'true' | 'false'
  entityname?: string
}

/** Validation severity levels */
export type ValidationLevel = 'error' | 'warning' | 'info'

export interface ValidationResult {
  level: ValidationLevel
  message: string
  helpUrl?: string
}
