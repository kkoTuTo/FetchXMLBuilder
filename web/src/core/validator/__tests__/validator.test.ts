/*
 * @Author        : Frank
 * @Email         : guangzhu.zhu@foxmail.com
 * @Date          : 2026-04-07 17:07:33
 * @LastEditors   : Frank
 * @LastEditTime  : 2026-04-07 17:07:39
 * @FilePath      : \FetchXMLBuilder\web\src\core\validator\__tests__\validator.test.ts
 * @Description   :
 */
import { describe, it, expect } from 'vitest'
import {
  validateNode,
  validateTree,
  validateAlias,
} from '../validator.ts'
import type { FetchNode } from '../../ast/types.ts'
import type { EntityMeta } from '../validator.ts'

// Helper to create a minimal valid AST
function createValidAst(entityName = 'account'): FetchNode {
  return {
    id: 'fetch_1',
    type: 'fetch',
    attrs: {},
    children: [
      {
        id: 'entity_1',
        type: 'entity',
        attrs: { name: entityName },
        children: [],
      },
    ],
  }
}

describe('validator', () => {
  describe('validateNode - fetch validation', () => {
    it('should return error when fetch has no entity child', () => {
      const ast: FetchNode = {
        id: 'fetch_1',
        type: 'fetch',
        attrs: {},
        children: [],
      }

      const result = validateNode(ast, ast)

      expect(result).not.toBeNull()
      expect(result?.level).toBe('error')
      expect(result?.message).toContain('Missing <entity>')
    })

    it('should return no error when fetch has entity child', () => {
      const ast = createValidAst()
      const result = validateNode(ast, ast)

      expect(result).toBeNull()
    })

    it('should return error for invalid datasource value', () => {
      const ast: FetchNode = {
        id: 'fetch_1',
        type: 'fetch',
        attrs: { datasource: 'invalid' },
        children: [
          {
            id: 'entity_1',
            type: 'entity',
            attrs: { name: 'account' },
            children: [],
          },
        ],
      }

      const result = validateNode(ast, ast)

      expect(result).not.toBeNull()
      expect(result?.level).toBe('error')
      expect(result?.message).toContain('Invalid datasource')
    })

    it('should accept datasource="retained"', () => {
      const ast: FetchNode = {
        id: 'fetch_1',
        type: 'fetch',
        attrs: { datasource: 'retained' },
        children: [
          {
            id: 'entity_1',
            type: 'entity',
            attrs: { name: 'account' },
            children: [],
          },
        ],
      }

      const result = validateNode(ast, ast)

      // No error for datasource itself
      expect(result).toBeNull()
    })

    it('should return error when aggregate is used with datasource="retained"', () => {
      const ast: FetchNode = {
        id: 'fetch_1',
        type: 'fetch',
        attrs: { datasource: 'retained', aggregate: 'true' },
        children: [
          {
            id: 'entity_1',
            type: 'entity',
            attrs: { name: 'account' },
            children: [],
          },
        ],
      }

      const result = validateNode(ast, ast)

      expect(result).not.toBeNull()
      expect(result?.level).toBe('error')
      expect(result?.message).toContain('Aggregate queries cannot use Long Term Retention')
      expect(result?.helpUrl).toBeDefined()
    })
  })

  describe('validateNode - entity validation', () => {
    it('should return warning when entity name is missing', () => {
      const ast: FetchNode = {
        id: 'fetch_1',
        type: 'fetch',
        attrs: {},
        children: [
          {
            id: 'entity_1',
            type: 'entity',
            attrs: { name: '' },
            children: [],
          },
        ],
      }

      const result = validateNode(ast.children[0], ast)

      expect(result).not.toBeNull()
      expect(result?.level).toBe('warning')
      expect(result?.message).toContain('Entity name must be specified')
    })

    it('should return warning when entity name is not in metadata', () => {
      const ast = createValidAst('nonexistent')
      const entities: EntityMeta[] = [
        { logicalName: 'account', attributes: [] },
      ]

      const result = validateNode(ast.children[0], ast, entities)

      expect(result).not.toBeNull()
      expect(result?.level).toBe('warning')
      expect(result?.message).toContain('not found in metadata')
    })

    it('should return no error when entity name exists in metadata', () => {
      const ast = createValidAst('account')
      const entities: EntityMeta[] = [
        { logicalName: 'account', attributes: [] },
      ]

      const result = validateNode(ast.children[0], ast, entities)

      expect(result).toBeNull()
    })
  })

  describe('validateNode - condition validation', () => {
    it('should return warning when condition has no attribute', () => {
      const ast: FetchNode = {
        id: 'fetch_1',
        type: 'fetch',
        attrs: {},
        children: [
          {
            id: 'entity_1',
            type: 'entity',
            attrs: { name: 'account' },
            children: [
              {
                id: 'filter_1',
                type: 'filter',
                attrs: { type: 'and' },
                children: [
                  {
                    id: 'condition_1',
                    type: 'condition',
                    attrs: { attribute: '', operator: 'eq' },
                    children: [],
                  },
                ],
              },
            ],
          },
        ],
      }

      const condition = ast.children[0].children[0].children[0]
      const result = validateNode(condition, ast)

      expect(result).not.toBeNull()
      expect(result?.level).toBe('warning')
      expect(result?.message).toContain('Condition attribute must be specified')
    })

    it('should return error for contains operator', () => {
      const ast: FetchNode = {
        id: 'fetch_1',
        type: 'fetch',
        attrs: {},
        children: [
          {
            id: 'entity_1',
            type: 'entity',
            attrs: { name: 'account' },
            children: [
              {
                id: 'filter_1',
                type: 'filter',
                attrs: { type: 'and' },
                children: [
                  {
                    id: 'condition_1',
                    type: 'condition',
                    attrs: { attribute: 'name', operator: 'contains' },
                    children: [],
                  },
                ],
              },
            ],
          },
        ],
      }

      const condition = ast.children[0].children[0].children[0]
      const result = validateNode(condition, ast)

      expect(result).not.toBeNull()
      expect(result?.level).toBe('error')
      expect(result?.message).toContain('not supported by FetchXML')
    })

    it('should return error for does-not-contain operator', () => {
      const ast: FetchNode = {
        id: 'fetch_1',
        type: 'fetch',
        attrs: {},
        children: [
          {
            id: 'entity_1',
            type: 'entity',
            attrs: { name: 'account' },
            children: [
              {
                id: 'filter_1',
                type: 'filter',
                attrs: { type: 'and' },
                children: [
                  {
                    id: 'condition_1',
                    type: 'condition',
                    attrs: { attribute: 'name', operator: 'does-not-contain' },
                    children: [],
                  },
                ],
              },
            ],
          },
        ],
      }

      const condition = ast.children[0].children[0].children[0]
      const result = validateNode(condition, ast)

      expect(result).not.toBeNull()
      expect(result?.level).toBe('error')
      expect(result?.message).toContain('not supported by FetchXML')
    })

    it('should return no error for valid condition', () => {
      const ast: FetchNode = {
        id: 'fetch_1',
        type: 'fetch',
        attrs: {},
        children: [
          {
            id: 'entity_1',
            type: 'entity',
            attrs: { name: 'account' },
            children: [
              {
                id: 'filter_1',
                type: 'filter',
                attrs: { type: 'and' },
                children: [
                  {
                    id: 'condition_1',
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

      const condition = ast.children[0].children[0].children[0]
      const result = validateNode(condition, ast)

      expect(result).toBeNull()
    })
  })

  describe('validateNode - link-entity validation', () => {
    it('should return warning when link-entity is missing required attributes', () => {
      const ast: FetchNode = {
        id: 'fetch_1',
        type: 'fetch',
        attrs: {},
        children: [
          {
            id: 'entity_1',
            type: 'entity',
            attrs: { name: 'account' },
            children: [
              {
                id: 'link_1',
                type: 'link-entity',
                attrs: { name: '', from: '', to: '' },
                children: [],
              },
            ],
          },
        ],
      }

      const link = ast.children[0].children[0]
      const result = validateNode(link, ast)

      expect(result).not.toBeNull()
      expect(result?.level).toBe('warning')
      expect(result?.message).toContain('must specify name, from and to')
    })

    it('should return error when link-entity is used with datasource="retained"', () => {
      const ast: FetchNode = {
        id: 'fetch_1',
        type: 'fetch',
        attrs: { datasource: 'retained' },
        children: [
          {
            id: 'entity_1',
            type: 'entity',
            attrs: { name: 'account' },
            children: [
              {
                id: 'link_1',
                type: 'link-entity',
                attrs: { name: 'contact', from: 'parentcustomerid', to: 'accountid' },
                children: [],
              },
            ],
          },
        ],
      }

      const link = ast.children[0].children[0]
      const result = validateNode(link, ast)

      expect(result).not.toBeNull()
      expect(result?.level).toBe('error')
      expect(result?.message).toContain('cannot be used with Long Term Retention')
    })

    it('should return error when link-entity under filter has wrong link-type', () => {
      const ast: FetchNode = {
        id: 'fetch_1',
        type: 'fetch',
        attrs: {},
        children: [
          {
            id: 'entity_1',
            type: 'entity',
            attrs: { name: 'account' },
            children: [
              {
                id: 'filter_1',
                type: 'filter',
                attrs: { type: 'and' },
                children: [
                  {
                    id: 'link_1',
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
          },
        ],
      }

      const link = ast.children[0].children[0].children[0]
      const result = validateNode(link, ast)

      expect(result).not.toBeNull()
      expect(result?.level).toBe('error')
      expect(result?.message).toContain('link-type: any, not any, all, or not all')
    })

    it('should accept link-entity under filter with correct link-type', () => {
      const ast: FetchNode = {
        id: 'fetch_1',
        type: 'fetch',
        attrs: {},
        children: [
          {
            id: 'entity_1',
            type: 'entity',
            attrs: { name: 'account' },
            children: [
              {
                id: 'filter_1',
                type: 'filter',
                attrs: { type: 'and' },
                children: [
                  {
                    id: 'link_1',
                    type: 'link-entity',
                    attrs: {
                      name: 'contact',
                      from: 'parentcustomerid',
                      to: 'accountid',
                      'link-type': 'any',
                    },
                    children: [],
                  },
                ],
              },
            ],
          },
        ],
      }

      const link = ast.children[0].children[0].children[0]
      const result = validateNode(link, ast)

      // No error for link-type inside filter
      expect(result).toBeNull()
    })

    it('should return error when any link-type is used outside filter', () => {
      const ast: FetchNode = {
        id: 'fetch_1',
        type: 'fetch',
        attrs: {},
        children: [
          {
            id: 'entity_1',
            type: 'entity',
            attrs: { name: 'account' },
            children: [
              {
                id: 'link_1',
                type: 'link-entity',
                attrs: {
                  name: 'contact',
                  from: 'parentcustomerid',
                  to: 'accountid',
                  'link-type': 'any',
                },
                children: [],
              },
            ],
          },
        ],
      }

      const link = ast.children[0].children[0]
      const result = validateNode(link, ast)

      expect(result).not.toBeNull()
      expect(result?.level).toBe('error')
      expect(result?.message).toContain('can only be used inside a filter')
    })
  })

  describe('validateNode - attribute validation', () => {
    it('should return warning when attribute name is missing', () => {
      const ast: FetchNode = {
        id: 'fetch_1',
        type: 'fetch',
        attrs: {},
        children: [
          {
            id: 'entity_1',
            type: 'entity',
            attrs: { name: 'account' },
            children: [
              {
                id: 'attr_1',
                type: 'attribute',
                attrs: { name: '' },
                children: [],
              },
            ],
          },
        ],
      }

      const attr = ast.children[0].children[0]
      const result = validateNode(attr, ast)

      expect(result).not.toBeNull()
      expect(result?.level).toBe('warning')
      expect(result?.message).toContain('Attribute name must be specified')
    })

    it('should return error when attribute is under filter', () => {
      const ast: FetchNode = {
        id: 'fetch_1',
        type: 'fetch',
        attrs: {},
        children: [
          {
            id: 'entity_1',
            type: 'entity',
            attrs: { name: 'account' },
            children: [
              {
                id: 'filter_1',
                type: 'filter',
                attrs: { type: 'and' },
                children: [
                  {
                    id: 'attr_1',
                    type: 'attribute',
                    attrs: { name: 'name' },
                    children: [],
                  },
                ],
              },
            ],
          },
        ],
      }

      const attr = ast.children[0].children[0].children[0]
      const result = validateNode(attr, ast)

      expect(result).not.toBeNull()
      expect(result?.level).toBe('error')
      expect(result?.message).toContain('Attribute under filter is not allowed')
    })

    it('should return warning for attribute without alias in aggregate query', () => {
      const ast: FetchNode = {
        id: 'fetch_1',
        type: 'fetch',
        attrs: { aggregate: 'true' },
        children: [
          {
            id: 'entity_1',
            type: 'entity',
            attrs: { name: 'account' },
            children: [
              {
                id: 'attr_1',
                type: 'attribute',
                attrs: { name: 'revenue' },
                children: [],
              },
            ],
          },
        ],
      }

      const attr = ast.children[0].children[0]
      const result = validateNode(attr, ast)

      expect(result).not.toBeNull()
      expect(result?.level).toBe('warning')
      expect(result?.message).toContain('Aggregate attribute should always have an alias')
    })

    it('should return info for attribute with alias in non-aggregate query', () => {
      const ast: FetchNode = {
        id: 'fetch_1',
        type: 'fetch',
        attrs: {},
        children: [
          {
            id: 'entity_1',
            type: 'entity',
            attrs: { name: 'account' },
            children: [
              {
                id: 'attr_1',
                type: 'attribute',
                attrs: { name: 'name', alias: 'accountName' },
                children: [],
              },
            ],
          },
        ],
      }

      const attr = ast.children[0].children[0]
      const result = validateNode(attr, ast)

      expect(result).not.toBeNull()
      expect(result?.level).toBe('info')
      expect(result?.message).toContain('Alias is not recommended for non-aggregate')
    })
  })

  describe('validateNode - filter validation', () => {
    it('should return info when filter has no children', () => {
      const ast: FetchNode = {
        id: 'fetch_1',
        type: 'fetch',
        attrs: {},
        children: [
          {
            id: 'entity_1',
            type: 'entity',
            attrs: { name: 'account' },
            children: [
              {
                id: 'filter_1',
                type: 'filter',
                attrs: { type: 'and' },
                children: [],
              },
            ],
          },
        ],
      }

      const filter = ast.children[0].children[0]
      const result = validateNode(filter, ast)

      expect(result).not.toBeNull()
      expect(result?.level).toBe('info')
      expect(result?.message).toContain('at least one condition')
    })

    it('should return no error when filter has children', () => {
      const ast: FetchNode = {
        id: 'fetch_1',
        type: 'fetch',
        attrs: {},
        children: [
          {
            id: 'entity_1',
            type: 'entity',
            attrs: { name: 'account' },
            children: [
              {
                id: 'filter_1',
                type: 'filter',
                attrs: { type: 'and' },
                children: [
                  {
                    id: 'cond_1',
                    type: 'condition',
                    attrs: { attribute: 'name', operator: 'eq', value: 'test' },
                    children: [],
                  },
                ],
              },
            ],
          },
        ],
      }

      const filter = ast.children[0].children[0]
      const result = validateNode(filter, ast)

      expect(result).toBeNull()
    })
  })

  describe('validateNode - value validation', () => {
    it('should return warning when value is empty', () => {
      const ast: FetchNode = {
        id: 'fetch_1',
        type: 'fetch',
        attrs: {},
        children: [
          {
            id: 'entity_1',
            type: 'entity',
            attrs: { name: 'account' },
            children: [
              {
                id: 'filter_1',
                type: 'filter',
                attrs: { type: 'and' },
                children: [
                  {
                    id: 'cond_1',
                    type: 'condition',
                    attrs: { attribute: 'accountid', operator: 'in' },
                    children: [
                      {
                        id: 'value_1',
                        type: 'value',
                        attrs: {},
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

      const value = ast.children[0].children[0].children[0].children[0]
      const result = validateNode(value, ast)

      expect(result).not.toBeNull()
      expect(result?.level).toBe('warning')
      expect(result?.message).toContain('Value should not be empty')
    })

    it('should return no error when value has content', () => {
      const ast: FetchNode = {
        id: 'fetch_1',
        type: 'fetch',
        attrs: {},
        children: [
          {
            id: 'entity_1',
            type: 'entity',
            attrs: { name: 'account' },
            children: [
              {
                id: 'filter_1',
                type: 'filter',
                attrs: { type: 'and' },
                children: [
                  {
                    id: 'cond_1',
                    type: 'condition',
                    attrs: { attribute: 'accountid', operator: 'in' },
                    children: [
                      {
                        id: 'value_1',
                        type: 'value',
                        attrs: { '#text': 'some-value' },
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

      const value = ast.children[0].children[0].children[0].children[0]
      const result = validateNode(value, ast)

      expect(result).toBeNull()
    })
  })

  describe('validateNode - order validation', () => {
    it('should return warning when order has no attribute in non-aggregate query', () => {
      const ast: FetchNode = {
        id: 'fetch_1',
        type: 'fetch',
        attrs: {},
        children: [
          {
            id: 'entity_1',
            type: 'entity',
            attrs: { name: 'account' },
            children: [
              {
                id: 'order_1',
                type: 'order',
                attrs: { attribute: '' },
                children: [],
              },
            ],
          },
        ],
      }

      const order = ast.children[0].children[0]
      const result = validateNode(order, ast)

      expect(result).not.toBeNull()
      expect(result?.level).toBe('warning')
      expect(result?.message).toContain('Order attribute must be specified')
    })

    it('should return warning when order has attribute in aggregate query', () => {
      const ast: FetchNode = {
        id: 'fetch_1',
        type: 'fetch',
        attrs: { aggregate: 'true' },
        children: [
          {
            id: 'entity_1',
            type: 'entity',
            attrs: { name: 'account' },
            children: [
              {
                id: 'order_1',
                type: 'order',
                attrs: { attribute: 'name' },
                children: [],
              },
            ],
          },
        ],
      }

      const order = ast.children[0].children[0]
      const result = validateNode(order, ast)

      expect(result).not.toBeNull()
      expect(result?.level).toBe('warning')
      expect(result?.message).toContain('must NOT be specified in aggregate')
    })

    it('should return warning when order has no alias in aggregate query', () => {
      const ast: FetchNode = {
        id: 'fetch_1',
        type: 'fetch',
        attrs: { aggregate: 'true' },
        children: [
          {
            id: 'entity_1',
            type: 'entity',
            attrs: { name: 'account' },
            children: [
              {
                id: 'order_1',
                type: 'order',
                attrs: {},
                children: [],
              },
            ],
          },
        ],
      }

      const order = ast.children[0].children[0]
      const result = validateNode(order, ast)

      expect(result).not.toBeNull()
      expect(result?.level).toBe('warning')
      expect(result?.message).toContain('Order alias must be specified in aggregate')
    })
  })

  describe('validateAlias', () => {
    it('should return null for undefined alias', () => {
      expect(validateAlias(undefined)).toBeNull()
    })

    it('should return null for valid alias', () => {
      expect(validateAlias('validAlias')).toBeNull()
      expect(validateAlias('Valid_Alias123')).toBeNull()
      expect(validateAlias('_startsWithUnderscore')).toBeNull()
    })

    it('should return error for invalid alias starting with number', () => {
      const result = validateAlias('123invalid')

      expect(result).not.toBeNull()
      expect(result?.level).toBe('error')
      expect(result?.message).toContain('Invalid alias')
    })

    it('should return error for alias with special characters', () => {
      const result = validateAlias('invalid-alias')

      expect(result).not.toBeNull()
      expect(result?.level).toBe('error')
    })

    it('should return error for alias with spaces', () => {
      const result = validateAlias('invalid alias')

      expect(result).not.toBeNull()
      expect(result?.level).toBe('error')
    })
  })

  describe('validateTree', () => {
    it('should return empty map for valid query', () => {
      const ast = createValidAst()
      const results = validateTree(ast)

      expect(results.size).toBe(0)
    })

    it('should collect all validation errors', () => {
      const ast: FetchNode = {
        id: 'fetch_1',
        type: 'fetch',
        attrs: {},
        children: [
          {
            id: 'entity_1',
            type: 'entity',
            attrs: { name: '' }, // Warning: empty name
            children: [
              {
                id: 'filter_1',
                type: 'filter',
                attrs: { type: 'and' },
                children: [
                  {
                    id: 'condition_1',
                    type: 'condition',
                    attrs: { attribute: '', operator: 'eq' }, // Warning: empty attribute
                    children: [],
                  },
                ],
              },
            ],
          },
        ],
      }

      const results = validateTree(ast)

      expect(results.size).toBeGreaterThan(0)
      expect(results.has('entity_1')).toBe(true)
      expect(results.has('condition_1')).toBe(true)
    })

    it('should validate nested structures', () => {
      const ast: FetchNode = {
        id: 'fetch_1',
        type: 'fetch',
        attrs: { datasource: 'retained' },
        children: [
          {
            id: 'entity_1',
            type: 'entity',
            attrs: { name: 'account' },
            children: [
              {
                id: 'link_1',
                type: 'link-entity', // Error: link-entity with retained
                attrs: { name: 'contact', from: 'parentcustomerid', to: 'accountid' },
                children: [],
              },
            ],
          },
        ],
      }

      const results = validateTree(ast)

      expect(results.has('link_1')).toBe(true)
      expect(results.get('link_1')?.level).toBe('error')
    })
  })
})
