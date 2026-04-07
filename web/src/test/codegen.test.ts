import { describe, it, expect } from 'vitest'
import { generateCode, generateCSharpCode, generateCSharpFetchExpression } from '../core/codegen/generators.ts'

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
    // Should use C# verbatim interpolated string
    expect(out).toContain('$@"')
    // XML double-quotes must be escaped as "" (verbatim string convention)
    expect(out).toContain('name=""account""')
    // Variable name should be fetchXml
    expect(out).toContain('var fetchXml =')
    // Should NOT include FetchExpression line in fetchxml style
    expect(out).not.toContain('new FetchExpression')
  })

  it('csharp FetchExpression style uses single-quoted XML and FetchExpression constructor', () => {
    const out = generateCSharpFetchExpression(SAMPLE_XML)
    // Should use C# verbatim interpolated string
    expect(out).toContain('$@"')
    // XML double-quotes must be replaced with single quotes
    expect(out).toContain("name='account'")
    // Variable name should be fetch
    expect(out).toContain('var fetch =')
    // Must include FetchExpression construction
    expect(out).toContain('new FetchExpression(fetch)')
  })

  it('javascript generator returns array-join format with single-quoted attributes', () => {
    const out = generateCode('javascript', SAMPLE_XML)
    // Should use array-join format (matching JavascriptCodeGenerator.cs)
    expect(out).toContain('var fetchXml = [')
    expect(out).toContain('].join("")')
    // Each element should be a JSON string
    expect(out).toContain('"<fetch')
    // Attributes must use single quotes
    expect(out).toContain("name='account'")
    // No XML declaration in JS output
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
})
