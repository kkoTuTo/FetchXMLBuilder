import { describe, it, expect } from 'vitest'
import { validateNode, validateTree } from '../core/validator/validator.ts'
import { parseFetchXml } from '../core/parser/xmlParser.ts'
import { createDefaultAst, createEmptyNode, addChild } from '../core/ast/operations.ts'

describe('Validator', () => {
  it('validates missing entity under fetch', () => {
    const root = createDefaultAst()
    // Remove entity child
    const emptyFetch = { ...root, children: [] }
    const result = validateNode(emptyFetch, emptyFetch)
    expect(result?.level).toBe('error')
    expect(result?.message).toBe('validation.missingEntity')
  })

  it('no error for valid fetch with entity', () => {
    const root = createDefaultAst()
    const result = validateNode(root, root)
    expect(result).toBeNull()
  })

  it('warns when entity name is empty', () => {
    const root = createDefaultAst()
    const entity = root.children[0]
    const result = validateNode(entity, root)
    expect(result?.level).toBe('warning')
    expect(result?.message).toBe('validation.entityNameRequired')
  })

  it('no warning when entity has a name', () => {
    const root = createDefaultAst()
    const updatedRoot = {
      ...root,
      children: [{ ...root.children[0], attrs: { name: 'account' } }],
    }
    const result = validateNode(updatedRoot.children[0], updatedRoot)
    expect(result).toBeNull()
  })

  it('warns when condition has no attribute', () => {
    const root = parseFetchXml(`<fetch><entity name="account"><filter><condition /></filter></entity></fetch>`)
    const filter = root.children[0].children.find((c) => c.type === 'filter')!
    const cond = filter.children[0]
    const result = validateNode(cond, root)
    expect(result?.level).toBe('warning')
    expect(result?.message).toBe('validation.conditionAttributeRequired')
  })

  it('errors on unsupported operator "contains"', () => {
    const root = parseFetchXml(`<fetch><entity name="account"><filter><condition attribute="name" operator="contains" value="x" /></filter></entity></fetch>`)
    const cond = root.children[0].children[0].children[0]
    const result = validateNode(cond, root)
    expect(result?.level).toBe('error')
    expect(result?.message).toBe('validation.operatorNotSupported')
  })

  it('warns on empty filter', () => {
    const root = createDefaultAst()
    const filter = createEmptyNode('filter')
    const updatedRoot = addChild(root, root.children[0].id, filter)
    const filterNode = updatedRoot.children[0].children.find((c) => c.type === 'filter')!
    const result = validateNode(filterNode, updatedRoot)
    expect(result?.level).toBe('info')
    expect(result?.message).toBe('validation.filterEmpty')
  })

  it('validateTree returns a map of issues', () => {
    const root = createDefaultAst() // entity has no name → 1 warning
    const results = validateTree(root)
    expect(results.size).toBeGreaterThan(0)
  })

  it('invalid datasource triggers error', () => {
    // The datasource check comes after the missing-entity check, so include entity
    const root = parseFetchXml(`<fetch datasource="invalid"><entity name="account" /></fetch>`)
    const result = validateNode(root, root)
    expect(result?.level).toBe('error')
    expect(result?.message).toBe('validation.invalidDatasource')
  })
})
