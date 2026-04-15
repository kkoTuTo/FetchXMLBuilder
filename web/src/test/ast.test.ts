import { describe, it, expect } from 'vitest'
import {
  createDefaultAst,
  createEmptyNode,
  addChild,
  deleteNode,
  moveNode,
  updateNode,
  findNode,
} from '../core/ast/operations.ts'

describe('AST operations', () => {
  it('createDefaultAst returns fetch with entity child', () => {
    const ast = createDefaultAst()
    expect(ast.type).toBe('fetch')
    expect(ast.children).toHaveLength(1)
    expect(ast.children[0].type).toBe('entity')
  })

  it('createEmptyNode sets correct defaults', () => {
    const filter = createEmptyNode('filter')
    expect(filter.type).toBe('filter')
    expect(filter.attrs.type).toBe('and')

    const condition = createEmptyNode('condition')
    expect(condition.attrs.operator).toBe('eq')
  })

  it('addChild appends to the correct parent', () => {
    const root = createDefaultAst()
    const entityId = root.children[0].id
    const attr = createEmptyNode('attribute')
    const updated = addChild(root, entityId, attr)
    expect(updated.children[0].children).toHaveLength(1)
    expect(updated.children[0].children[0].type).toBe('attribute')
  })

  it('deleteNode removes the node', () => {
    const root = createDefaultAst()
    const entityId = root.children[0].id
    const updated = deleteNode(root, entityId)
    expect(updated.children).toHaveLength(0)
  })

  it('deleteNode does not remove fetch root', () => {
    const root = createDefaultAst()
    const updated = deleteNode(root, root.id)
    // deleteNode works on children, can't delete root itself
    expect(findNode(updated, root.id)).toBeTruthy()
  })

  it('moveNode moves child up and down', () => {
    const root = createDefaultAst()
    const entityId = root.children[0].id
    const attr1 = createEmptyNode('attribute')
    const attr2 = createEmptyNode('attribute')
    let updated = addChild(root, entityId, attr1)
    updated = addChild(updated, entityId, attr2)
    const entity = updated.children[0]
    expect(entity.children[0].id).toBe(attr1.id)
    expect(entity.children[1].id).toBe(attr2.id)

    // Move attr2 up
    updated = moveNode(updated, attr2.id, 'up')
    const entityAfter = updated.children[0]
    expect(entityAfter.children[0].id).toBe(attr2.id)
    expect(entityAfter.children[1].id).toBe(attr1.id)
  })

  it('updateNode updates attributes correctly', () => {
    const root = createDefaultAst()
    const entityId = root.children[0].id
    const updated = updateNode(root, entityId, (n) => ({
      ...n,
      attrs: { ...n.attrs, name: 'account' },
    }))
    expect(findNode(updated, entityId)?.attrs.name).toBe('account')
  })

  it('findNode returns null for unknown id', () => {
    const root = createDefaultAst()
    expect(findNode(root, 'non-existent')).toBeNull()
  })
})
