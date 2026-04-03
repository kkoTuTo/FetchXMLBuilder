import { describe, it, expect } from 'vitest'
import { generateCode } from '../core/codegen/generators.ts'

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

  it('csharp generator returns FetchExpression code', () => {
    const out = generateCode('csharp', SAMPLE_XML)
    expect(out).toContain('FetchExpression')
    expect(out).toContain('RetrieveMultiple')
  })

  it('javascript generator returns fetch API code', () => {
    const out = generateCode('javascript', SAMPLE_XML)
    expect(out).toContain('fetch(')
    expect(out).toContain('fetchXml')
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
