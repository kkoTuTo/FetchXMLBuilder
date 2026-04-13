/**
 * Dataverse query service – executes FetchXML queries against the backend.
 * In Phase 2 the backend proxies the request to Dataverse using ADFS credentials.
 */

// ─── Request / response types ─────────────────────────────────────────────────

export interface ExecuteQueryRequest {
  fetchXml: string
  pagingCookie?: string | null
  pageNumber?: number
}

export interface QueryResult {
  /** The array of record objects returned by Dataverse */
  records: Record<string, unknown>[]
  /** Paging cookie to use for subsequent page requests (null on last page) */
  pagingCookie: string | null
  /** Total record count (only set when returntotalrecordcount="true") */
  totalRecordCount: number | null
  /** Whether more records exist after this page */
  moreRecords: boolean
}

// ─── POST execute ─────────────────────────────────────────────────────────────

/**
 * Executes a FetchXML query via POST (Dataverse SDK).
 * Preferred for complex / long queries.
 */
export async function executeQuery(
  baseApiUrl: string,
  request: ExecuteQueryRequest,
): Promise<QueryResult> {
  const res = await fetch(`${baseApiUrl}/api/query/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fetchXml: request.fetchXml,
      pagingCookie: request.pagingCookie ?? null,
      pageNumber: request.pageNumber ?? 1,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Query execution failed (${res.status}): ${text}`)
  }

  return normaliseResult(await res.json())
}

/**
 * Executes a FetchXML query via GET (Dataverse Web API).
 * Suitable for small queries where URL length is not a concern.
 */
export async function executeQueryGet(
  baseApiUrl: string,
  fetchXml: string,
  pageNumber = 1,
): Promise<QueryResult> {
  const params = new URLSearchParams({ fetchXml, pageNumber: String(pageNumber) })
  const res = await fetch(`${baseApiUrl}/api/query/execute?${params.toString()}`)

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Query execution failed (${res.status}): ${text}`)
  }

  return normaliseResult(await res.json())
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Normalises the backend response.
 * The SDK service returns a JsonElement that may be an OData response
 * ({ value: [...], '@odata.count': N, ... }) or a raw EntityCollection.
 */
function normaliseResult(raw: unknown): QueryResult {
  if (raw === null || typeof raw !== 'object') {
    return { records: [], pagingCookie: null, totalRecordCount: null, moreRecords: false }
  }

  const obj = raw as Record<string, unknown>

  // OData Web API format
  if (Array.isArray(obj['value'])) {
    return {
      records: obj['value'] as Record<string, unknown>[],
      pagingCookie: (obj['@Microsoft.Dynamics.CRM.fetchxmlpagingcookie'] as string | null) ?? null,
      totalRecordCount: typeof obj['@odata.count'] === 'number' ? obj['@odata.count'] : null,
      moreRecords: obj['@Microsoft.Dynamics.CRM.morerecords'] === true,
    }
  }

  // SDK EntityCollection format (serialised to JSON by backend)
  if (Array.isArray(obj['Entities'])) {
    return {
      records: obj['Entities'] as Record<string, unknown>[],
      pagingCookie: (obj['PagingCookie'] as string | null) ?? null,
      totalRecordCount: typeof obj['TotalRecordCount'] === 'number' ? obj['TotalRecordCount'] : null,
      moreRecords: obj['MoreRecords'] === true,
    }
  }

  // Unknown format – return as single record
  return { records: [obj], pagingCookie: null, totalRecordCount: null, moreRecords: false }
}
