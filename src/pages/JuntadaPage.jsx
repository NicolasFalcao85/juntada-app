import { useState, useEffect, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getJuntada, unirseAJuntada, updateJuntada } from '../utils/firestore'
import { deleteDoc, doc } from 'firebase/firestore'
import { db } from '../firebase'
import TabInvitados from '../components/juntada/TabInvitados'
import TabFechas from '../components/juntada/TabFechas'
import TabItems from '../components/juntada/TabItems'
import TabGastos from '../components/juntada/TabGastos'
import TabAutos from '../components/juntada/TabAutos'
import TabMenu from '../components/juntada/TabMenu'
import { format, parseISO } from 'date-fns'
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
  const [joining, setJoining] = useState(false)
  const [editando, setEditando] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [guardandoEdit, setGuardandoEdit] = useState(false)
  const [confirmBorrar, setConfirmBorrar] = useState(false)
  const [shareMenu, setShareMenu] = useState(false)

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
      unirseAJuntada(id, currentUser).then(reload).finally(() => setJoining(false))
    }
  }, [juntada?.id, currentUser?.uid])

  function getShareUrl() {
    return `${window.location.origin}/juntada-app/unirse/${juntada.shareCode}`
  }

  function compartirWhatsapp() {
    const url = getShareUrl()
    const fecha = juntada.fechaConfirmada
      ? format(parseISO(juntada.fechaConfirmada), "el EEEE d 'de' MMMM", { locale: es })
      : 'la fecha a confirmar'
    const lugar = juntada.lugar ? ` en ${juntada.lugar}` : ''
    const msg = `🎉 *${juntada.nombre}*\n\nTe invito a la juntada${lugar} ${fecha}!\n\nEntrá acá para confirmar si vas, votar la fecha, ver qué lleva cada uno y más 👇\n${url}`
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
    setShareMenu(false)
  }

  function copiarLink() {
    navigator.clipboard.writeText(getShareUrl())
    setShareMenu(false)
    setTimeout(() => {}, 2000)
  }

  async function guardarEdicion() {
    setGuardandoEdit(true)
    await updateJuntada(id, {
      nombre: editForm.nombre,
      descripcion: editForm.descripcion,
      lugar: editForm.lugar,
    })
    await reload()
    setEditando(false)
    setGuardandoEdit(false)
  }

  async function borrarJuntada() {
    await deleteDoc(doc(db, 'juntadas', id))
    navigate('/')
  }

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-3)' }}>Cargando...</div>
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
        <Link to="/" className="btn btn-ghost btn-sm" style={{ paddingLeft: 0, marginBottom: '0.75rem' }}>← Mis juntadas</Link>

        {editando ? (
          <div className="card" style={{ marginBottom: '1rem' }}>
            <div className="form-group">
              <label>Nombre</label>
              <input value={editForm.nombre} onChange={e => setEditForm(f => ({ ...f, nombre: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Lugar</label>
              <input value={editForm.lugar} onChange={e => setEditForm(f => ({ ...f, lugar: e.target.value }))} placeholder="Ej: Palermo, lo de Nico..." />
            </div>
            <div className="form-group">
              <label>Descripción</label>
              <textarea value={editForm.descripcion} onChange={e => setEditForm(f => ({ ...f, descripcion: e.target.value }))} rows={2} style={{ resize: 'vertical' }} />
            </div>
            <div className="flex gap-2">
              <button onClick={guardarEdicion} className="btn btn-primary btn-sm" disabled={guardandoEdit}>
                {guardandoEdit ? 'Guardando...' : 'Guardar'}
              </button>
              <button onClick={() => setEditando(false)} className="btn btn-ghost btn-sm">Cancelar</button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3" style={{ flexWrap: 'wrap' }}>
            <div>
              <div className="flex items-center gap-2" style={{ marginBottom: '0.25rem' }}>
                <h1 style={{ fontSize: '1.6rem' }}>{juntada.nombre}</h1>
                {esOrganizador && (
                  <button onClick={() => { setEditForm({ nombre: juntada.nombre, descripcion: juntada.descripcion || '', lugar: juntada.lugar || '' }); setEditando(true) }}
                    className="btn btn-ghost btn-sm" style={{ color: 'var(--text-3)', fontSize: '0.8rem' }}>✏️</button>
                )}
              </div>
              <div className="flex gap-3" style={{ flexWrap: 'wrap' }}>
                {juntada.fechaConfirmada && (
                  <span className="text-sm text-muted">📅 {format(parseISO(juntada.fechaConfirmada), "EEEE d 'de' MMMM", { locale: es })}</span>
                )}
                {juntada.lugar && <span className="text-sm text-muted">📍 {juntada.lugar}</span>}
                <span className="text-sm text-muted">
                  👥 {totalPersonas} personas
                  {totalMenores > 0 && <span style={{ color: 'var(--info)', marginLeft: 4 }}>({totalMenores} menor{totalMenores > 1 ? 'es' : ''})</span>}
                </span>
              </div>
              {juntada.descripcion && <p style={{ marginTop: '0.375rem', fontSize: '0.875rem' }}>{juntada.descripcion}</p>}
            </div>

            {/* Botones de acción */}
            <div className="flex gap-2" style={{ flexShrink: 0 }}>
              <div style={{ position: 'relative' }}>
                <button onClick={() => setShareMenu(s => !s)} className="btn btn-primary btn-sm">
                  📲 Compartir
                </button>
                {shareMenu && (
                  <div style={{ position: 'absolute', right: 0, top: '110%', background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-lg)', zIndex: 100, minWidth: 200, overflow: 'hidden' }}>
                    <button onClick={compartirWhatsapp}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '0.75rem 1rem', border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.9375rem', color: 'var(--text)', fontFamily: 'var(--font)', textAlign: 'left' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                      <span style={{ fontSize: '1.25rem' }}>💬</span> Mandar por WhatsApp
                    </button>
                    <button onClick={copiarLink}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '0.75rem 1rem', border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.9375rem', color: 'var(--text)', fontFamily: 'var(--font)', textAlign: 'left', borderTop: '1px solid var(--border)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                      <span style={{ fontSize: '1.25rem' }}>🔗</span> Copiar link
                    </button>
                  </div>
                )}
              </div>

              {esOrganizador && (
                <div style={{ position: 'relative' }}>
                  {!confirmBorrar ? (
                    <button onClick={() => setConfirmBorrar(true)} className="btn btn-ghost btn-sm" style={{ color: 'var(--text-3)' }}>🗑</button>
                  ) : (
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8125rem', color: 'var(--danger)' }}>¿Borrar?</span>
                      <button onClick={borrarJuntada} className="btn btn-danger btn-sm">Sí</button>
                      <button onClick={() => setConfirmBorrar(false)} className="btn btn-ghost btn-sm">No</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Cerrar share menu al click afuera */}
      {shareMenu && <div onClick={() => setShareMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 99 }} />}

      {/* Tabs */}
      <div className="scroll-x" style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', gap: '4px', minWidth: 'max-content', background: 'var(--surface-2)', borderRadius: 'var(--radius)', padding: '4px' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ padding: '0.45rem 0.875rem', border: 'none', borderRadius: 'calc(var(--radius) - 2px)', background: tab === t.id ? 'white' : 'transparent', color: tab === t.id ? 'var(--text)' : 'var(--text-2)', fontWeight: tab === t.id ? 500 : 400, fontSize: '0.875rem', cursor: 'pointer', boxShadow: tab === t.id ? 'var(--shadow-sm)' : 'none', transition: 'all 0.15s', fontFamily: 'var(--font)', whiteSpace: 'nowrap' }}>
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
