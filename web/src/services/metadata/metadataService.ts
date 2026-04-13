/**
 * Metadata service – loads entity/attribute/relationship definitions
 * from the backend API (Phase 2) or falls back to mock data (Phase 1).
 */

import type { EntityMeta, AttrMeta } from '@/core/validator/index.ts'
import type { RelationMeta } from '@/services/mock/mockData.ts'

// ─── Response shapes (mirror Dataverse Web API OData format) ─────────────────

interface ODataCollection<T> {
  value?: T[]
}

interface ODataEntityDef {
  LogicalName: string
  PrimaryIdAttribute: string
  PrimaryNameAttribute?: string
  EntitySetName?: string
  DisplayName?: { UserLocalizedLabel?: { Label?: string } }
  IsCustomEntity?: boolean
}

interface ODataAttributeDef {
  LogicalName: string
  AttributeType?: string
  IsPrimaryId?: boolean
  IsPrimaryName?: boolean
  IsValidForRead?: boolean
}

interface ODataRelationDef {
  SchemaName: string
  ReferencedEntity?: string
  ReferencingEntity?: string
  ReferencedAttribute?: string
  ReferencingAttribute?: string
  Entity1LogicalName?: string
  Entity2LogicalName?: string
  IntersectEntityName?: string
}

interface ODataRelationshipsResponse {
  ManyToOneRelationships?: ODataCollection<ODataRelationDef>
  OneToManyRelationships?: ODataCollection<ODataRelationDef>
  ManyToManyRelationships?: ODataCollection<ODataRelationDef>
}

// ─── Mappers ──────────────────────────────────────────────────────────────────

function mapEntity(raw: ODataEntityDef): EntityMeta {
  return {
    logicalName: raw.LogicalName,
    primaryIdAttribute: raw.PrimaryIdAttribute,
    attributes: [],
  }
}

function mapAttribute(raw: ODataAttributeDef): AttrMeta {
  return {
    logicalName: raw.LogicalName,
    attributeType: raw.AttributeType ?? 'String',
    isPrimaryId: raw.IsPrimaryId ?? false,
    isValidForGrid: raw.IsValidForRead ?? true,
  }
}

function mapRelationships(raw: ODataRelationshipsResponse): RelationMeta[] {
  const result: RelationMeta[] = []
  const allRels: ODataRelationDef[] = [
    ...(raw.ManyToOneRelationships?.value ?? []),
    ...(raw.OneToManyRelationships?.value ?? []),
  ]
  for (const rel of allRels) {
    if (rel.ReferencedEntity && rel.ReferencingEntity) {
      result.push({
        schemaName: rel.SchemaName,
        referencedEntity: rel.ReferencedEntity,
        referencingEntity: rel.ReferencingEntity,
        referencedAttribute: rel.ReferencedAttribute ?? '',
        referencingAttribute: rel.ReferencingAttribute ?? '',
      })
    }
  }
  return result
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Fetches all entity definitions from the backend API.
 */
export async function fetchEntities(baseApiUrl: string): Promise<EntityMeta[]> {
  const res = await fetch(`${baseApiUrl}/api/metadata/entities`)
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Metadata entities request failed (${res.status}): ${text}`)
  }
  const data = (await res.json()) as ODataCollection<ODataEntityDef>
  return (data.value ?? []).map(mapEntity)
}

/**
 * Fetches attribute definitions for a specific entity.
 */
export async function fetchAttributes(baseApiUrl: string, entityName: string): Promise<AttrMeta[]> {
  const res = await fetch(`${baseApiUrl}/api/metadata/entities/${encodeURIComponent(entityName)}/attributes`)
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Metadata attributes request failed (${res.status}): ${text}`)
  }
  const data = (await res.json()) as ODataCollection<ODataAttributeDef>
  return (data.value ?? []).map(mapAttribute)
}

/**
 * Fetches relationship definitions for a specific entity.
 */
export async function fetchRelationships(baseApiUrl: string, entityName: string): Promise<RelationMeta[]> {
  const res = await fetch(`${baseApiUrl}/api/metadata/entities/${encodeURIComponent(entityName)}/relationships`)
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Metadata relationships request failed (${res.status}): ${text}`)
  }
  const data = (await res.json()) as ODataRelationshipsResponse
  return mapRelationships(data)
}
