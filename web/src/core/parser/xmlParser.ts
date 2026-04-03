/**
 * XML ↔ FetchNode AST converter
 * Uses fast-xml-parser for parsing and builds XML string manually for serialising
 * to keep precise attribute ordering consistent with Dataverse expectations.
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
  htmlEntities: false,
  parseAttributeValue: false, // keep values as strings
})

// ─── Parse XML → AST ─────────────────────────────────────────────────────────

/** Parse a FetchXML string into a FetchNode AST.
 *  Throws if the XML cannot be parsed or does not start with <fetch>. */
export function parseFetchXml(xml: string): FetchNode {
  const trimmed = xml.trim()
  if (!trimmed) throw new Error('Empty XML')

  const parsed: unknown[] = PARSER.parse(trimmed) as unknown[]
  if (!Array.isArray(parsed) || parsed.length === 0)
    throw new Error('Invalid XML')

  // Find the first "fetch" element
  const fetchEntry = (parsed as Array<Record<string, unknown>>).find(
    (item) => 'fetch' in item,
  )
  if (!fetchEntry) throw new Error('Root element must be <fetch>')

  return convertEntry('fetch', fetchEntry['fetch'] as unknown[])
}

/** Convert a fast-xml-parser "preserve order" entry into a FetchNode */
function convertEntry(
  type: string,
  content: unknown[] | undefined,
): FetchNode {
  const attrs: Record<string, string> = {}
  const children: FetchNode[] = []

  if (Array.isArray(content)) {
    for (const item of content as Array<Record<string, unknown>>) {
      if (':@' in item) {
        // Attributes
        const attrObj = item[':@'] as Record<string, string>
        for (const [k, v] of Object.entries(attrObj)) {
          attrs[k.replace(/^@_/, '')] = String(v)
        }
      } else if ('#comment' in item) {
        const commentContent = item['#comment']
        const commentArr = Array.isArray(commentContent) ? commentContent : []
        let text = ''
        for (const ci of commentArr as Array<Record<string, unknown>>) {
          if ('#text' in ci) text += String(ci['#text'])
        }
        children.push({
          id: newId(),
          type: '#comment',
          attrs: { '#comment': text },
          children: [],
        })
      } else if ('#text' in item) {
        // text node inside value element
        attrs['#text'] = String(item['#text'])
      } else {
        // Child element
        const keys = Object.keys(item).filter((k) => k !== ':@')
        for (const key of keys) {
          if (key === '#text') {
            attrs['#text'] = String(item[key])
          } else {
            children.push(
              convertEntry(key, item[key] as unknown[]),
            )
          }
        }
      }
    }
  }

  return {
    id: newId(),
    type: type as FetchNodeType,
    attrs,
    children,
  }
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

function nodeToObj(
  node: FetchNode,
): Record<string, unknown> {
  if (node.type === '#comment') {
    return {
      '#comment': [{ '#text': node.attrs['#comment'] ?? '' }],
    }
  }

  const children: Array<Record<string, unknown>> = []

  // Attributes as :@
  const attrEntries = Object.entries(node.attrs).filter(
    ([k]) => k !== '#text',
  )
  if (attrEntries.length > 0) {
    const attrObj: Record<string, string> = {}
    for (const [k, v] of attrEntries) {
      attrObj[`@_${k}`] = v
    }
    children.push({ ':@': attrObj })
  }

  // #text inside value nodes
  if (node.attrs['#text'] !== undefined) {
    children.push({ '#text': node.attrs['#text'] })
  }

  // Child nodes
  for (const child of node.children) {
    children.push(nodeToObj(child))
  }

  return { [node.type]: children }
}

/** Pretty-print FetchXML with consistent indentation */
export function prettyPrintFetchXml(xml: string): string {
  try {
    return serialiseFetchXml(parseFetchXml(xml))
  } catch {
    return xml
  }
}
