/**
 * Central Zustand store for FetchXML Builder.
 * Holds the AST, validation results, UI state, history, and settings.
 */

import { create } from 'zustand'
import { persist, devtools } from 'zustand/middleware'
import type { FetchNode } from '@/core/ast/types.ts'
import type { ValidationResult } from '@/core/ast/types.ts'
import type { EntityMeta } from '@/core/validator/index.ts'
import type { CodeLanguage, QExStyle, QExFlavor } from '@/core/codegen/index.ts'
import {
  createDefaultAst,
  createEmptyNode,
  updateNode,
  deleteNode,
  addChild,
  moveNode,
  cloneNode,
} from '@/core/ast/index.ts'
import { serialiseFetchXml, parseFetchXml } from '@/core/parser/index.ts'
import { validateTree } from '@/core/validator/index.ts'
import { MOCK_ACCOUNT_RESULTS } from '@/services/mock/mockData.ts'
import { executeQuery } from '@/services/dataverse/queryService.ts'
import { fetchEntities } from '@/services/metadata/metadataService.ts'
import { fetchAuthContext } from '@/services/auth/authService.ts'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface QueryHistoryEntry {
  id: string
  xml: string
  savedAt: number
  label?: string
}

export interface AppSettings {
  showNodeType: boolean
  showValidation: boolean
  theme: 'light' | 'dark'
  language: string
  orgUrl: string
  baseApiUrl: string
  /**
   * When true (default), the app uses mock data and simulated queries.
   * Set to false to connect to the real ASP.NET Core backend API.
   */
  useMockData: boolean
  /** Legacy simple C# toggle (fetchxml | fetchexpression).
   *  Superseded by qexStyle when the full options panel is used. */
  csharpStyle: 'fetchxml' | 'fetchexpression'
  // ── Full C# code generation options (matching original plugin) ───────────
  qexStyle: QExStyle
  qexFlavor: QExFlavor
  qexObjectInitializer: boolean
  qexIndents: number
  qexIncludeComments: boolean
  qexFilterVariables: boolean
}

export interface FxbState {
  // ── AST ──────────────────────────────────────────────────────────────────
  root: FetchNode
  selectedNodeId: string | null
  validationResults: Map<string, ValidationResult>

  // ── Metadata ──────────────────────────────────────────────────────────────
  entities: EntityMeta[]
  metadataLoading: boolean

  // ── UI ────────────────────────────────────────────────────────────────────
  activeTab: 'builder' | 'result' | 'code' | 'history' | 'settings'
  activeCodeLang: CodeLanguage
  xmlPanelVisible: boolean

  // ── Query execution ──────────────────────────────────────────────────────
  queryResults: Record<string, unknown>[]
  queryRunning: boolean
  queryError: string | null
  queryPage: number
  queryTotalCount: number | null

  // ── Auth ──────────────────────────────────────────────────────────────────
  isAuthenticated: boolean
  accountName: string | null

  // ── History ───────────────────────────────────────────────────────────────
  history: QueryHistoryEntry[]

  // ── Settings ─────────────────────────────────────────────────────────────
  settings: AppSettings

  // ── Actions ───────────────────────────────────────────────────────────────
  setRoot: (root: FetchNode) => void
  importXml: (xml: string) => string | null // returns error message or null
  selectNode: (id: string | null) => void
  updateNodeAttrs: (id: string, attrs: Record<string, string>) => void
  addChildNode: (parentId: string, type: FetchNode['type']) => void
  duplicateNode: (id: string) => void
  removeNode: (id: string) => void
  moveNodeDir: (id: string, direction: 'up' | 'down') => void
  setEntities: (entities: EntityMeta[]) => void
  setMetadataLoading: (loading: boolean) => void
  /** Loads entities from the real backend API (Phase 2). No-op in mock mode. */
  loadMetadata: () => Promise<void>
  setActiveTab: (tab: FxbState['activeTab']) => void
  setActiveCodeLang: (lang: CodeLanguage) => void
  toggleXmlPanel: () => void
  setQueryResults: (results: Record<string, unknown>[], total: number | null) => void
  setQueryRunning: (running: boolean) => void
  setQueryError: (error: string | null) => void
  setQueryPage: (page: number) => void
  runQuery: () => void
  setAuth: (authenticated: boolean, accountName: string | null) => void
  saveToHistory: (label?: string) => void
  restoreHistory: (id: string) => void
  clearHistory: () => void
  updateSettings: (patch: Partial<AppSettings>) => void
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function revalidate(root: FetchNode, entities: EntityMeta[]): Map<string, ValidationResult> {
  return validateTree(root, entities.length > 0 ? entities : undefined)
}

// ─── Store ───────────────────────────────────────────────────────────────────

const DEFAULT_SETTINGS: AppSettings = {
  showNodeType: true,
  showValidation: true,
  theme: 'light',
  language: 'en',
  orgUrl: '',
  baseApiUrl: 'https://[org].api.crm.dynamics.com/api/data/v9.2',
  useMockData: true,
  csharpStyle: 'fetchxml',
  qexStyle: 'FetchXML',
  qexFlavor: 'LateBound',
  qexObjectInitializer: false,
  qexIndents: 0,
  qexIncludeComments: true,
  qexFilterVariables: true,
}

export const useFxbStore = create<FxbState>()(
  devtools(
    persist(
      (set, get) => ({
        // ── Initial state ───────────────────────────────────────────────────
        root: createDefaultAst(),
        selectedNodeId: null,
        validationResults: new Map(),
        entities: [],
        metadataLoading: false,
        activeTab: 'builder',
        activeCodeLang: 'fetchxml',
        xmlPanelVisible: true,
        queryResults: [],
        queryRunning: false,
        queryError: null,
        queryPage: 1,
        queryTotalCount: null,
        isAuthenticated: false,
        accountName: null,
        history: [],
        settings: DEFAULT_SETTINGS,

        // ── Actions ─────────────────────────────────────────────────────────
        setRoot: (root) => {
          set((s) => ({
            root,
            validationResults: revalidate(root, s.entities),
          }))
        },

        importXml: (xml) => {
          try {
            const root = parseFetchXml(xml)
            set((s) => ({
              root,
              selectedNodeId: null,
              validationResults: revalidate(root, s.entities),
            }))
            return null
          } catch (e) {
            return e instanceof Error ? e.message : 'Parse error'
          }
        },

        selectNode: (id) => set({ selectedNodeId: id }),

        updateNodeAttrs: (id, attrs) => {
          set((s) => {
            const root = updateNode(s.root, id, (n) => ({ ...n, attrs: { ...n.attrs, ...attrs } }))
            return { root, validationResults: revalidate(root, s.entities) }
          })
        },

        addChildNode: (parentId, type) => {
          const child = createEmptyNode(type)
          set((s) => {
            const root = addChild(s.root, parentId, child)
            return {
              root,
              selectedNodeId: child.id,
              validationResults: revalidate(root, s.entities),
            }
          })
        },

        duplicateNode: (id) => {
          const state = get()
          // find parent
          const findParent = (node: FetchNode): FetchNode | null => {
            for (const child of node.children) {
              if (child.id === id) return node
              const found = findParent(child)
              if (found) return found
            }
            return null
          }
          const parent = findParent(state.root)
          if (!parent) return
          const original = parent.children.find((c) => c.id === id)
          if (!original) return
          const clone = cloneNode(original)
          set((s) => {
            const root = addChild(s.root, parent.id, clone)
            return {
              root,
              selectedNodeId: clone.id,
              validationResults: revalidate(root, s.entities),
            }
          })
        },

        removeNode: (id) => {
          set((s) => {
            const root = deleteNode(s.root, id)
            const selectedNodeId = s.selectedNodeId === id ? null : s.selectedNodeId
            return { root, selectedNodeId, validationResults: revalidate(root, s.entities) }
          })
        },

        moveNodeDir: (id, direction) => {
          set((s) => {
            const root = moveNode(s.root, id, direction)
            return { root, validationResults: revalidate(root, s.entities) }
          })
        },

        setEntities: (entities) => {
          set((s) => ({
            entities,
            validationResults: revalidate(s.root, entities),
          }))
        },

        setMetadataLoading: (loading) => set({ metadataLoading: loading }),

        loadMetadata: async () => {
          const { settings } = get()
          if (settings.useMockData) return // mock entities are loaded in App.tsx

          set({ metadataLoading: true })
          try {
            // First resolve auth context so we can also show "connected" state
            try {
              const ctx = await fetchAuthContext(settings.baseApiUrl)
              // Display the org URL as the connection label in the header
              const orgLabel = new URL(ctx.orgUrl).hostname
              set({ isAuthenticated: true, accountName: orgLabel })
            } catch {
              // auth failure is non-fatal for metadata loading
            }
            const entities = await fetchEntities(settings.baseApiUrl)
            set((s) => ({
              entities,
              metadataLoading: false,
              validationResults: revalidate(s.root, entities),
            }))
          } catch (e) {
            set({ metadataLoading: false })
            console.error('Failed to load metadata from API:', e)
          }
        },

        setActiveTab: (activeTab) => set({ activeTab }),

        setActiveCodeLang: (activeCodeLang) => set({ activeCodeLang }),

        toggleXmlPanel: () =>
          set((s) => ({ xmlPanelVisible: !s.xmlPanelVisible })),

        setQueryResults: (queryResults, queryTotalCount) =>
          set({ queryResults, queryTotalCount, queryRunning: false }),

        setQueryRunning: (queryRunning) => set({ queryRunning }),

        setQueryError: (queryError) => set({ queryError, queryRunning: false }),

        setQueryPage: (queryPage) => set({ queryPage }),

        runQuery: () => {
          const { settings, root } = get()
          set({ queryRunning: true, queryError: null, activeTab: 'result' })

          if (settings.useMockData) {
            // Mock mode: simulate async query with delay
            setTimeout(() => {
              set({
                queryResults: MOCK_ACCOUNT_RESULTS as Record<string, unknown>[],
                queryTotalCount: MOCK_ACCOUNT_RESULTS.length,
                queryRunning: false,
                queryPage: 1,
              })
            }, 800)
            return
          }

          // Real API mode
          const fetchXml = serialiseFetchXml(root)
          executeQuery(settings.baseApiUrl, { fetchXml, pageNumber: get().queryPage })
            .then((result) => {
              set({
                queryResults: result.records,
                queryTotalCount: result.totalRecordCount,
                queryRunning: false,
                queryPage: 1,
              })
            })
            .catch((e: unknown) => {
              set({
                queryError: e instanceof Error ? e.message : 'Query failed',
                queryRunning: false,
              })
            })
        },

        setAuth: (isAuthenticated, accountName) =>
          set({ isAuthenticated, accountName }),

        saveToHistory: (label) => {
          const { root, history } = get()
          const xml = serialiseFetchXml(root)
          const entry: QueryHistoryEntry = {
            id: `hist_${Date.now()}`,
            xml,
            savedAt: Date.now(),
            label,
          }
          set({ history: [entry, ...history].slice(0, 50) }) // keep last 50
        },

        restoreHistory: (id) => {
          const { history } = get()
          const entry = history.find((h) => h.id === id)
          if (!entry) return
          get().importXml(entry.xml)
        },

        clearHistory: () => set({ history: [] }),

        updateSettings: (patch) =>
          set((s) => ({ settings: { ...s.settings, ...patch } })),
      }),
      {
        name: 'fxb-store',
        // Only persist non-reactive/serialisable slices
        partialize: (s) => ({
          history: s.history,
          settings: s.settings,
          activeCodeLang: s.activeCodeLang,
        }),
      },
    ),
    { name: 'FetchXMLBuilder' },
  ),
)

/** Convenience selector: current FetchXML string */
export function selectCurrentXml(state: FxbState): string {
  try {
    return serialiseFetchXml(state.root)
  } catch {
    return ''
  }
}
