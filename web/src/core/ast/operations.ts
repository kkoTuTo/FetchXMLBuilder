import type { FetchNode, FetchNodeType } from './types.ts'

let _counter = 0
export const newId = () => `node_${++_counter}`

/** Default empty AST – a fetch with one empty entity */
export function createDefaultAst(): FetchNode {
  return {
    id: newId(),
    type: 'fetch',
    attrs: { version: '1.0', mapping: 'logical' },
    children: [
      {
        id: newId(),
        type: 'entity',
        attrs: { name: '' },
        children: [],
      },
    ],
  }
}

/** Deep-clone a node tree */
export function cloneNode(node: FetchNode): FetchNode {
  return {
    ...node,
    id: newId(),
    children: node.children.map(cloneNode),
  }
}

/** Find a node by id anywhere in the tree */
export function findNode(root: FetchNode, id: string): FetchNode | null {
  if (root.id === id) return root
  for (const child of root.children) {
    const found = findNode(child, id)
    if (found) return found
  }
  return null
}

/** Find a node and its parent */
export function findNodeWithParent(
  root: FetchNode,
  id: string,
  parent: FetchNode | null = null,
): { node: FetchNode; parent: FetchNode | null } | null {
  if (root.id === id) return { node: root, parent }
  for (const child of root.children) {
    const result = findNodeWithParent(child, id, root)
    if (result) return result
  }
  return null
}

/** Immutably update a node anywhere in the tree */
export function updateNode(
  root: FetchNode,
  id: string,
  updater: (n: FetchNode) => FetchNode,
): FetchNode {
  if (root.id === id) return updater(root)
  return {
    ...root,
    children: root.children.map((c) => updateNode(c, id, updater)),
  }
}

/** Immutably delete a node by id */
export function deleteNode(root: FetchNode, id: string): FetchNode {
  return {
    ...root,
    children: root.children
      .filter((c) => c.id !== id)
      .map((c) => deleteNode(c, id)),
  }
}

/** Add a child node to a parent node */
export function addChild(
  root: FetchNode,
  parentId: string,
  child: FetchNode,
): FetchNode {
  return updateNode(root, parentId, (p) => ({
    ...p,
    children: [...p.children, child],
  }))
}

/** Move a child up or down within its parent */
export function moveNode(
  root: FetchNode,
  id: string,
  direction: 'up' | 'down',
): FetchNode {
  const result = findNodeWithParent(root, id)
  if (!result?.parent) return root
  const { parent } = result
  const idx = parent.children.findIndex((c) => c.id === id)
  if (idx < 0) return root
  const newIdx = direction === 'up' ? idx - 1 : idx + 1
  if (newIdx < 0 || newIdx >= parent.children.length) return root
  const children = [...parent.children]
  ;[children[idx], children[newIdx]] = [children[newIdx], children[idx]]
  return updateNode(root, parent.id, (p) => ({ ...p, children }))
}

/** Create an empty node of a given type */
export function createEmptyNode(type: FetchNodeType): FetchNode {
  const defaultAttrs: Record<FetchNodeType, Record<string, string>> = {
    fetch: { version: '1.0', mapping: 'logical' },
    entity: { name: '' },
    'link-entity': { name: '', from: '', to: '', 'link-type': 'inner' },
    attribute: { name: '' },
    'all-attributes': {},
    filter: { type: 'and' },
    condition: { attribute: '', operator: 'eq' },
    order: { attribute: '', descending: 'false' },
    value: {},
    '#comment': { '#comment': '' },
  }
  return {
    id: newId(),
    type,
    attrs: { ...defaultAttrs[type] },
    children: [],
  }
}
