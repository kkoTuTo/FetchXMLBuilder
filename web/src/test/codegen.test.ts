import { describe, it, expect } from 'vitest'
import { generateCode, generateCSharpCode, generateCSharpFetchExpression } from '../core/codegen/generators.ts'
import { generateCSharpQueryExpression } from '../core/codegen/csharpQueryExpression.ts'

const SAMPLE_XML = `<?xml version="1.0"?>
<fetch top="5" mapping="logical">
  <entity name="account">
    <attribute name="name" />
    <attribute name="emailaddress1" />
    <filter type="and">
      <condition attribute="statecode" operator="eq" value="0" />
    </filter>
    <order attribute="name" descending="false" />
  </entity>
</fetch>`

const LINK_XML = `<?xml version="1.0"?>
<fetch>
  <entity name="account">
    <attribute name="name" />
    <link-entity name="contact" from="accountid" to="accountid" alias="c" link-type="outer">
      <attribute name="firstname" />
      <filter>
        <condition attribute="statecode" operator="eq" value="0" />
      </filter>
    </link-entity>
  </entity>
</fetch>`

describe('Code Generators', () => {
  it('fetchxml generator returns formatted XML', () => {
    const out = generateCode('fetchxml', SAMPLE_XML)
    expect(out).toContain('<fetch')
    expect(out).toContain('<entity')
    expect(out).toContain('<attribute')
  })

  it('odata generator returns a URL', () => {
    const out = generateCode('odata', SAMPLE_XML)
    expect(out).toContain('accounts')
    expect(out).toContain('$select=name,emailaddress1')
    expect(out).toContain('$orderby=name asc')
    expect(out).toContain('$top=5')
  })

  it('csharp FetchXML style uses verbatim string with "" quoting', () => {
    const out = generateCSharpCode(SAMPLE_XML, 'fetchxml')
    expect(out).toContain('$@"')
    expect(out).toContain('name=""account""')
    expect(out).toContain('var fetchXml =')
    expect(out).not.toContain('new FetchExpression')
  })

  it('csharp FetchExpression style uses single-quoted XML and FetchExpression constructor', () => {
    const out = generateCSharpFetchExpression(SAMPLE_XML)
    expect(out).toContain('$@"')
    expect(out).toContain("name='account'")
    expect(out).toContain('var fetch =')
    expect(out).toContain('new FetchExpression(fetch)')
  })

  it('javascript generator returns array-join format with single-quoted attributes', () => {
    const out = generateCode('javascript', SAMPLE_XML)
    expect(out).toContain('var fetchXml = [')
    expect(out).toContain('].join("")')
    expect(out).toContain('"<fetch')
    expect(out).toContain("name='account'")
    expect(out).not.toContain('<?xml')
  })

  it('sql generator returns SELECT statement', () => {
    const out = generateCode('sql', SAMPLE_XML)
    expect(out).toContain('SELECT')
    expect(out).toContain('FROM account')
    expect(out).toContain('ORDER BY')
  })

  it('powerfx generator returns ClearCollect code', () => {
    const out = generateCode('powerfx', SAMPLE_XML)
    expect(out).toContain('ClearCollect')
  })

  // ── QueryExpression generator tests ──────────────────────────────────────

  describe('QueryExpression generator', () => {
    it('line-by-line generates correct QueryExpression code', () => {
      const out = generateCSharpQueryExpression(SAMPLE_XML, { style: 'QueryExpression', objectInitializer: false, includeComments: false, filterVariables: false })
      expect(out).toContain('var query = new QueryExpression("account");')
      expect(out).toContain('query.TopCount = 5;')
      expect(out).toContain('query.ColumnSet.AddColumns("name", "emailaddress1");')
      expect(out).toContain('query.Criteria.AddCondition("statecode", ConditionOperator.Equal, 0);')
      expect(out).toContain('query.AddOrder("name", OrderType.Ascending);')
    })

    it('object-initializer generates QueryExpression with braces', () => {
      const out = generateCSharpQueryExpression(SAMPLE_XML, { style: 'QueryExpression', objectInitializer: true, includeComments: false, filterVariables: false })
      expect(out).toContain('var query = new QueryExpression("account")')
      expect(out).toContain('ColumnSet = new ColumnSet("name", "emailaddress1")')
      expect(out).toContain('Criteria =')
    })

    it('QueryByAttribute generates correct code', () => {
      const out = generateCSharpQueryExpression(SAMPLE_XML, { style: 'QueryByAttribute', objectInitializer: false, includeComments: false, filterVariables: false })
      expect(out).toContain('new QueryByAttribute("account")')
      expect(out).toContain('AddAttributeValue("statecode"')
    })

    it('FluentQueryExpression generates correct code', () => {
      const out = generateCSharpQueryExpression(SAMPLE_XML, { style: 'FluentQueryExpression', objectInitializer: false, includeComments: false, filterVariables: false })
      expect(out).toContain('new Query("account")')
      expect(out).toContain('ConditionOperator.Equal')
    })

    it('QueryExpressionFactory generates correct code', () => {
      const out = generateCSharpQueryExpression(SAMPLE_XML, { style: 'QueryExpressionFactory', objectInitializer: false, includeComments: false, filterVariables: false })
      expect(out).toContain('QueryExpressionFactory.Create("account"')
    })

    it('includes comments when requested', () => {
      const out = generateCSharpQueryExpression(SAMPLE_XML, { style: 'QueryExpression', objectInitializer: false, includeComments: true, filterVariables: false })
      expect(out).toContain('//')
    })

    it('extracts filter variables when requested', () => {
      const out = generateCSharpQueryExpression(SAMPLE_XML, { style: 'QueryExpression', objectInitializer: false, includeComments: false, filterVariables: true })
      expect(out).toContain('var fetchData =')
      expect(out).toContain('fetchData.statecode')
    })

    it('handles link entities in line-by-line mode', () => {
      const out = generateCSharpQueryExpression(LINK_XML, { style: 'QueryExpression', objectInitializer: false, includeComments: false, filterVariables: false })
      expect(out).toContain('AddLink("contact"')
      expect(out).toContain('JoinOperator.LeftOuter')
    })

    it('handles link entities in object-initializer mode', () => {
      const out = generateCSharpQueryExpression(LINK_XML, { style: 'QueryExpression', objectInitializer: true, includeComments: false, filterVariables: false })
      expect(out).toContain('LinkEntities =')
      expect(out).toContain('new LinkEntity')
    })

    it('returns note for non-LateBound flavors', () => {
      const out = generateCSharpQueryExpression(SAMPLE_XML, { style: 'QueryExpression', flavor: 'EarlyBound' })
      expect(out).toContain('/*')
      expect(out).toContain('CRM metadata')
    })

    it('returns note for OrganizationServiceContext', () => {
      const out = generateCSharpQueryExpression(SAMPLE_XML, { style: 'OrganizationServiceContext' })
      expect(out).toContain('/*')
    })

    it('applies indent level', () => {
      const out = generateCSharpQueryExpression(SAMPLE_XML, { style: 'QueryExpression', objectInitializer: false, includeComments: false, filterVariables: false, indents: 2 })
      // Each line should start with 2x4-space indent
      const firstLine = out.split('\n')[0]
      expect(firstLine).toMatch(/^        /)
    })
  })
})
