/*
 * @Author        : Frank
 * @Email         : guangzhu.zhu@foxmail.com
 * @Date          : 2026-04-07 17:02:26
 * @LastEditors   : Frank
 * @LastEditTime  : 2026-04-07 17:02:31
 * @FilePath      : \FetchXMLBuilder\web\src\core\ast\__tests__\operations.test.ts
 * @Description   :
 */
import { describe, it, expect, beforeEach } from 'vitest'
import {
  createDefaultAst,
  createEmptyNode,
  updateNode,
  deleteNode,
  addChild,
  moveNode,
  cloneNode,
  findNode,
  findNodeWithParent,
  newId,
} from '../operations.ts'
import type { FetchNode, FetchNodeType } from '../types.ts'

describe('operations', () => {
  describe('createDefaultAst', () => {
    it('should return a fetch node with one entity child', () => {
      const ast = createDefaultAst()

      expect(ast.type).toBe('fetch')
      expect(ast.attrs.version).toBe('1.0')
      expect(ast.attrs.mapping).toBe('logical')
      expect(ast.children).toHaveLength(1)
      expect(ast.children[0].type).toBe('entity')
    })

    it('should return a fetch node with entity having empty name', () => {
      const ast = createDefaultAst()
      const entity = ast.children[0]

      expect(entity.attrs.name).toBe('')
      expect(entity.children).toEqual([])
    })

    it('should generate unique ids for each node', () => {
      const ast1 = createDefaultAst()
      const ast2 = createDefaultAst()

      expect(ast1.id).toBeDefined()
      expect(ast2.id).toBeDefined()
      expect(ast1.id).not.toBe(ast2.id)
    })
  })

  describe('createEmptyNode', () => {
    const nodeTypes: FetchNodeType[] = [
      'fetch',
      'entity',
      'link-entity',
      'attribute',
      'all-attributes',
      'filter',
      'condition',
      'order',
      'value',
      '#comment',
    ]

    nodeTypes.forEach((type) => {
      it(`should create empty node of type "${type}"`, () => {
        const node = createEmptyNode(type)

        expect(node.type).toBe(type)
        expect(node.id).toBeDefined()
        expect(node.children).toEqual([])
        expect(node.attrs).toBeDefined()
      })
    })

    it('should create fetch node with correct default attributes', () => {
      const node = createEmptyNode('fetch')

      expect(node.attrs.version).toBe('1.0')
      expect(node.attrs.mapping).toBe('logical')
    })

    it('should create entity node with empty name', () => {
      const node = createEmptyNode('entity')

      expect(node.attrs.name).toBe('')
    })

    it('should create link-entity with default attributes', () => {
      const node = createEmptyNode('link-entity')

      expect(node.attrs.name).toBe('')
      expect(node.attrs.from).toBe('')
      expect(node.attrs.to).toBe('')
      expect(node.attrs['link-type']).toBe('inner')
    })

    it('should create filter with type and', () => {
      const node = createEmptyNode('filter')

      expect(node.attrs.type).toBe('and')
    })

    it('should create condition with default operator', () => {
      const node = createEmptyNode('condition')

      expect(node.attrs.attribute).toBe('')
      expect(node.attrs.operator).toBe('eq')
    })

    it('should create order with descending false', () => {
      const node = createEmptyNode('order')

      expect(node.attrs.attribute).toBe('')
      expect(node.attrs.descending).toBe('false')
    })

    it('should create all-attributes with no attributes', () => {
      const node = createEmptyNode('all-attributes')

      expect(node.attrs).toEqual({})
    })

    it('should create value node with no attributes', () => {
      const node = createEmptyNode('value')

      expect(node.attrs).toEqual({})
    })

    it('should create comment node with empty comment', () => {
      const node = createEmptyNode('#comment')

      expect(node.attrs['#comment']).toBe('')
    })
  })

  describe('updateNode', () => {
    let ast: FetchNode

    beforeEach(() => {
      ast = createDefaultAst()
    })

    it('should update node attributes immutably', () => {
      const entityId = ast.children[0].id
      const updated = updateNode(ast, entityId, (n) => ({
        ...n,
        attrs: { ...n.attrs, name: 'account' },
      }))

      expect(updated.children[0].attrs.name).toBe('account')
      expect(ast.children[0].attrs.name).toBe('') // Original unchanged
    })

    it('should update fetch node attributes', () => {
      const updated = updateNode(ast, ast.id, (n) => ({
        ...n,
        attrs: { ...n.attrs, top: '10' },
      }))

      expect(updated.attrs.top).toBe('10')
      expect(ast.attrs.top).toBeUndefined()
    })

    it('should return unchanged tree for non-existent id', () => {
      const updated = updateNode(ast, 'non-existent-id', (n) => n)

      expect(updated).toEqual(ast)
    })

    it('should update nested nodes', () => {
      // Add a child to entity first
      const attrNode = createEmptyNode('attribute')
      const withAttr = addChild(ast, ast.children[0].id, attrNode)
      const attrId = withAttr.children[0].children[0].id

      const updated = updateNode(withAttr, attrId, (n) => ({
        ...n,
        attrs: { ...n.attrs, name: 'name' },
      }))

      expect(updated.children[0].children[0].attrs.name).toBe('name')
    })
  })

  describe('deleteNode', () => {
    let ast: FetchNode

    beforeEach(() => {
      ast = createDefaultAst()
    })

    it('should delete a child node', () => {
      const entityId = ast.children[0].id
      const updated = deleteNode(ast, entityId)

      expect(updated.children).toHaveLength(0)
    })

    it('should not delete the root node', () => {
      const updated = deleteNode(ast, ast.id)

      // Root is not deleted, only its children are filtered
      expect(updated.id).toBe(ast.id)
      expect(updated.children).toHaveLength(1) // Entity still there
    })

    it('should delete nested nodes', () => {
      const attrNode = createEmptyNode('attribute')
      const withAttr = addChild(ast, ast.children[0].id, attrNode)
      const attrId = withAttr.children[0].children[0].id

      const afterDelete = deleteNode(withAttr, attrId)

      expect(afterDelete.children[0].children).toHaveLength(0)
    })

    it('should remove entire subtree when deleting a node', () => {
      // Create: fetch -> entity -> filter -> condition
      const filter = createEmptyNode('filter')
      const withFilter = addChild(ast, ast.children[0].id, filter)
      const filterId = withFilter.children[0].children[0].id

      const condition = createEmptyNode('condition')
      const withCondition = addChild(withFilter, filterId, condition)
      const conditionId = withCondition.children[0].children[0].children[0].id

      // Delete filter, condition should also be gone
      const afterDelete = deleteNode(withCondition, filterId)

      expect(afterDelete.children[0].children).toHaveLength(0)
      expect(findNode(afterDelete, conditionId)).toBeNull()
    })

    it('should return unchanged tree for non-existent id', () => {
      const updated = deleteNode(ast, 'non-existent-id')

      expect(updated.children).toHaveLength(1)
    })
  })

  describe('addChild', () => {
    let ast: FetchNode

    beforeEach(() => {
      ast = createDefaultAst()
    })

    it('should add a child to the parent node', () => {
      const attrNode = createEmptyNode('attribute')
      const entityId = ast.children[0].id
      const updated = addChild(ast, entityId, attrNode)

      expect(updated.children[0].children).toHaveLength(1)
      expect(updated.children[0].children[0].type).toBe('attribute')
    })

    it('should add multiple children', () => {
      const attr1 = createEmptyNode('attribute')
      const attr2 = createEmptyNode('attribute')
      const entityId = ast.children[0].id

      const withOne = addChild(ast, entityId, attr1)
      const withTwo = addChild(withOne, entityId, attr2)

      expect(withTwo.children[0].children).toHaveLength(2)
    })

    it('should not modify the original tree', () => {
      const attrNode = createEmptyNode('attribute')
      const entityId = ast.children[0].id
      addChild(ast, entityId, attrNode)

      expect(ast.children[0].children).toHaveLength(0)
    })
  })

  describe('moveNode', () => {
    let ast: FetchNode
    let attr1: FetchNode
    let attr2: FetchNode
    let attr3: FetchNode

    beforeEach(() => {
      ast = createDefaultAst()
      attr1 = createEmptyNode('attribute')
      attr2 = createEmptyNode('attribute')
      attr3 = createEmptyNode('attribute')

      const entityId = ast.children[0].id
      let tree = addChild(ast, entityId, attr1)
      tree = addChild(tree, entityId, attr2)
      tree = addChild(tree, entityId, attr3)
      ast = tree
    })

    it('should move node up', () => {
      const attr2Id = ast.children[0].children[1].id
      const moved = moveNode(ast, attr2Id, 'up')

      // attr2 should now be at index 0
      expect(moved.children[0].children[0].id).toBe(attr2Id)
    })

    it('should move node down', () => {
      const attr1Id = ast.children[0].children[0].id
      const moved = moveNode(ast, attr1Id, 'down')

      // attr1 should now be at index 1
      expect(moved.children[0].children[1].id).toBe(attr1Id)
    })

    it('should not move first node up', () => {
      const attr1Id = ast.children[0].children[0].id
      const moved = moveNode(ast, attr1Id, 'up')

      // Position should remain unchanged
      expect(moved.children[0].children[0].id).toBe(attr1Id)
    })

    it('should not move last node down', () => {
      const attr3Id = ast.children[0].children[2].id
      const moved = moveNode(ast, attr3Id, 'down')

      // Position should remain unchanged
      expect(moved.children[0].children[2].id).toBe(attr3Id)
    })

    it('should return unchanged tree for non-existent id', () => {
      const moved = moveNode(ast, 'non-existent-id', 'up')

      expect(moved).toEqual(ast)
    })

    it('should not move node without parent (root)', () => {
      const moved = moveNode(ast, ast.id, 'up')

      expect(moved).toEqual(ast)
    })
  })

  describe('cloneNode', () => {
    it('should create a deep clone with new id', () => {
      const ast = createDefaultAst()
      const cloned = cloneNode(ast)

      expect(cloned.id).not.toBe(ast.id)
      expect(cloned.type).toBe(ast.type)
      expect(cloned.attrs).toEqual(ast.attrs)
    })

    it('should clone children with new ids', () => {
      const ast = createDefaultAst()
      const cloned = cloneNode(ast)

      expect(cloned.children[0].id).not.toBe(ast.children[0].id)
      expect(cloned.children[0].type).toBe(ast.children[0].type)
    })

    it('should deep clone nested structure', () => {
      let ast = createDefaultAst()
      const filter = createEmptyNode('filter')
      const condition = createEmptyNode('condition')
      const filterId = filter.id
      const conditionId = condition.id

      ast = addChild(ast, ast.children[0].id, filter)
      ast = addChild(ast, filterId, condition)

      const cloned = cloneNode(ast)

      // Find filter and condition in cloned tree
      const clonedFilter = cloned.children[0].children[0]
      expect(clonedFilter.id).not.toBe(filterId)
      expect(clonedFilter.children[0].id).not.toBe(conditionId)
    })
  })

  describe('findNode', () => {
    it('should find root node by id', () => {
      const ast = createDefaultAst()
      const found = findNode(ast, ast.id)

      expect(found).toBe(ast)
    })

    it('should find child node by id', () => {
      const ast = createDefaultAst()
      const entityId = ast.children[0].id
      const found = findNode(ast, entityId)

      expect(found).toBe(ast.children[0])
    })

    it('should find deeply nested node', () => {
      let ast = createDefaultAst()
      const filter = createEmptyNode('filter')
      const condition = createEmptyNode('condition')

      ast = addChild(ast, ast.children[0].id, filter)
      const filterId = ast.children[0].children[0].id
      ast = addChild(ast, filterId, condition)

      const conditionId = ast.children[0].children[0].children[0].id
      const found = findNode(ast, conditionId)

      expect(found?.id).toBe(conditionId)
    })

    it('should return null for non-existent id', () => {
      const ast = createDefaultAst()
      const found = findNode(ast, 'non-existent-id')

      expect(found).toBeNull()
    })
  })

  describe('findNodeWithParent', () => {
    it('should find root node with null parent', () => {
      const ast = createDefaultAst()
      const result = findNodeWithParent(ast, ast.id)

      expect(result).not.toBeNull()
      expect(result?.node).toBe(ast)
      expect(result?.parent).toBeNull()
    })

    it('should find child node with parent', () => {
      const ast = createDefaultAst()
      const entityId = ast.children[0].id
      const result = findNodeWithParent(ast, entityId)

      expect(result).not.toBeNull()
      expect(result?.node).toBe(ast.children[0])
      expect(result?.parent).toBe(ast)
    })

    it('should return null for non-existent id', () => {
      const ast = createDefaultAst()
      const result = findNodeWithParent(ast, 'non-existent-id')

      expect(result).toBeNull()
    })
  })

  describe('newId', () => {
    it('should generate unique ids', () => {
      const ids = new Set<string>()
      for (let i = 0; i < 100; i++) {
        ids.add(newId())
      }

      expect(ids.size).toBe(100)
    })

    it('should generate ids starting with "node_"', () => {
      const id = newId()
      expect(id.startsWith('node_')).toBe(true)
    })
  })
})
