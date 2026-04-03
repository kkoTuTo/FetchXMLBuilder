import { describe, it, expect } from 'vitest'
import { parseFetchXml, serialiseFetchXml } from '../core/parser/xmlParser.ts'

const SAMPLE_XML = `<?xml version="1.0" encoding="utf-8"?>
<fetch version="1.0" mapping="logical" top="10">
  <entity name="account">
    <attribute name="name" />
    <attribute name="emailaddress1" />
    <filter type="and">
      <condition attribute="statecode" operator="eq" value="0" />
    </filter>
    <order attribute="name" descending="false" />
  </entity>
</fetch>`

describe('XML Parser', () => {
  it('parses a well-formed FetchXML string', () => {
    const ast = parseFetchXml(SAMPLE_XML)
    expect(ast.type).toBe('fetch')
    expect(ast.attrs.top).toBe('10')
    expect(ast.attrs.mapping).toBe('logical')
  })

  it('parses nested entity with attributes and filter', () => {
    const ast = parseFetchXml(SAMPLE_XML)
    const entity = ast.children.find((c) => c.type === 'entity')
    expect(entity).toBeDefined()
    expect(entity!.attrs.name).toBe('account')

    const attrs = entity!.children.filter((c) => c.type === 'attribute')
    expect(attrs).toHaveLength(2)
    expect(attrs[0].attrs.name).toBe('name')

    const filter = entity!.children.find((c) => c.type === 'filter')
    expect(filter).toBeDefined()
    expect(filter!.attrs.type).toBe('and')

    const condition = filter!.children.find((c) => c.type === 'condition')
    expect(condition!.attrs.attribute).toBe('statecode')
    expect(condition!.attrs.operator).toBe('eq')
    expect(condition!.attrs.value).toBe('0')
  })

  it('roundtrips XML correctly (parse → serialise → parse)', () => {
    const ast1 = parseFetchXml(SAMPLE_XML)
    const xml2 = serialiseFetchXml(ast1)
    const ast2 = parseFetchXml(xml2)

    expect(ast2.type).toBe('fetch')
    expect(ast2.attrs.top).toBe('10')
    const entity = ast2.children.find((c) => c.type === 'entity')
    expect(entity?.attrs.name).toBe('account')
  })

  it('throws on empty XML', () => {
    expect(() => parseFetchXml('')).toThrow('Empty XML')
  })

  it('throws when root element is not fetch', () => {
    expect(() => parseFetchXml('<entity name="account" />')).toThrow('Root element must be <fetch>')
  })

  it('handles aggregate queries', () => {
    const xml = `<fetch aggregate="true"><entity name="account"><attribute name="name" aggregate="count" alias="count_name" groupby="false" /></entity></fetch>`
    const ast = parseFetchXml(xml)
    expect(ast.attrs.aggregate).toBe('true')
    const attr = ast.children[0].children[0]
    expect(attr.attrs.aggregate).toBe('count')
    expect(attr.attrs.alias).toBe('count_name')
  })
})
