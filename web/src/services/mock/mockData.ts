import type { EntityMeta, AttrMeta } from '@/core/validator/index.ts'

export interface RelationMeta {
  referencedEntity: string
  referencingEntity: string
  referencedAttribute: string
  referencingAttribute: string
  schemaName: string
}

// ─── Mock Entities ────────────────────────────────────────────────────────────

const makeAttrs = (names: string[], types: string[] = []): AttrMeta[] =>
  names.map((n, i) => ({
    logicalName: n,
    attributeType: types[i] ?? 'String',
    isPrimaryId: n.endsWith('id') && i === 0,
    isValidForGrid: true,
  }))

export const MOCK_ENTITIES: EntityMeta[] = [
  {
    logicalName: 'account',
    primaryIdAttribute: 'accountid',
    attributes: makeAttrs(
      [
        'accountid', 'name', 'accountnumber', 'telephone1', 'emailaddress1',
        'websiteurl', 'revenue', 'numberofemployees', 'industrycode',
        'ownerid', 'statecode', 'statuscode', 'createdon', 'modifiedon',
        'parentaccountid', 'primarycontactid', 'address1_city', 'address1_country',
      ],
      [
        'UniqueIdentifier', 'String', 'String', 'String', 'String',
        'String', 'Money', 'Integer', 'Picklist',
        'Owner', 'State', 'Status', 'DateTime', 'DateTime',
        'Lookup', 'Lookup', 'String', 'String',
      ],
    ),
  },
  {
    logicalName: 'contact',
    primaryIdAttribute: 'contactid',
    attributes: makeAttrs(
      [
        'contactid', 'fullname', 'firstname', 'lastname', 'emailaddress1',
        'telephone1', 'mobilephone', 'jobtitle', 'birthdate',
        'ownerid', 'parentcustomerid', 'statecode', 'statuscode',
        'createdon', 'modifiedon', 'address1_city', 'gendercode',
      ],
      [
        'UniqueIdentifier', 'String', 'String', 'String', 'String',
        'String', 'String', 'String', 'DateTime',
        'Owner', 'Customer', 'State', 'Status',
        'DateTime', 'DateTime', 'String', 'Picklist',
      ],
    ),
  },
  {
    logicalName: 'opportunity',
    primaryIdAttribute: 'opportunityid',
    attributes: makeAttrs(
      [
        'opportunityid', 'name', 'estimatedvalue', 'estimatedclosedate',
        'actualvalue', 'actualclosedate', 'closeprobability',
        'ownerid', 'customerid', 'parentaccountid', 'parentcontactid',
        'stepname', 'statecode', 'statuscode', 'createdon', 'modifiedon',
      ],
      [
        'UniqueIdentifier', 'String', 'Money', 'DateTime',
        'Money', 'DateTime', 'Integer',
        'Owner', 'Customer', 'Lookup', 'Lookup',
        'String', 'State', 'Status', 'DateTime', 'DateTime',
      ],
    ),
  },
  {
    logicalName: 'lead',
    primaryIdAttribute: 'leadid',
    attributes: makeAttrs(
      [
        'leadid', 'fullname', 'firstname', 'lastname', 'emailaddress1',
        'telephone1', 'companyname', 'jobtitle', 'leadsourcecode',
        'ownerid', 'statecode', 'statuscode', 'createdon', 'modifiedon',
      ],
      [
        'UniqueIdentifier', 'String', 'String', 'String', 'String',
        'String', 'String', 'String', 'Picklist',
        'Owner', 'State', 'Status', 'DateTime', 'DateTime',
      ],
    ),
  },
  {
    logicalName: 'task',
    primaryIdAttribute: 'activityid',
    attributes: makeAttrs(
      [
        'activityid', 'subject', 'description', 'scheduledstart', 'scheduledend',
        'actualstart', 'actualend', 'prioritycode',
        'ownerid', 'regardingobjectid', 'statecode', 'statuscode', 'createdon',
      ],
      [
        'UniqueIdentifier', 'String', 'Memo', 'DateTime', 'DateTime',
        'DateTime', 'DateTime', 'Picklist',
        'Owner', 'Lookup', 'State', 'Status', 'DateTime',
      ],
    ),
  },
  {
    logicalName: 'systemuser',
    primaryIdAttribute: 'systemuserid',
    attributes: makeAttrs(
      [
        'systemuserid', 'fullname', 'firstname', 'lastname', 'internalemailaddress',
        'title', 'domainname', 'businessunitid', 'organizationid',
        'isdisabled', 'createdon', 'modifiedon',
      ],
      [
        'UniqueIdentifier', 'String', 'String', 'String', 'String',
        'String', 'String', 'Lookup', 'Lookup',
        'Boolean', 'DateTime', 'DateTime',
      ],
    ),
  },
  {
    logicalName: 'businessunit',
    primaryIdAttribute: 'businessunitid',
    attributes: makeAttrs(
      ['businessunitid', 'name', 'description', 'parentbusinessunitid', 'createdon'],
      ['UniqueIdentifier', 'String', 'Memo', 'Lookup', 'DateTime'],
    ),
  },
  {
    logicalName: 'product',
    primaryIdAttribute: 'productid',
    attributes: makeAttrs(
      [
        'productid', 'name', 'productnumber', 'description', 'price',
        'standardcost', 'currentcost', 'quantityonhand',
        'statecode', 'statuscode', 'createdon',
      ],
      [
        'UniqueIdentifier', 'String', 'String', 'Memo', 'Money',
        'Money', 'Money', 'Decimal',
        'State', 'Status', 'DateTime',
      ],
    ),
  },
  {
    logicalName: 'incident',
    primaryIdAttribute: 'incidentid',
    attributes: makeAttrs(
      [
        'incidentid', 'title', 'description', 'ticketnumber', 'prioritycode',
        'incidentstagecode', 'customerid', 'ownerid',
        'statecode', 'statuscode', 'createdon', 'modifiedon',
      ],
      [
        'UniqueIdentifier', 'String', 'Memo', 'String', 'Picklist',
        'Picklist', 'Customer', 'Owner',
        'State', 'Status', 'DateTime', 'DateTime',
      ],
    ),
  },
  {
    logicalName: 'email',
    primaryIdAttribute: 'activityid',
    attributes: makeAttrs(
      [
        'activityid', 'subject', 'description', 'actualstart', 'actualend',
        'ownerid', 'regardingobjectid', 'directioncode',
        'statecode', 'statuscode', 'createdon',
      ],
      [
        'UniqueIdentifier', 'String', 'Memo', 'DateTime', 'DateTime',
        'Owner', 'Lookup', 'Boolean',
        'State', 'Status', 'DateTime',
      ],
    ),
  },
]

// ─── Mock Relations ────────────────────────────────────────────────────────────

export const MOCK_RELATIONS: RelationMeta[] = [
  { referencedEntity: 'account', referencingEntity: 'contact', referencedAttribute: 'accountid', referencingAttribute: 'parentcustomerid', schemaName: 'contact_customer_accounts' },
  { referencedEntity: 'account', referencingEntity: 'opportunity', referencedAttribute: 'accountid', referencingAttribute: 'parentaccountid', schemaName: 'opportunity_parent_account' },
  { referencedEntity: 'contact', referencingEntity: 'opportunity', referencedAttribute: 'contactid', referencingAttribute: 'parentcontactid', schemaName: 'opportunity_parent_contact' },
  { referencedEntity: 'systemuser', referencingEntity: 'account', referencedAttribute: 'systemuserid', referencingAttribute: 'ownerid', schemaName: 'account_owning_user' },
  { referencedEntity: 'account', referencingEntity: 'incident', referencedAttribute: 'accountid', referencingAttribute: 'customerid', schemaName: 'incident_customer_accounts' },
]

// ─── Mock Query Results ───────────────────────────────────────────────────────

export const MOCK_ACCOUNT_RESULTS = Array.from({ length: 47 }, (_, i) => ({
  accountid: `acc-${String(i + 1).padStart(4, '0')}-mock`,
  name: ['Contoso Ltd', 'Fabrikam Inc', 'Northwind Traders', 'Adventure Works', 'Tailspin Toys', 'Woodgrove Bank', 'Datum Corp', 'Litware Inc', 'Alpine Ski House', 'Proseware Inc'][i % 10] + (i >= 10 ? ` (${Math.floor(i / 10) + 1})` : ''),
  accountnumber: `ACC-${String(10000 + i).padStart(6, '0')}`,
  telephone1: `+1-555-${String(1000 + i).padStart(4, '0')}`,
  emailaddress1: `info${i + 1}@example.com`,
  revenue: ((i + 1) * 123456.78).toFixed(2),
  numberofemployees: (i + 1) * 50,
  statecode: 0,
  statuscode: 1,
  createdon: new Date(Date.now() - i * 86400000 * 7).toISOString(),
}))

// ─── Condition Operators ──────────────────────────────────────────────────────

export interface OperatorOption {
  value: string
  label: string
  labelZh: string
  hasValue: boolean
  multiValue: boolean
  requiresTwoValues?: boolean
  category: string
}

export const CONDITION_OPERATORS: OperatorOption[] = [
  // ── Comparison ──────────────────────────────────────────────────────────────
  { value: 'eq',  label: 'Equals',             labelZh: '等于',       hasValue: true,  multiValue: false, category: 'comparison' },
  { value: 'ne',  label: 'Not Equal',           labelZh: '不等于',     hasValue: true,  multiValue: false, category: 'comparison' },
  { value: 'neq', label: 'Not Equal (alias)',   labelZh: '不等于(别名)',hasValue: true,  multiValue: false, category: 'comparison' },
  { value: 'gt',  label: 'Greater Than',        labelZh: '大于',       hasValue: true,  multiValue: false, category: 'comparison' },
  { value: 'ge',  label: 'Greater or Equal',    labelZh: '大于等于',   hasValue: true,  multiValue: false, category: 'comparison' },
  { value: 'lt',  label: 'Less Than',           labelZh: '小于',       hasValue: true,  multiValue: false, category: 'comparison' },
  { value: 'le',  label: 'Less or Equal',       labelZh: '小于等于',   hasValue: true,  multiValue: false, category: 'comparison' },
  // ── Null ────────────────────────────────────────────────────────────────────
  { value: 'null',     label: 'Is Null',     labelZh: '为空',   hasValue: false, multiValue: false, category: 'null' },
  { value: 'not-null', label: 'Is Not Null', labelZh: '不为空', hasValue: false, multiValue: false, category: 'null' },
  // ── String ──────────────────────────────────────────────────────────────────
  { value: 'like',          label: 'Like',                 labelZh: '包含',       hasValue: true,  multiValue: false, category: 'string' },
  { value: 'not-like',      label: 'Not Like',             labelZh: '不包含',     hasValue: true,  multiValue: false, category: 'string' },
  { value: 'begins-with',   label: 'Begins With',          labelZh: '开头为',     hasValue: true,  multiValue: false, category: 'string' },
  { value: 'not-begin-with',label: 'Does Not Begin With',  labelZh: '不以…开头',  hasValue: true,  multiValue: false, category: 'string' },
  { value: 'ends-with',     label: 'Ends With',            labelZh: '结尾为',     hasValue: true,  multiValue: false, category: 'string' },
  { value: 'not-end-with',  label: 'Does Not End With',    labelZh: '不以…结尾',  hasValue: true,  multiValue: false, category: 'string' },
  // ── List / Range ─────────────────────────────────────────────────────────────
  { value: 'in',              label: 'In',          labelZh: '在列表中',   hasValue: true, multiValue: true,  category: 'list' },
  { value: 'not-in',          label: 'Not In',      labelZh: '不在列表中', hasValue: true, multiValue: true,  category: 'list' },
  { value: 'between',         label: 'Between',     labelZh: '介于',       hasValue: true, multiValue: true,  requiresTwoValues: true, category: 'list' },
  { value: 'not-between',     label: 'Not Between', labelZh: '不介于',     hasValue: true, multiValue: true,  requiresTwoValues: true, category: 'list' },
  // ── Choice (multi-select OptionSet) ──────────────────────────────────────────
  { value: 'contain-values',     label: 'Contains Values',     labelZh: '包含值',   hasValue: true, multiValue: true, category: 'choice' },
  { value: 'not-contain-values', label: 'Not Contain Values',  labelZh: '不包含值', hasValue: true, multiValue: true, category: 'choice' },
  // ── Date relative (no value) ─────────────────────────────────────────────────
  { value: 'yesterday',        label: 'Yesterday',       labelZh: '昨天', hasValue: false, multiValue: false, category: 'date-relative' },
  { value: 'today',            label: 'Today',           labelZh: '今天', hasValue: false, multiValue: false, category: 'date-relative' },
  { value: 'tomorrow',         label: 'Tomorrow',        labelZh: '明天', hasValue: false, multiValue: false, category: 'date-relative' },
  { value: 'last-seven-days',  label: 'Last 7 Days',     labelZh: '过去7天', hasValue: false, multiValue: false, category: 'date-relative' },
  { value: 'last-week',        label: 'Last Week',       labelZh: '上周', hasValue: false, multiValue: false, category: 'date-relative' },
  { value: 'this-week',        label: 'This Week',       labelZh: '本周', hasValue: false, multiValue: false, category: 'date-relative' },
  { value: 'next-week',        label: 'Next Week',       labelZh: '下周', hasValue: false, multiValue: false, category: 'date-relative' },
  { value: 'next-seven-days',  label: 'Next 7 Days',     labelZh: '未来7天', hasValue: false, multiValue: false, category: 'date-relative' },
  { value: 'last-month',       label: 'Last Month',      labelZh: '上月', hasValue: false, multiValue: false, category: 'date-relative' },
  { value: 'this-month',       label: 'This Month',      labelZh: '本月', hasValue: false, multiValue: false, category: 'date-relative' },
  { value: 'next-month',       label: 'Next Month',      labelZh: '下月', hasValue: false, multiValue: false, category: 'date-relative' },
  { value: 'last-year',        label: 'Last Year',       labelZh: '去年', hasValue: false, multiValue: false, category: 'date-relative' },
  { value: 'this-year',        label: 'This Year',       labelZh: '今年', hasValue: false, multiValue: false, category: 'date-relative' },
  { value: 'next-year',        label: 'Next Year',       labelZh: '明年', hasValue: false, multiValue: false, category: 'date-relative' },
  // ── Date exact ───────────────────────────────────────────────────────────────
  { value: 'on',           label: 'On',           labelZh: '在某日',     hasValue: true, multiValue: false, category: 'date-exact' },
  { value: 'on-or-before', label: 'On or Before', labelZh: '在某日或之前', hasValue: true, multiValue: false, category: 'date-exact' },
  { value: 'on-or-after',  label: 'On or After',  labelZh: '在某日或之后', hasValue: true, multiValue: false, category: 'date-exact' },
  // ── Date X-unit (require integer value) ──────────────────────────────────────
  { value: 'last-x-hours',   label: 'Last X Hours',   labelZh: '最近 X 小时', hasValue: true, multiValue: false, category: 'date-xunit' },
  { value: 'next-x-hours',   label: 'Next X Hours',   labelZh: '未来 X 小时', hasValue: true, multiValue: false, category: 'date-xunit' },
  { value: 'last-x-days',    label: 'Last X Days',    labelZh: '最近 X 天',   hasValue: true, multiValue: false, category: 'date-xunit' },
  { value: 'next-x-days',    label: 'Next X Days',    labelZh: '未来 X 天',   hasValue: true, multiValue: false, category: 'date-xunit' },
  { value: 'last-x-weeks',   label: 'Last X Weeks',   labelZh: '最近 X 周',   hasValue: true, multiValue: false, category: 'date-xunit' },
  { value: 'next-x-weeks',   label: 'Next X Weeks',   labelZh: '未来 X 周',   hasValue: true, multiValue: false, category: 'date-xunit' },
  { value: 'last-x-months',  label: 'Last X Months',  labelZh: '最近 X 月',   hasValue: true, multiValue: false, category: 'date-xunit' },
  { value: 'next-x-months',  label: 'Next X Months',  labelZh: '未来 X 月',   hasValue: true, multiValue: false, category: 'date-xunit' },
  { value: 'last-x-years',   label: 'Last X Years',   labelZh: '最近 X 年',   hasValue: true, multiValue: false, category: 'date-xunit' },
  { value: 'next-x-years',   label: 'Next X Years',   labelZh: '未来 X 年',   hasValue: true, multiValue: false, category: 'date-xunit' },
  // ── Older-than ───────────────────────────────────────────────────────────────
  { value: 'olderthan-x-minutes', label: 'Older Than X Minutes', labelZh: '超过 X 分钟', hasValue: true, multiValue: false, category: 'date-xunit' },
  { value: 'olderthan-x-hours',   label: 'Older Than X Hours',   labelZh: '超过 X 小时', hasValue: true, multiValue: false, category: 'date-xunit' },
  { value: 'olderthan-x-days',    label: 'Older Than X Days',    labelZh: '超过 X 天',   hasValue: true, multiValue: false, category: 'date-xunit' },
  { value: 'olderthan-x-weeks',   label: 'Older Than X Weeks',   labelZh: '超过 X 周',   hasValue: true, multiValue: false, category: 'date-xunit' },
  { value: 'olderthan-x-months',  label: 'Older Than X Months',  labelZh: '超过 X 月',   hasValue: true, multiValue: false, category: 'date-xunit' },
  { value: 'olderthan-x-years',   label: 'Older Than X Years',   labelZh: '超过 X 年',   hasValue: true, multiValue: false, category: 'date-xunit' },
  // ── Fiscal (no value) ────────────────────────────────────────────────────────
  { value: 'this-fiscal-year',   label: 'This Fiscal Year',   labelZh: '本财年',   hasValue: false, multiValue: false, category: 'fiscal' },
  { value: 'this-fiscal-period', label: 'This Fiscal Period', labelZh: '本财期',   hasValue: false, multiValue: false, category: 'fiscal' },
  { value: 'last-fiscal-year',   label: 'Last Fiscal Year',   labelZh: '上财年',   hasValue: false, multiValue: false, category: 'fiscal' },
  { value: 'last-fiscal-period', label: 'Last Fiscal Period', labelZh: '上财期',   hasValue: false, multiValue: false, category: 'fiscal' },
  { value: 'next-fiscal-year',   label: 'Next Fiscal Year',   labelZh: '下财年',   hasValue: false, multiValue: false, category: 'fiscal' },
  { value: 'next-fiscal-period', label: 'Next Fiscal Period', labelZh: '下财期',   hasValue: false, multiValue: false, category: 'fiscal' },
  // ── Fiscal (require value) ────────────────────────────────────────────────────
  { value: 'in-fiscal-year',                     label: 'In Fiscal Year',                   labelZh: '在财年',         hasValue: true, multiValue: false, category: 'fiscal' },
  { value: 'in-fiscal-period',                   label: 'In Fiscal Period',                 labelZh: '在财期',         hasValue: true, multiValue: false, category: 'fiscal' },
  { value: 'in-fiscal-period-and-year',          label: 'In Fiscal Period and Year',        labelZh: '在财期和财年',   hasValue: true, multiValue: true,  requiresTwoValues: true, category: 'fiscal' },
  { value: 'in-or-before-fiscal-period-and-year',label: 'In or Before Fiscal Period/Year',  labelZh: '在财期和财年之前',hasValue: true, multiValue: true,  requiresTwoValues: true, category: 'fiscal' },
  { value: 'in-or-after-fiscal-period-and-year', label: 'In or After Fiscal Period/Year',   labelZh: '在财期和财年之后',hasValue: true, multiValue: true,  requiresTwoValues: true, category: 'fiscal' },
  { value: 'last-x-fiscal-years',   label: 'Last X Fiscal Years',   labelZh: '最近 X 财年', hasValue: true, multiValue: false, category: 'fiscal' },
  { value: 'last-x-fiscal-periods', label: 'Last X Fiscal Periods', labelZh: '最近 X 财期', hasValue: true, multiValue: false, category: 'fiscal' },
  { value: 'next-x-fiscal-years',   label: 'Next X Fiscal Years',   labelZh: '未来 X 财年', hasValue: true, multiValue: false, category: 'fiscal' },
  { value: 'next-x-fiscal-periods', label: 'Next X Fiscal Periods', labelZh: '未来 X 财期', hasValue: true, multiValue: false, category: 'fiscal' },
  // ── User / Team context ───────────────────────────────────────────────────────
  { value: 'eq-userid',                     label: 'Equals Current User',                    labelZh: '等于当前用户',             hasValue: false, multiValue: false, category: 'user' },
  { value: 'ne-userid',                     label: 'Not Current User',                       labelZh: '不是当前用户',             hasValue: false, multiValue: false, category: 'user' },
  { value: 'eq-businessid',                 label: 'Equals Current Business Unit',           labelZh: '等于当前业务部门',         hasValue: false, multiValue: false, category: 'user' },
  { value: 'ne-businessid',                 label: 'Not Current Business Unit',              labelZh: '不是当前业务部门',         hasValue: false, multiValue: false, category: 'user' },
  { value: 'eq-userteams',                  label: 'Equals User Teams',                      labelZh: '等于用户团队',             hasValue: false, multiValue: false, category: 'user' },
  { value: 'eq-useroruserteams',            label: 'Equals User or User Teams',              labelZh: '等于用户或用户团队',       hasValue: false, multiValue: false, category: 'user' },
  { value: 'eq-useroruserhierarchy',        label: 'Equals User or User Hierarchy',          labelZh: '等于用户或用户层级',       hasValue: false, multiValue: false, category: 'user' },
  { value: 'eq-useroruserhierarchyandteams',label: 'Equals User or User Hierarchy and Teams',labelZh: '等于用户或用户层级和团队', hasValue: false, multiValue: false, category: 'user' },
  { value: 'eq-userlanguage',               label: 'Equals User Language',                   labelZh: '等于用户语言',             hasValue: false, multiValue: false, category: 'user' },
  // ── Hierarchy ─────────────────────────────────────────────────────────────────
  { value: 'under',      label: 'Under (hierarchy)',              labelZh: '层级下方',     hasValue: true, multiValue: false, category: 'hierarchy' },
  { value: 'not-under',  label: 'Not Under (hierarchy)',          labelZh: '不在层级下方', hasValue: true, multiValue: false, category: 'hierarchy' },
  { value: 'above',      label: 'Above (hierarchy)',              labelZh: '层级上方',     hasValue: true, multiValue: false, category: 'hierarchy' },
  { value: 'eq-or-under',label: 'Equals or Under (hierarchy)',    labelZh: '等于或层级下方',hasValue: true, multiValue: false, category: 'hierarchy' },
  { value: 'eq-or-above',label: 'Equals or Above (hierarchy)',    labelZh: '等于或层级上方',hasValue: true, multiValue: false, category: 'hierarchy' },
]

export function getMockEntityByName(name: string): EntityMeta | undefined {
  return MOCK_ENTITIES.find((e) => e.logicalName === name)
}

export function getMockAttributes(entityName: string): AttrMeta[] {
  return getMockEntityByName(entityName)?.attributes ?? []
}
