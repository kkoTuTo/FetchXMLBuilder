/**
 * XML ↔ FetchNode AST converter
 */

import { XMLParser, XMLBuilder } from 'fast-xml-parser'
import type { FetchNode, FetchNodeType } from '../ast/types.ts'
import { newId } from '../ast/operations.ts'

// ─── Parser config ────────────────────────────────────────────────────────────

const PARSER = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  preserveOrder: true,
  commentPropName: '#comment',
  allowBooleanAttributes: true,
  processEntities: true,
  parseAttributeValue: false,
})

// ─── Parse XML → AST ─────────────────────────────────────────────────────────

/** Parse a FetchXML string into a FetchNode AST. */
export function parseFetchXml(xml: string): FetchNode {
  const trimmed = xml.trim()
  if (!trimmed) throw new Error('Empty XML')

  const parsed = PARSER.parse(trimmed) as Array<Record<string, unknown>>
  if (!Array.isArray(parsed) || parsed.length === 0)
    throw new Error('Invalid XML')

  // Skip XML declaration if present
  const fetchEntry = parsed.find(
    (item) => !('?xml' in item) && 'fetch' in item,
  )
  if (!fetchEntry) throw new Error('Root element must be <fetch>')

  // Attributes for fetch are in fetchEntry[':@']
  const fetchAttrs = extractAttrs(fetchEntry)
  const fetchContent = fetchEntry['fetch'] as Array<Record<string, unknown>> | undefined

  return {
    id: newId(),
    type: 'fetch',
    attrs: fetchAttrs,
    children: parseChildren(fetchContent ?? []),
  }
}

/** Extract attribute bag from a parsed element entry (`:@` key) */
function extractAttrs(entry: Record<string, unknown>): Record<string, string> {
  const attrObj = (entry[':@'] ?? {}) as Record<string, string>
  const result: Record<string, string> = {}
  for (const [k, v] of Object.entries(attrObj)) {
    result[k.replace(/^@_/, '')] = String(v)
  }
  return result
}

/** Parse an array of fast-xml-parser children into FetchNode children */
function parseChildren(items: Array<Record<string, unknown>>): FetchNode[] {
  const nodes: FetchNode[] = []
  for (const item of items) {
    const node = parseItem(item)
    if (node) nodes.push(node)
  }
  return nodes
}

function parseItem(item: Record<string, unknown>): FetchNode | null {
  // Comment node
  if ('#comment' in item) {
    const commentArr = item['#comment'] as Array<Record<string, unknown>> | undefined
    let text = ''
    if (Array.isArray(commentArr)) {
      for (const ci of commentArr) {
        if ('#text' in ci) text += String(ci['#text'])
      }
    } else if (typeof item['#comment'] === 'string') {
      text = item['#comment'] as string
    }
    return { id: newId(), type: '#comment', attrs: { '#comment': text }, children: [] }
  }

  // Text node (inside value elements)
  if ('#text' in item) {
    return null // handled separately by caller setting #text attr
  }

  // Element node — find the element key (not ':@')
  const keys = Object.keys(item).filter((k) => k !== ':@')
  for (const key of keys) {
    const type = key as FetchNodeType
    const attrs = extractAttrs(item)
    const content = item[key] as Array<Record<string, unknown>> | undefined

    // Check for inline #text (e.g. <value>42</value>)
    const textItem = (content ?? []).find((ci) => '#text' in ci)
    if (textItem) {
      attrs['#text'] = String(textItem['#text'])
    }

    const children = parseChildren(
      (content ?? []).filter((ci) => !('#text' in ci)),
    )

    return { id: newId(), type, attrs, children }
  }

  return null
}

// ─── Serialise AST → XML ─────────────────────────────────────────────────────

const BUILDER = new XMLBuilder({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  preserveOrder: true,
  commentPropName: '#comment',
  format: true,
  indentBy: '  ',
  suppressEmptyNode: false,
})

export function serialiseFetchXml(node: FetchNode): string {
  const obj = nodeToObj(node)
  const xml: string = BUILDER.build([obj]) as string
  return '<?xml version="1.0" encoding="utf-8"?>\n' + xml.trim()
}

function nodeToObj(node: FetchNode): Record<string, unknown> {
  if (node.type === '#comment') {
    return { '#comment': [{ '#text': node.attrs['#comment'] ?? '' }] }
  }

  const content: Array<Record<string, unknown>> = []

  // #text inside value nodes
  if (node.attrs['#text'] !== undefined) {
    content.push({ '#text': node.attrs['#text'] })
  }

  // Child nodes
  for (const child of node.children) {
    content.push(nodeToObj(child))
  }

  // Build attribute object
  const attrEntries = Object.entries(node.attrs).filter(([k]) => k !== '#text')
  const result: Record<string, unknown> = { [node.type]: content }
  if (attrEntries.length > 0) {
    const attrObj: Record<string, string> = {}
    for (const [k, v] of attrEntries) {
      attrObj[`@_${k}`] = v
    }
    result[':@'] = attrObj
  }
  return result
}

/** Pretty-print FetchXML with consistent indentation */
export function prettyPrintFetchXml(xml: string): string {
  try {
    return serialiseFetchXml(parseFetchXml(xml))
  } catch {
    return xml
  }
}
