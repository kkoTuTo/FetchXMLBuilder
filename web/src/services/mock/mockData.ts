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
}

export const CONDITION_OPERATORS: OperatorOption[] = [
  { value: 'eq', label: 'Equals', labelZh: '等于', hasValue: true, multiValue: false },
  { value: 'ne', label: 'Not Equal', labelZh: '不等于', hasValue: true, multiValue: false },
  { value: 'gt', label: 'Greater Than', labelZh: '大于', hasValue: true, multiValue: false },
  { value: 'ge', label: 'Greater or Equal', labelZh: '大于等于', hasValue: true, multiValue: false },
  { value: 'lt', label: 'Less Than', labelZh: '小于', hasValue: true, multiValue: false },
  { value: 'le', label: 'Less or Equal', labelZh: '小于等于', hasValue: true, multiValue: false },
  { value: 'like', label: 'Like', labelZh: '包含', hasValue: true, multiValue: false },
  { value: 'not-like', label: 'Not Like', labelZh: '不包含', hasValue: true, multiValue: false },
  { value: 'begins-with', label: 'Begins With', labelZh: '开头为', hasValue: true, multiValue: false },
  { value: 'ends-with', label: 'Ends With', labelZh: '结尾为', hasValue: true, multiValue: false },
  { value: 'null', label: 'Is Null', labelZh: '为空', hasValue: false, multiValue: false },
  { value: 'not-null', label: 'Is Not Null', labelZh: '不为空', hasValue: false, multiValue: false },
  { value: 'in', label: 'In', labelZh: '在列表中', hasValue: true, multiValue: true },
  { value: 'not-in', label: 'Not In', labelZh: '不在列表中', hasValue: true, multiValue: true },
  { value: 'between', label: 'Between', labelZh: '介于', hasValue: true, multiValue: true },
  { value: 'not-between', label: 'Not Between', labelZh: '不介于', hasValue: true, multiValue: true },
  { value: 'today', label: 'Today', labelZh: '今天', hasValue: false, multiValue: false },
  { value: 'yesterday', label: 'Yesterday', labelZh: '昨天', hasValue: false, multiValue: false },
  { value: 'tomorrow', label: 'Tomorrow', labelZh: '明天', hasValue: false, multiValue: false },
  { value: 'this-month', label: 'This Month', labelZh: '本月', hasValue: false, multiValue: false },
  { value: 'last-month', label: 'Last Month', labelZh: '上月', hasValue: false, multiValue: false },
  { value: 'this-year', label: 'This Year', labelZh: '今年', hasValue: false, multiValue: false },
  { value: 'last-year', label: 'Last Year', labelZh: '去年', hasValue: false, multiValue: false },
  { value: 'last-x-days', label: 'Last X Days', labelZh: '最近 X 天', hasValue: true, multiValue: false },
  { value: 'next-x-days', label: 'Next X Days', labelZh: '未来 X 天', hasValue: true, multiValue: false },
  { value: 'eq-userid', label: 'Equals Current User', labelZh: '等于当前用户', hasValue: false, multiValue: false },
  { value: 'ne-userid', label: 'Not Current User', labelZh: '不是当前用户', hasValue: false, multiValue: false },
]

export function getMockEntityByName(name: string): EntityMeta | undefined {
  return MOCK_ENTITIES.find((e) => e.logicalName === name)
}

export function getMockAttributes(entityName: string): AttrMeta[] {
  return getMockEntityByName(entityName)?.attributes ?? []
}
