import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { proponerFecha, votarFecha, confirmarFecha } from '../../utils/firestore'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

export default function TabFechas({ juntada, reload, esOrganizador }) {
  const { currentUser } = useAuth()
  const [nueva, setNueva] = useState('')
  const [loading, setLoading] = useState(false)
  const fechas = juntada.fechasPropuestas || []

  async function proponer(e) {
    e.preventDefault()
    if (!nueva) return
    setLoading(true)
    await proponerFecha(juntada.id, nueva, currentUser.uid)
    await reload()
    setNueva('')
    setLoading(false)
  }

  async function toggleVoto(fechaId, yaVote) {
    await votarFecha(juntada.id, fechaId, currentUser.uid, !yaVote)
    await reload()
  }

  async function confirmar(fecha) {
    await confirmarFecha(juntada.id, fecha)
    await reload()
  }

  const totalInvitados = (juntada.invitados || []).filter(i => i.estado === 'va').length || 1
  const sorted = [...fechas].sort((a, b) => (b.votos?.length || 0) - (a.votos?.length || 0))

  return (
    <div>
      {juntada.fechaConfirmada && (
        <div className="alert alert-success" style={{ marginBottom: '1.25rem', fontSize: '0.9375rem' }}>
          ✅ Fecha confirmada: <strong>{format(parseISO(juntada.fechaConfirmada), "EEEE d 'de' MMMM 'a las' HH:mm", { locale: es })}</strong>
        </div>
      )}

      {/* Proponer fecha */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <h3 style={{ marginBottom: '0.875rem', fontFamily: 'var(--font)', fontSize: '0.9375rem', fontWeight: 500 }}>Proponer una fecha</h3>
        <form onSubmit={proponer} className="flex gap-2" style={{ alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label>Fecha y hora</label>
            <input type="datetime-local" value={nueva} onChange={e => setNueva(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading || !nueva}>
            {loading ? '...' : 'Proponer'}
          </button>
        </form>
      </div>

      {/* Lista de fechas */}
      {sorted.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">📅</div>
          <h3 style={{ color: 'var(--text-2)' }}>Sin fechas todavía</h3>
          <p>Proponé una fecha para arrancar la votación</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {sorted.map(f => {
            const votos = f.votos || []
            const yaVote = votos.includes(currentUser?.uid)
            const pct = Math.round((votos.length / totalInvitados) * 100)
            const esConfirmada = juntada.fechaConfirmada === f.fecha
            return (
              <div key={f.id} className="card" style={{ borderColor: esConfirmada ? 'var(--success)' : 'var(--border)' }}>
                <div className="flex items-center justify-between gap-3" style={{ marginBottom: '0.75rem' }}>
                  <div>
                    <div style={{ fontWeight: 500, color: 'var(--text)', fontSize: '0.9375rem' }}>
                      {format(parseISO(f.fecha), "EEEE d 'de' MMMM", { locale: es })}
                    </div>
                    <div className="text-sm text-muted">
                      {format(parseISO(f.fecha), 'HH:mm')} hs
                    </div>
                  </div>
                  <div className="flex gap-2 items-center">
                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-2)' }}>{votos.length} voto{votos.length !== 1 ? 's' : ''}</span>
                    {esConfirmada
                      ? <span className="badge badge-success">Confirmada ✓</span>
                      : (
                        <button onClick={() => toggleVoto(f.id, yaVote)}
                          className={`btn btn-sm ${yaVote ? 'btn-primary' : 'btn-secondary'}`}>
                          {yaVote ? '✓ Voté' : 'Votar'}
                        </button>
                      )
                    }
                  </div>
                </div>

                {/* Barra de progreso */}
                <div style={{ height: 6, background: 'var(--surface-3)', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: esConfirmada ? 'var(--success)' : 'var(--brand)', borderRadius: 99, transition: 'width 0.3s' }} />
                </div>
                <div className="flex items-center justify-between" style={{ marginTop: '0.375rem' }}>
                  <span className="text-sm text-muted">{pct}% de los que van</span>
                  {esOrganizador && !esConfirmada && (
                    <button onClick={() => confirmar(f.fecha)} className="btn btn-ghost btn-sm" style={{ color: 'var(--success)', fontSize: '0.75rem' }}>
                      Confirmar esta fecha →
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
