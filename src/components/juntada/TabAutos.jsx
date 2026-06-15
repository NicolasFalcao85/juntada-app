import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { agregarAuto, sumarseAuto, bajarsDeAuto } from '../../utils/firestore'

export default function TabAutos({ juntada, reload }) {
  const { currentUser } = useAuth()
  const [form, setForm] = useState({ capacidad: '4', desde: '' })
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const autos = juntada.autos || []

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  async function ofrecerAuto(e) {
    e.preventDefault()
    setLoading(true)
    setErr('')
    try {
      await agregarAuto(juntada.id, {
        conductorUid: currentUser.uid,
        conductorNombre: currentUser.displayName,
        capacidad: Number(form.capacidad),
        desde: form.desde.trim(),
        pasajeros: []
      })
      await reload()
      setForm({ capacidad: '4', desde: '' })
    } catch { setErr('No se pudo agregar el auto.') }
    setLoading(false)
  }

  async function togglePasajero(auto) {
    setErr('')
    const soyPasajero = auto.pasajeros.find(p => p.uid === currentUser.uid)
    try {
      if (soyPasajero) {
        await bajarsDeAuto(juntada.id, auto.id, currentUser.uid)
      } else {
        await sumarseAuto(juntada.id, auto.id, currentUser.uid, currentUser.displayName)
      }
      await reload()
    } catch (e) {
      setErr(e.message || 'Error al actualizar')
    }
  }

  const yaTiengoAuto = autos.find(a => a.conductorUid === currentUser?.uid)
  const totalAsientos = autos.reduce((s, a) => s + (a.capacidad - 1), 0)
  const totalPasajeros = autos.reduce((s, a) => s + a.pasajeros.length, 0)

  return (
    <div>
      {/* Resumen */}
      {autos.length > 0 && (
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div style={{ flex: 1, background: 'var(--surface-2)', borderRadius: 'var(--radius)', padding: '0.875rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.375rem', fontWeight: 600, fontFamily: 'var(--font-display)', color: 'var(--text)' }}>{autos.length}</div>
            <div className="text-sm text-muted">Autos</div>
          </div>
          <div style={{ flex: 1, background: 'var(--surface-2)', borderRadius: 'var(--radius)', padding: '0.875rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.375rem', fontWeight: 600, fontFamily: 'var(--font-display)', color: totalPasajeros >= totalAsientos ? 'var(--danger)' : 'var(--success)' }}>
              {totalAsientos - totalPasajeros}
            </div>
            <div className="text-sm text-muted">Lugares libres</div>
          </div>
        </div>
      )}

      {/* Ofrecer auto */}
      {!yaTiengoAuto && (
        <div className="card" style={{ marginBottom: '1.25rem' }}>
          <h3 style={{ marginBottom: '0.875rem', fontFamily: 'var(--font)', fontSize: '0.9375rem', fontWeight: 500 }}>Ofrecer mi auto</h3>
          <form onSubmit={ofrecerAuto}>
            <div className="form-row" style={{ marginBottom: '0.75rem' }}>
              <div>
                <label>Lugares disponibles (sin vos)</label>
                <select value={form.capacidad} onChange={set('capacidad')}>
                  {[2,3,4,5,6,7].map(n => <option key={n} value={n}>{n - 1} pasajero{n - 1 !== 1 ? 's' : ''}</option>)}
                </select>
              </div>
              <div>
                <label>Salgo desde</label>
                <input value={form.desde} onChange={set('desde')} placeholder="Ej: Palermo, Caballito..." />
              </div>
            </div>
            {err && <div className="alert alert-error" style={{ marginBottom: '0.75rem', fontSize: '0.875rem' }}>⚠ {err}</div>}
            <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>
              {loading ? '...' : '🚗 Ofrecer mi auto'}
            </button>
          </form>
        </div>
      )}

      {autos.length === 0 ? (
        <div className="empty"><div className="empty-icon">🚗</div><h3 style={{ color: 'var(--text-2)' }}>Nadie ofreció auto todavía</h3><p>Si tenés lugar, ¡ofrecé!</p></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {autos.map(auto => {
            const soyPasajero = auto.pasajeros.find(p => p.uid === currentUser?.uid)
            const soyConductor = auto.conductorUid === currentUser?.uid
            const lugaresLibres = auto.capacidad - 1 - auto.pasajeros.length
            const lleno = lugaresLibres <= 0

            return (
              <div key={auto.id} className="card">
                <div className="flex items-center justify-between gap-3" style={{ marginBottom: '0.875rem' }}>
                  <div>
                    <div className="font-medium" style={{ color: 'var(--text)', fontSize: '0.9375rem' }}>
                      🚗 {auto.conductorNombre}
                      {soyConductor && <span className="badge badge-brand" style={{ marginLeft: 8 }}>Tu auto</span>}
                    </div>
                    {auto.desde && <div className="text-sm text-muted">Desde {auto.desde}</div>}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 600, color: lleno ? 'var(--danger)' : 'var(--success)', fontFamily: 'var(--font-display)' }}>
                      {lleno ? 'Lleno' : `${lugaresLibres} lugar${lugaresLibres !== 1 ? 'es' : ''}`}
                    </div>
                  </div>
                </div>

                {/* Pasajeros */}
                {auto.pasajeros.length > 0 && (
                  <div className="flex gap-2" style={{ flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                    {auto.pasajeros.map(p => (
                      <span key={p.uid} style={{ background: 'var(--surface-2)', borderRadius: 20, padding: '3px 10px', fontSize: '0.8125rem', color: 'var(--text)' }}>
                        {p.uid === currentUser?.uid ? '👤 Vos' : p.nombre}
                      </span>
                    ))}
                  </div>
                )}

                {!soyConductor && (
                  <button onClick={() => togglePasajero(auto)}
                    className={`btn btn-sm ${soyPasajero ? 'btn-danger' : lleno ? 'btn-secondary' : 'btn-primary'}`}
                    disabled={!soyPasajero && lleno}>
                    {soyPasajero ? 'Me bajo' : lleno ? 'Auto lleno' : 'Sumarme'}
                  </button>
                )}
              </div>
            )
          })}
          {err && <div className="alert alert-error" style={{ fontSize: '0.875rem' }}>⚠ {err}</div>}
        </div>
      )}
    </div>
  )
}
