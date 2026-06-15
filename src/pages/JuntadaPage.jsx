import { useState, useEffect, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getJuntada, unirseAJuntada } from '../utils/firestore'
import TabInvitados from '../components/juntada/TabInvitados'
import TabFechas from '../components/juntada/TabFechas'
import TabItems from '../components/juntada/TabItems'
import TabGastos from '../components/juntada/TabGastos'
import TabAutos from '../components/juntada/TabAutos'
import TabMenu from '../components/juntada/TabMenu'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const TABS = [
  { id: 'invitados', label: '👥 Invitados' },
  { id: 'fechas',    label: '📅 Cuándo' },
  { id: 'menu',      label: '🍽 Menú' },
  { id: 'items',     label: '🛍 Qué llevar' },
  { id: 'gastos',    label: '💸 Gastos' },
  { id: 'autos',     label: '🚗 Autos' },
]

export default function JuntadaPage() {
  const { id } = useParams()
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const [juntada, setJuntada] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('invitados')
  const [copied, setCopied] = useState(false)
  const [joining, setJoining] = useState(false)

  const reload = useCallback(async () => {
    const data = await getJuntada(id)
    setJuntada(data)
  }, [id])

  useEffect(() => {
    reload().finally(() => setLoading(false))
  }, [reload])

  useEffect(() => {
    if (!juntada || !currentUser) return
    const yaEsta = (juntada.invitadosUids || []).includes(currentUser.uid)
    if (!yaEsta) {
      setJoining(true)
      unirseAJuntada(id, currentUser)
        .then(reload)
        .finally(() => setJoining(false))
    }
  }, [juntada?.id, currentUser?.uid])

  function shareLink() {
    const url = `${window.location.origin}/unirse/${juntada.shareCode}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-3)' }}>Cargando...</div>
  )
  if (!juntada) return (
    <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
      <h2>Juntada no encontrada</h2>
      <Link to="/" className="btn btn-primary" style={{ marginTop: '1rem' }}>Ir al inicio</Link>
    </div>
  )

  const esOrganizador = juntada.organizadorId === currentUser?.uid
  const invitadosQueVan = (juntada.invitados || []).filter(i => i.estado === 'va')
  const totalPersonas = invitadosQueVan.reduce((s, i) => s + (i.adultos ?? 1) + (i.menores ?? 0), 0)
  const totalMenores = invitadosQueVan.reduce((s, i) => s + (i.menores ?? 0), 0)

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '1.25rem 1rem 4rem' }}>

      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <Link to="/" className="btn btn-ghost btn-sm" style={{ paddingLeft: 0, marginBottom: '0.75rem' }}>
          ← Mis juntadas
        </Link>

        <div className="flex items-center justify-between gap-3" style={{ flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontSize: '1.6rem', marginBottom: '0.25rem' }}>{juntada.nombre}</h1>
            <div className="flex gap-3" style={{ flexWrap: 'wrap' }}>
              {juntada.fechaConfirmada && (
                <span className="text-sm text-muted">
                  📅 {format(new Date(juntada.fechaConfirmada), "EEEE d 'de' MMMM", { locale: es })}
                </span>
              )}
              {juntada.lugar && <span className="text-sm text-muted">📍 {juntada.lugar}</span>}
              <span className="text-sm text-muted">
                👥 {totalPersonas} personas
                {totalMenores > 0 && <span style={{ color: 'var(--info)', marginLeft: 4 }}>({totalMenores} menor{totalMenores > 1 ? 'es' : ''})</span>}
              </span>
            </div>
            {juntada.descripcion && (
              <p style={{ marginTop: '0.375rem', fontSize: '0.875rem' }}>{juntada.descripcion}</p>
            )}
          </div>

          <button onClick={shareLink} className="btn btn-secondary btn-sm" style={{ flexShrink: 0 }}>
            {copied ? '✓ Copiado!' : '🔗 Compartir'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="scroll-x" style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', gap: '4px', minWidth: 'max-content', background: 'var(--surface-2)', borderRadius: 'var(--radius)', padding: '4px' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{
                padding: '0.45rem 0.875rem',
                border: 'none',
                borderRadius: 'calc(var(--radius) - 2px)',
                background: tab === t.id ? 'white' : 'transparent',
                color: tab === t.id ? 'var(--text)' : 'var(--text-2)',
                fontWeight: tab === t.id ? 500 : 400,
                fontSize: '0.875rem',
                cursor: 'pointer',
                boxShadow: tab === t.id ? 'var(--shadow-sm)' : 'none',
                transition: 'all 0.15s',
                fontFamily: 'var(--font)',
                whiteSpace: 'nowrap'
              }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {joining && <div className="alert alert-info" style={{ marginBottom: '1rem' }}>Uniéndote a la juntada...</div>}

      {tab === 'invitados' && <TabInvitados juntada={juntada} reload={reload} esOrganizador={esOrganizador} />}
      {tab === 'fechas'    && <TabFechas    juntada={juntada} reload={reload} esOrganizador={esOrganizador} />}
      {tab === 'menu'      && <TabMenu      juntada={juntada} reload={reload} esOrganizador={esOrganizador} />}
      {tab === 'items'     && <TabItems     juntada={juntada} reload={reload} />}
      {tab === 'gastos'    && <TabGastos    juntada={juntada} reload={reload} />}
      {tab === 'autos'     && <TabAutos     juntada={juntada} reload={reload} />}
    </div>
  )
}
