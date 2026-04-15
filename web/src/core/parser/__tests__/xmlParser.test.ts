/*
 * @Author        : Frank
 * @Email         : guangzhu.zhu@foxmail.com
 * @Date          : 2026-04-07 17:04:48
 * @LastEditors   : Frank
 * @LastEditTime  : 2026-04-07 17:04:53
 * @FilePath      : \FetchXMLBuilder\web\src\core\parser\__tests__\xmlParser.test.ts
 * @Description   :
 */
import { describe, it, expect } from 'vitest'
import {
  parseFetchXml,
  serialiseFetchXml,
  prettyPrintFetchXml,
} from '../xmlParser.ts'
import type { FetchNode } from '../../ast/types.ts'

describe('xmlParser', () => {
  describe('parseFetchXml', () => {
    describe('basic parsing', () => {
      it('should parse simple fetch with empty entity', () => {
        const xml = '<fetch><entity name="account"/></fetch>'
        const ast = parseFetchXml(xml)

        expect(ast.type).toBe('fetch')
        expect(ast.children).toHaveLength(1)
        expect(ast.children[0].type).toBe('entity')
        expect(ast.children[0].attrs.name).toBe('account')
      })

      it('should parse fetch with attributes', () => {
        const xml = '<fetch version="1.0" mapping="logical" top="10"><entity name="account"/></fetch>'
        const ast = parseFetchXml(xml)

        expect(ast.attrs.version).toBe('1.0')
        expect(ast.attrs.mapping).toBe('logical')
        expect(ast.attrs.top).toBe('10')
      })

      it('should parse fetch with aggregate attribute', () => {
        const xml = '<fetch aggregate="true"><entity name="account"/></fetch>'
        const ast = parseFetchXml(xml)

        expect(ast.attrs.aggregate).toBe('true')
      })

      it('should parse fetch with distinct attribute', () => {
        const xml = '<fetch distinct="true"><entity name="account"/></fetch>'
        const ast = parseFetchXml(xml)

        expect(ast.attrs.distinct).toBe('true')
      })
    })

    describe('complex query parsing', () => {
      it('should parse query with attributes', () => {
        const xml = `<fetch>
          <entity name="account">
            <attribute name="name"/>
            <attribute name="accountnumber"/>
          </entity>
        </fetch>`
        const ast = parseFetchXml(xml)

        const entity = ast.children[0]
        expect(entity.children).toHaveLength(2)
        expect(entity.children[0].type).toBe('attribute')
        expect(entity.children[0].attrs.name).toBe('name')
        expect(entity.children[1].attrs.name).toBe('accountnumber')
      })

      it('should parse query with all-attributes', () => {
        const xml = `<fetch>
          <entity name="account">
            <all-attributes/>
          </entity>
        </fetch>`
        const ast = parseFetchXml(xml)

        const entity = ast.children[0]
        expect(entity.children[0].type).toBe('all-attributes')
      })

      it('should parse query with filter and conditions', () => {
        const xml = `<fetch>
          <entity name="account">
            <filter type="and">
              <condition attribute="statecode" operator="eq" value="0"/>
              <condition attribute="name" operator="like" value="%test%"/>
            </filter>
          </entity>
        </fetch>`
        const ast = parseFetchXml(xml)

        const entity = ast.children[0]
        const filter = entity.children[0]
        expect(filter.type).toBe('filter')
        expect(filter.attrs.type).toBe('and')
        expect(filter.children).toHaveLength(2)

        const cond1 = filter.children[0]
        expect(cond1.type).toBe('condition')
        expect(cond1.attrs.attribute).toBe('statecode')
        expect(cond1.attrs.operator).toBe('eq')
        expect(cond1.attrs.value).toBe('0')

        const cond2 = filter.children[1]
        expect(cond2.attrs.attribute).toBe('name')
        expect(cond2.attrs.operator).toBe('like')
        expect(cond2.attrs.value).toBe('%test%')
      })

      it('should parse query with or filter', () => {
        const xml = `<fetch>
          <entity name="account">
            <filter type="or">
              <condition attribute="statecode" operator="eq" value="0"/>
            </filter>
          </entity>
        </fetch>`
        const ast = parseFetchXml(xml)

        const filter = ast.children[0].children[0]
        expect(filter.attrs.type).toBe('or')
      })

      it('should parse query with order', () => {
        const xml = `<fetch>
          <entity name="account">
            <attribute name="name"/>
            <order attribute="name" descending="false"/>
          </entity>
        </fetch>`
        const ast = parseFetchXml(xml)

        const entity = ast.children[0]
        const order = entity.children.find((c) => c.type === 'order')
        expect(order?.attrs.attribute).toBe('name')
        expect(order?.attrs.descending).toBe('false')
      })

      it('should parse query with descending order', () => {
        const xml = `<fetch>
          <entity name="account">
            <order attribute="createdon" descending="true"/>
          </entity>
        </fetch>`
        const ast = parseFetchXml(xml)

        const order = ast.children[0].children[0]
        expect(order?.attrs.descending).toBe('true')
      })

      it('should parse query with link-entity', () => {
        const xml = `<fetch>
          <entity name="account">
            <attribute name="name"/>
            <link-entity name="contact" from="parentcustomerid" to="accountid" link-type="inner" alias="contact">
              <attribute name="fullname"/>
            </link-entity>
          </entity>
        </fetch>`
        const ast = parseFetchXml(xml)

        const entity = ast.children[0]
        const link = entity.children.find((c) => c.type === 'link-entity')
        expect(link?.attrs.name).toBe('contact')
        expect(link?.attrs.from).toBe('parentcustomerid')
        expect(link?.attrs.to).toBe('accountid')
        expect(link?.attrs['link-type']).toBe('inner')
        expect(link?.attrs.alias).toBe('contact')
        expect(link?.children).toHaveLength(1)
        expect(link?.children[0].attrs.name).toBe('fullname')
      })

      it('should parse nested link-entity', () => {
        const xml = `<fetch>
          <entity name="account">
            <link-entity name="contact" from="parentcustomerid" to="accountid">
              <link-entity name="systemuser" from="systemuserid" to="ownerid"/>
            </link-entity>
          </entity>
        </fetch>`
        const ast = parseFetchXml(xml)

        const link1 = ast.children[0].children[0]
        expect(link1.type).toBe('link-entity')
        const link2 = link1.children[0]
        expect(link2.type).toBe('link-entity')
        expect(link2.attrs.name).toBe('systemuser')
      })

      it('should parse link-entity with outer join', () => {
        const xml = `<fetch>
          <entity name="account">
            <link-entity name="contact" from="parentcustomerid" to="accountid" link-type="outer"/>
          </entity>
        </fetch>`
        const ast = parseFetchXml(xml)

        const link = ast.children[0].children[0]
        expect(link.attrs['link-type']).toBe('outer')
      })

      it('should parse filter inside link-entity', () => {
        const xml = `<fetch>
          <entity name="account">
            <link-entity name="contact" from="parentcustomerid" to="accountid">
              <filter type="and">
                <condition attribute="statecode" operator="eq" value="0"/>
              </filter>
            </link-entity>
          </entity>
        </fetch>`
        const ast = parseFetchXml(xml)

        const link = ast.children[0].children[0]
        const filter = link.children[0]
        expect(filter.type).toBe('filter')
        expect(filter.attrs.type).toBe('and')
      })
    })

    describe('value element parsing', () => {
      it('should parse condition with value element', () => {
        const xml = `<fetch>
          <entity name="account">
            <filter>
              <condition attribute="accountid" operator="in">
                <value>guid-1</value>
                <value>guid-2</value>
              </condition>
            </filter>
          </entity>
        </fetch>`
        const ast = parseFetchXml(xml)

        const condition = ast.children[0].children[0].children[0]
        expect(condition.children).toHaveLength(2)
        expect(condition.children[0].type).toBe('value')
        expect(condition.children[0].attrs['#text']).toBe('guid-1')
        expect(condition.children[1].attrs['#text']).toBe('guid-2')
      })
    })

    describe('comment handling', () => {
      it('should parse XML comments', () => {
        const xml = `<fetch>
          <!-- This is a comment -->
          <entity name="account"/>
        </fetch>`
        const ast = parseFetchXml(xml)

        const comment = ast.children.find((c) => c.type === '#comment')
        expect(comment).toBeDefined()
        expect(comment?.attrs['#comment']).toBe(' This is a comment ')
      })

      it('should parse comments inside entity', () => {
        const xml = `<fetch>
          <entity name="account">
            <!-- Select name attribute -->
            <attribute name="name"/>
          </entity>
        </fetch>`
        const ast = parseFetchXml(xml)

        const entity = ast.children[0]
        const comment = entity.children.find((c) => c.type === '#comment')
        expect(comment).toBeDefined()
        expect(comment?.attrs['#comment']).toBe(' Select name attribute ')
      })
    })

    describe('error handling', () => {
      it('should throw on empty input', () => {
        expect(() => parseFetchXml('')).toThrow('Empty XML')
        expect(() => parseFetchXml('   ')).toThrow('Empty XML')
      })

      it('should throw on invalid XML', () => {
        expect(() => parseFetchXml('not xml')).toThrow()
        expect(() => parseFetchXml('<unclosed>')).toThrow()
      })

      it('should throw when root is not fetch', () => {
        expect(() => parseFetchXml('<entity name="account"/>')).toThrow('Root element must be <fetch>')
      })

      it('should handle XML declaration', () => {
        const xml = `<?xml version="1.0" encoding="utf-8"?>
        <fetch>
          <entity name="account"/>
        </fetch>`
        const ast = parseFetchXml(xml)
        expect(ast.type).toBe('fetch')
      })
    })
  })

  describe('serialiseFetchXml', () => {
    it('should serialise simple fetch', () => {
      const ast: FetchNode = {
        id: 'node_1',
        type: 'fetch',
        attrs: { version: '1.0', mapping: 'logical' },
        children: [
          {
            id: 'node_2',
            type: 'entity',
            attrs: { name: 'account' },
            children: [],
          },
        ],
      }

      const xml = serialiseFetchXml(ast)

      expect(xml).toContain('<?xml version="1.0" encoding="utf-8"?>')
      expect(xml).toContain('<fetch')
      expect(xml).toContain('<entity name="account"')
    })

    it('should serialise fetch with attributes', () => {
      const ast: FetchNode = {
        id: 'node_1',
        type: 'fetch',
        attrs: { top: '10', distinct: 'true' },
        children: [
          {
            id: 'node_2',
            type: 'entity',
            attrs: { name: 'account' },
            children: [],
          },
        ],
      }

      const xml = serialiseFetchXml(ast)

      expect(xml).toContain('top="10"')
      expect(xml).toContain('distinct="true"')
    })

    it('should serialise filter with conditions', () => {
      const ast: FetchNode = {
        id: 'node_1',
        type: 'fetch',
        attrs: {},
        children: [
          {
            id: 'node_2',
            type: 'entity',
            attrs: { name: 'account' },
            children: [
              {
                id: 'node_3',
                type: 'filter',
                attrs: { type: 'and' },
                children: [
                  {
                    id: 'node_4',
                    type: 'condition',
                    attrs: { attribute: 'statecode', operator: 'eq', value: '0' },
                    children: [],
                  },
                ],
              },
            ],
          },
        ],
      }

      const xml = serialiseFetchXml(ast)

      expect(xml).toContain('<filter')
      expect(xml).toContain('type="and"')
      expect(xml).toContain('<condition')
      expect(xml).toContain('attribute="statecode"')
      expect(xml).toContain('operator="eq"')
      expect(xml).toContain('value="0"')
    })

    it('should serialise link-entity', () => {
      const ast: FetchNode = {
        id: 'node_1',
        type: 'fetch',
        attrs: {},
        children: [
          {
            id: 'node_2',
            type: 'entity',
            attrs: { name: 'account' },
            children: [
              {
                id: 'node_3',
                type: 'link-entity',
                attrs: {
                  name: 'contact',
                  from: 'parentcustomerid',
                  to: 'accountid',
                  'link-type': 'inner',
                },
                children: [],
              },
            ],
          },
        ],
      }

      const xml = serialiseFetchXml(ast)

      expect(xml).toContain('<link-entity')
      expect(xml).toContain('name="contact"')
      expect(xml).toContain('from="parentcustomerid"')
      expect(xml).toContain('to="accountid"')
    })

    it('should serialise comments', () => {
      const ast: FetchNode = {
        id: 'node_1',
        type: 'fetch',
        attrs: {},
        children: [
          {
            id: 'node_comment',
            type: '#comment',
            attrs: { '#comment': 'Test comment' },
            children: [],
          },
          {
            id: 'node_2',
            type: 'entity',
            attrs: { name: 'account' },
            children: [],
          },
        ],
      }

      const xml = serialiseFetchXml(ast)

      expect(xml).toContain('<!--Test comment-->')
    })

    it('should serialise value elements', () => {
      const ast: FetchNode = {
        id: 'node_1',
        type: 'fetch',
        attrs: {},
        children: [
          {
            id: 'node_2',
            type: 'entity',
            attrs: { name: 'account' },
            children: [
              {
                id: 'node_3',
                type: 'filter',
                attrs: { type: 'and' },
                children: [
                  {
                    id: 'node_4',
                    type: 'condition',
                    attrs: { attribute: 'accountid', operator: 'in' },
                    children: [
                      {
                        id: 'node_5',
                        type: 'value',
                        attrs: { '#text': 'guid-1' },
                        children: [],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      }

      const xml = serialiseFetchXml(ast)

      expect(xml).toContain('<value>guid-1</value>')
    })
  })

  describe('round-trip consistency', () => {
    it('should maintain consistency through parse → serialise → parse', () => {
      const originalXml = `<fetch version="1.0" mapping="logical">
  <entity name="account">
    <attribute name="name"/>
    <attribute name="accountnumber"/>
    <filter type="and">
      <condition attribute="statecode" operator="eq" value="0"/>
    </filter>
    <order attribute="name" descending="false"/>
  </entity>
</fetch>`

      const ast1 = parseFetchXml(originalXml)
      const serialised = serialiseFetchXml(ast1)
      const ast2 = parseFetchXml(serialised)

      // Compare structure (ids will differ)
      expect(ast2.type).toBe(ast1.type)
      expect(ast2.attrs).toEqual(ast1.attrs)
      expect(ast2.children.length).toBe(ast1.children.length)

      const entity1 = ast1.children[0]
      const entity2 = ast2.children[0]
      expect(entity2.attrs.name).toBe(entity1.attrs.name)
      expect(entity2.children.length).toBe(entity1.children.length)
    })

    it('should handle complex query round-trip', () => {
      const xml = `<fetch aggregate="true">
  <entity name="account">
    <attribute name="statecode" alias="state" groupby="true"/>
    <attribute name="revenue" alias="total" aggregate="sum"/>
    <link-entity name="contact" from="parentcustomerid" to="accountid" link-type="inner" alias="contact">
      <attribute name="fullname"/>
    </link-entity>
  </entity>
</fetch>`

      const ast1 = parseFetchXml(xml)
      const serialised = serialiseFetchXml(ast1)
      const ast2 = parseFetchXml(serialised)

      expect(ast2.attrs.aggregate).toBe('true')

      const entity2 = ast2.children[0]
      expect(entity2.children.length).toBe(3) // 2 attributes + 1 link-entity

      const attrs = entity2.children.filter((c) => c.type === 'attribute')
      expect(attrs).toHaveLength(2)
      expect(attrs[0].attrs.groupby).toBe('true')
      expect(attrs[1].attrs.aggregate).toBe('sum')

      const link = entity2.children.find((c) => c.type === 'link-entity')
      expect(link?.attrs.alias).toBe('contact')
    })
  })

  describe('prettyPrintFetchXml', () => {
    it('should format XML consistently', () => {
      const uglyXml = '<fetch><entity name="account"><attribute name="name"/></entity></fetch>'
      const pretty = prettyPrintFetchXml(uglyXml)

      expect(pretty).toContain('<?xml version="1.0" encoding="utf-8"?>')
      expect(pretty).toContain('<fetch')
      expect(pretty).toContain('<entity name="account"')
      expect(pretty).toContain('<attribute name="name"')
    })

    it('should return original XML on parse error', () => {
      const invalidXml = 'not valid xml'
      const result = prettyPrintFetchXml(invalidXml)

      expect(result).toBe(invalidXml)
    })
  })
})
