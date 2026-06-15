import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { agregarOpcionMenu, votarMenu, confirmarMenu, eliminarOpcionMenu } from '../../utils/firestore'

export default function TabMenu({ juntada, reload, esOrganizador }) {
  const { currentUser } = useAuth()
  const [form, setForm] = useState({ nombre: '', descripcion: '' })
  const [loading, setLoading] = useState(false)
  const menu = juntada.menu || []
  const menuConfirmadoId = juntada.menuConfirmadoId || null

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const confirmado = menu.find(o => o.id === menuConfirmadoId)
  const invitadosQueVan = (juntada.invitados || []).filter(i => i.estado === 'va')
  const totalVotantes = invitadosQueVan.length || 1
  const sorted = [...menu].sort((a, b) => (b.votos?.length || 0) - (a.votos?.length || 0))

  async function agregar(e) {
    e.preventDefault()
    if (!form.nombre.trim()) return
    setLoading(true)
    await agregarOpcionMenu(juntada.id, { nombre: form.nombre.trim(), descripcion: form.descripcion.trim(), proponenteUid: currentUser.uid })
    await reload()
    setForm({ nombre: '', descripcion: '' })
    setLoading(false)
  }

  async function toggleVoto(opcionId, yaVote) {
    await votarMenu(juntada.id, opcionId, currentUser.uid, !yaVote)
    await reload()
  }

  async function confirmar(opcionId) {
    await confirmarMenu(juntada.id, opcionId)
    await reload()
  }

  async function borrar(opcionId) {
    await eliminarOpcionMenu(juntada.id, opcionId)
    await reload()
  }

  return (
    <div>
      {/* Confirmado */}
      {confirmado && (
        <div className="alert alert-success" style={{ marginBottom: '1.25rem', fontSize: '0.9375rem' }}>
          🍽 Menú confirmado: <strong>{confirmado.nombre}</strong>
          {confirmado.descripcion && <div style={{ marginTop: 4, fontSize: '0.875rem' }}>{confirmado.descripcion}</div>}
        </div>
      )}

      {/* Proponer */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <h3 style={{ marginBottom: '0.875rem', fontFamily: 'var(--font)', fontSize: '0.9375rem', fontWeight: 500 }}>
          {esOrganizador ? 'Proponer opciones de menú' : 'Sugerir una opción'}
        </h3>
        <form onSubmit={agregar}>
          <div className="form-group">
            <label>¿Qué se podría comer?</label>
            <input value={form.nombre} onChange={set('nombre')} placeholder="Ej: Asado, Pizzas, Empanadas..." required />
          </div>
          <div className="form-group">
            <label>Detalle (opcional)</label>
            <textarea value={form.descripcion} onChange={set('descripcion')} placeholder="Ej: Carne + chorizo + morcilla, ensaladas incluidas" rows={2} style={{ resize: 'vertical' }} />
          </div>
          <button type="submit" className="btn btn-primary btn-sm" disabled={loading || !form.nombre.trim()}>
            {loading ? '...' : '+ Proponer'}
          </button>
        </form>
      </div>

      {/* Opciones */}
      {menu.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">🍽</div>
          <h3 style={{ color: 'var(--text-2)' }}>Sin opciones todavía</h3>
          <p>{esOrganizador ? 'Proponé opciones para que todos voten' : 'El organizador todavía no propuso opciones'}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {sorted.map(opcion => {
            const yaVote = (opcion.votos || []).includes(currentUser?.uid)
            const votos = opcion.votos?.length || 0
            const pct = Math.round((votos / totalVotantes) * 100)
            const esConfirmada = opcion.id === menuConfirmadoId

            return (
              <div key={opcion.id} className="card" style={{ borderColor: esConfirmada ? 'var(--success)' : 'var(--border)' }}>
                <div className="flex items-center justify-between gap-3" style={{ marginBottom: opcion.descripcion ? '0.375rem' : '0.75rem' }}>
                  <div style={{ minWidth: 0 }}>
                    <span style={{ fontWeight: 500, color: 'var(--text)', fontSize: '0.9375rem' }}>{opcion.nombre}</span>
                    {esConfirmada && <span className="badge badge-success" style={{ marginLeft: 8 }}>Elegido ✓</span>}
                  </div>
                  <div className="flex gap-2 items-center" style={{ flexShrink: 0 }}>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-2)' }}>{votos} voto{votos !== 1 ? 's' : ''}</span>
                    {!esConfirmada && (
                      <button onClick={() => toggleVoto(opcion.id, yaVote)}
                        className={`btn btn-sm ${yaVote ? 'btn-primary' : 'btn-secondary'}`}>
                        {yaVote ? '✓ Voté' : 'Votar'}
                      </button>
                    )}
                  </div>
                </div>

                {opcion.descripcion && (
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-2)', marginBottom: '0.75rem' }}>{opcion.descripcion}</p>
                )}

                {/* Barra */}
                <div style={{ height: 6, background: 'var(--surface-3)', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: esConfirmada ? 'var(--success)' : 'var(--brand)', borderRadius: 99, transition: 'width 0.3s' }} />
                </div>
                <div className="flex items-center justify-between" style={{ marginTop: '0.375rem' }}>
                  <span className="text-sm text-muted">{pct}% de los que van</span>
                  <div className="flex gap-2">
                    {esOrganizador && !esConfirmada && votos > 0 && (
                      <button onClick={() => confirmar(opcion.id)} className="btn btn-ghost btn-sm" style={{ color: 'var(--success)', fontSize: '0.75rem' }}>
                        Confirmar esta →
                      </button>
                    )}
                    {esOrganizador && (
                      <button onClick={() => borrar(opcion.id)} className="btn btn-ghost btn-sm" style={{ color: 'var(--text-3)', fontSize: '0.75rem' }}>
                        Borrar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
