import { Suspense, useEffect } from 'react'
import { Spin } from 'antd'
import { AppShell } from './components/Layout/AppShell.tsx'
import { BuilderCenterPanel } from './components/Layout/BuilderCenterPanel.tsx'
import { TreeBuilderPanel } from './components/TreeBuilder/TreeBuilderPanel.tsx'
import { XmlEditorPanel } from './components/XmlEditor/XmlEditorPanel.tsx'
import { CodeOutputPanel } from './components/CodeOutput/CodeOutputPanel.tsx'
import { ResultGridPanel } from './components/ResultGrid/ResultGridPanel.tsx'
import { HistoryPanel } from './components/common/HistoryPanel.tsx'
import { SettingsPanel } from './components/common/SettingsPanel.tsx'
import { useFxbStore } from './store/index.ts'
import { MOCK_ENTITIES } from './services/mock/mockData.ts'

function RightPanel() {
  const { activeTab } = useFxbStore()
  if (activeTab === 'code') return <CodeOutputPanel />
  return <XmlEditorPanel />
}

function CenterPanel() {
  const { activeTab } = useFxbStore()
  switch (activeTab) {
    case 'result':   return <ResultGridPanel />
    case 'history':  return <HistoryPanel />
    case 'settings': return <SettingsPanel />
    default:         return <BuilderCenterPanel />
  }
}

export default function App() {
  const { setEntities, settings, loadMetadata } = useFxbStore()

  useEffect(() => {
    if (settings.useMockData) {
      // Phase 1 – load mock entity metadata
      setEntities(MOCK_ENTITIES)
    } else {
      // Phase 2 – fetch real metadata from the backend
      void loadMetadata()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.useMockData])

  return (
    <Suspense
      fallback={
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0f1117' }}>
          <Spin size="large" />
        </div>
      }
    >
      <AppShell
        left={<TreeBuilderPanel />}
        center={<CenterPanel />}
        right={<RightPanel />}
      />
    </Suspense>
  )
}
