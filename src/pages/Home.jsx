import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getJuntadasByUser } from '../utils/firestore'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import AvatarComp from '../components/shared/Avatar'

const ESTADO_BADGE = {
  planificando: { label: 'Planificando', cls: 'badge-warning' },
  confirmada:   { label: 'Confirmada',   cls: 'badge-success' },
  finalizada:   { label: 'Finalizada',   cls: 'badge-gray' },
}

export default function Home() {
  const { currentUser, logout } = useAuth()
  const navigate = useNavigate()
  const [juntadas, setJuntadas] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!currentUser) return
    getJuntadasByUser(currentUser.uid)
      .then(setJuntadas)
      .finally(() => setLoading(false))
  }, [currentUser])

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '1.5rem 1rem' }}>

      {/* Header */}
      <div className="flex items-center justify-between" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem' }}>Mis juntadas</h1>
          <p style={{ marginTop: 2 }}>Hola, {currentUser?.displayName?.split(' ')[0]} 👋</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/perfil" className="btn btn-ghost btn-sm">
            <AvatarComp user={currentUser} size="sm" />
          </Link>
          <button onClick={() => logout().then(() => navigate('/auth'))} className="btn btn-ghost btn-sm">
            Salir
          </button>
        </div>
      </div>

      {/* CTA crear */}
      <Link to="/nueva" className="btn btn-primary btn-lg" style={{ marginBottom: '1.75rem', display: 'inline-flex' }}>
        <span style={{ fontSize: '1.1rem' }}>+</span> Organizar juntada
      </Link>

      {/* Lista */}
      {loading ? (
        <div className="empty"><p>Cargando...</p></div>
      ) : juntadas.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">🎊</div>
          <h3 style={{ color: 'var(--text-2)' }}>Todavía no tenés juntadas</h3>
          <p>Creá la primera y empezá a coordinar</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {juntadas.map(j => {
            const badge = ESTADO_BADGE[j.estado] || ESTADO_BADGE.planificando
            const confirmados = (j.invitados || []).filter(i => i.estado === 'va').length
            return (
              <Link key={j.id} to={`/j/${j.id}`} style={{ textDecoration: 'none' }}>
                <div className="card" style={{ cursor: 'pointer', transition: 'box-shadow 0.15s', ':hover': { boxShadow: 'var(--shadow)' } }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = 'var(--shadow-sm)'}>
                  <div className="flex items-center justify-between gap-3">
                    <div style={{ minWidth: 0 }}>
                      <div className="flex items-center gap-2" style={{ marginBottom: 4 }}>
                        <h3 style={{ fontSize: '1rem', color: 'var(--text)' }} className="truncate">{j.nombre}</h3>
                        <span className={`badge ${badge.cls}`}>{badge.label}</span>
                      </div>
                      <div className="flex gap-3" style={{ flexWrap: 'wrap' }}>
                        {j.fechaConfirmada && (
                          <span className="text-sm text-muted">
                            📅 {format(new Date(j.fechaConfirmada), "d 'de' MMMM", { locale: es })}
                          </span>
                        )}
                        {j.lugar && <span className="text-sm text-muted">📍 {j.lugar}</span>}
                        <span className="text-sm text-muted">👥 {confirmados} van</span>
                      </div>
                    </div>
                    <span style={{ color: 'var(--text-3)', fontSize: '1.25rem' }}>›</span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
