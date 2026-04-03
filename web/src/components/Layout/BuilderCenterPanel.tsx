import { useTranslation } from 'react-i18next'
import { useFxbStore } from '@/store/index.ts'
import { NodeFormDispatcher } from '../NodeForms/NodeForms.tsx'
import { DatabaseOutlined } from '@ant-design/icons'

export function BuilderCenterPanel() {
  const { t } = useTranslation()
  const { selectedNodeId } = useFxbStore()

  if (!selectedNodeId) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          gap: 16,
          padding: 32,
        }}
      >
        {/* Hero card */}
        <div
          style={{
            maxWidth: 420,
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 20,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 30,
              color: '#fff',
              boxShadow: '0 8px 32px rgba(99,102,241,0.4)',
            }}
          >
            <DatabaseOutlined />
          </div>

          <div>
            <h2
              style={{
                margin: '0 0 8px',
                fontSize: 22,
                fontWeight: 700,
                color: 'var(--color-text)',
                fontFamily: 'var(--font-sans)',
              }}
            >
              {t('app.title')}
            </h2>
            <p
              style={{
                margin: 0,
                fontSize: 13,
                color: 'var(--color-text-secondary)',
                lineHeight: 1.6,
              }}
            >
              {t('app.subtitle')}
            </p>
          </div>

          {/* Quick tips */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 8,
              width: '100%',
              marginTop: 8,
            }}
          >
            {[
              { icon: '🌳', title: 'Visual Tree', desc: 'Click any node in the left panel to edit its properties' },
              { icon: '✏️', title: 'XML Editor', desc: 'Edit FetchXML directly in the right panel' },
              { icon: '⚡', title: 'Code Gen', desc: 'Generate C#, OData, JS from your query' },
              { icon: '✅', title: 'Validation', desc: 'Real-time warnings and error hints' },
            ].map(({ icon, title, desc }) => (
              <div
                key={title}
                style={{
                  padding: '12px',
                  borderRadius: 10,
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-surface)',
                  textAlign: 'left',
                }}
              >
                <div style={{ fontSize: 18, marginBottom: 4 }}>{icon}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text)' }}>{title}</div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2, lineHeight: 1.4 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto' }}>
      <NodeFormDispatcher nodeId={selectedNodeId} />
    </div>
  )
}
