import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { agregarGasto, eliminarGasto, calcularDeudas } from '../../utils/firestore'

export default function TabGastos({ juntada, reload }) {
  const { currentUser } = useAuth()
  const [form, setForm] = useState({ descripcion: '', monto: '', dividirEntre: 'todos' })
  const [loading, setLoading] = useState(false)
  const [vista, setVista] = useState('gastos')
  const gastos = juntada.gastos || []
  const invitados = (juntada.invitados || []).filter(i => i.estado === 'va')

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  async function agregar(e) {
    e.preventDefault()
    if (!form.descripcion.trim() || !form.monto) return
    setLoading(true)
    const divididoEntre = form.dividirEntre === 'todos'
      ? invitados.map(i => i.uid)
      : [currentUser.uid]
    await agregarGasto(juntada.id, {
      descripcion: form.descripcion.trim(),
      monto: Number(form.monto),
      pagadoPorUid: currentUser.uid,
      pagadoPorNombre: currentUser.displayName,
      divididoEntre
    })
    await reload()
    setForm({ descripcion: '', monto: '', dividirEntre: 'todos' })
    setLoading(false)
  }

  async function borrar(id) {
    await eliminarGasto(juntada.id, id)
    await reload()
  }

  const total = gastos.reduce((s, g) => s + g.monto, 0)
  const deudas = invitados.length > 0 ? calcularDeudas(gastos, invitados) : []
  const misDeudas = deudas.filter(d => d.deudorUid === currentUser?.uid || d.acreedorUid === currentUser?.uid)

  return (
    <div>
      {/* Form agregar gasto */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <h3 style={{ marginBottom: '0.875rem', fontFamily: 'var(--font)', fontSize: '0.9375rem', fontWeight: 500 }}>Registrar gasto</h3>
        <form onSubmit={agregar}>
          <div className="form-row" style={{ marginBottom: '0.75rem' }}>
            <div>
              <label>¿Qué pagaste?</label>
              <input value={form.descripcion} onChange={set('descripcion')} placeholder="Ej: Carne, bebidas..." required />
            </div>
            <div>
              <label>Monto ($)</label>
              <input type="number" min="0" step="0.01" value={form.monto} onChange={set('monto')} placeholder="0.00" required />
            </div>
          </div>
          <div style={{ marginBottom: '0.875rem' }}>
            <label>Dividir entre</label>
            <select value={form.dividirEntre} onChange={set('dividirEntre')}>
              <option value="todos">Todos los que van ({invitados.length})</option>
              <option value="solo_yo">Solo yo (no divido)</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary btn-sm" disabled={loading || !form.descripcion || !form.monto} style={{ alignSelf: 'flex-end' }}>
            {loading ? '...' : '+ Agregar gasto'}
          </button>
        </form>
      </div>

      {/* Total y tabs */}
      {gastos.length > 0 && (
        <>
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div style={{ flex: 1, background: 'var(--surface-2)', borderRadius: 'var(--radius)', padding: '0.875rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.375rem', fontWeight: 600, fontFamily: 'var(--font-display)', color: 'var(--text)' }}>
                ${total.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
              </div>
              <div className="text-sm text-muted">Total gastado</div>
            </div>
            <div style={{ flex: 1, background: 'var(--surface-2)', borderRadius: 'var(--radius)', padding: '0.875rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.375rem', fontWeight: 600, fontFamily: 'var(--font-display)', color: 'var(--text)' }}>
                ${invitados.length > 0 ? Math.round(total / invitados.length).toLocaleString('es-AR') : 0}
              </div>
              <div className="text-sm text-muted">Por persona</div>
            </div>
          </div>

          {/* Sub-tabs */}
          <div style={{ display: 'flex', gap: '4px', background: 'var(--surface-2)', borderRadius: 'var(--radius)', padding: '3px', marginBottom: '1rem' }}>
            {[{ id: 'gastos', label: `Gastos (${gastos.length})` }, { id: 'deudas', label: `Quién le debe a quién` }].map(t => (
              <button key={t.id} onClick={() => setVista(t.id)}
                style={{ flex: 1, padding: '0.4rem 0.5rem', border: 'none', borderRadius: 'calc(var(--radius) - 2px)', background: vista === t.id ? 'white' : 'transparent', color: vista === t.id ? 'var(--text)' : 'var(--text-2)', fontWeight: vista === t.id ? 500 : 400, fontSize: '0.8125rem', cursor: 'pointer', boxShadow: vista === t.id ? 'var(--shadow-sm)' : 'none', fontFamily: 'var(--font)', transition: 'all 0.15s' }}>
                {t.label}
              </button>
            ))}
          </div>

          {vista === 'gastos' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {gastos.map(g => (
                <div key={g.id} className="flex items-center gap-3" style={{ padding: '0.75rem 0.875rem', background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="font-medium" style={{ fontSize: '0.9375rem', color: 'var(--text)' }}>{g.descripcion}</div>
                    <div className="text-sm text-muted">
                      Pagó {g.pagadoPorUid === currentUser?.uid ? 'vos' : g.pagadoPorNombre} · dividido entre {g.divididoEntre.length}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div className="font-medium" style={{ color: 'var(--text)' }}>${g.monto.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</div>
                    {g.pagadoPorUid === currentUser?.uid && (
                      <button onClick={() => borrar(g.id)} className="btn btn-ghost btn-sm" style={{ color: 'var(--text-3)', fontSize: '0.75rem', padding: '0 0.25rem' }}>×</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {vista === 'deudas' && (
            <div>
              {misDeudas.length > 0 && (
                <div className="alert alert-info" style={{ marginBottom: '1rem' }}>
                  <div>
                    <strong>Tu resumen:</strong>
                    {misDeudas.map((d, i) => (
                      <div key={i} style={{ marginTop: 4, fontSize: '0.875rem' }}>
                        {d.deudorUid === currentUser?.uid
                          ? `• Le debés $${d.monto.toLocaleString('es-AR', { maximumFractionDigits: 0 })} a ${d.acreedorNombre}`
                          : `• ${d.deudorNombre} te debe $${d.monto.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`
                        }
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {deudas.length === 0 ? (
                <div className="empty"><p>Todos manos pa'rriba, nada que liquidar 🎉</p></div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {deudas.map((d, i) => (
                    <div key={i} className="flex items-center gap-3" style={{ padding: '0.75rem 0.875rem', background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
                      <span style={{ flex: 1, fontSize: '0.9375rem', color: 'var(--text)' }}>
                        <strong>{d.deudorNombre}</strong> → <strong>{d.acreedorNombre}</strong>
                      </span>
                      <span className="badge badge-warning">${d.monto.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {gastos.length === 0 && (
        <div className="empty"><div className="empty-icon">💸</div><h3 style={{ color: 'var(--text-2)' }}>Sin gastos todavía</h3><p>Registrá lo que cada uno va pagando</p></div>
      )}
    </div>
  )
}
