import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { agregarItem, actualizarItem, eliminarItem } from '../../utils/firestore'

const CATEGORIAS = ['🥩 Comida', '🥤 Bebida', '🧴 Limpieza', '🎵 Música/Deco', '🍰 Postre', '🧊 Hielo', '🍴 Utensilios', '📦 Otro']

export default function TabItems({ juntada, reload }) {
  const { currentUser } = useAuth()
  const [form, setForm] = useState({ nombre: '', categoria: CATEGORIAS[0], asignarMe: false })
  const [loading, setLoading] = useState(false)
  const items = juntada.items || []
  const invitados = (juntada.invitados || []).filter(i => i.estado === 'va')

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  async function agregar(e) {
    e.preventDefault()
    if (!form.nombre.trim()) return
    setLoading(true)
    await agregarItem(juntada.id, {
      nombre: form.nombre.trim(),
      categoria: form.categoria,
      asignadoA: form.asignarMe ? currentUser.uid : null,
      asignadoNombre: form.asignarMe ? currentUser.displayName : null
    })
    await reload()
    setForm(f => ({ ...f, nombre: '' }))
    setLoading(false)
  }

  async function asignarme(item) {
    const yaMio = item.asignadoA === currentUser.uid
    await actualizarItem(juntada.id, item.id, {
      asignadoA: yaMio ? null : currentUser.uid,
      asignadoNombre: yaMio ? null : currentUser.displayName
    })
    await reload()
  }

  async function toggleListo(item) {
    await actualizarItem(juntada.id, item.id, { listo: !item.listo })
    await reload()
  }

  async function borrar(itemId) {
    await eliminarItem(juntada.id, itemId)
    await reload()
  }

  const pendientes = items.filter(i => !i.listo)
  const listos = items.filter(i => i.listo)

  return (
    <div>
      {/* Agregar item */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <h3 style={{ marginBottom: '0.875rem', fontFamily: 'var(--font)', fontSize: '0.9375rem', fontWeight: 500 }}>Agregar item</h3>
        <form onSubmit={agregar}>
          <div className="form-row" style={{ marginBottom: '0.75rem' }}>
            <div>
              <label>¿Qué falta?</label>
              <input value={form.nombre} onChange={set('nombre')} placeholder="Ej: Agua sin gas, Carbón..." required />
            </div>
            <div>
              <label>Categoría</label>
              <select value={form.categoria} onChange={set('categoria')}>
                {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 0, fontWeight: 400 }}>
              <input type="checkbox" checked={form.asignarMe} onChange={e => setForm(f => ({ ...f, asignarMe: e.target.checked }))} style={{ width: 16, height: 16 }} />
              <span style={{ fontSize: '0.875rem' }}>Lo traigo yo</span>
            </label>
            <button type="submit" className="btn btn-primary btn-sm" disabled={loading || !form.nombre.trim()}>
              {loading ? '...' : '+ Agregar'}
            </button>
          </div>
        </form>
      </div>

      {/* Resumen */}
      {items.length > 0 && (
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div style={{ flex: 1, background: 'var(--surface-2)', borderRadius: 'var(--radius)', padding: '0.75rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--warning)', fontFamily: 'var(--font-display)' }}>{pendientes.length}</div>
            <div className="text-sm text-muted">Pendientes</div>
          </div>
          <div style={{ flex: 1, background: 'var(--surface-2)', borderRadius: 'var(--radius)', padding: '0.75rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-3)', fontFamily: 'var(--font-display)' }}>{items.filter(i => !i.asignadoA).length}</div>
            <div className="text-sm text-muted">Sin asignar</div>
          </div>
          <div style={{ flex: 1, background: 'var(--surface-2)', borderRadius: 'var(--radius)', padding: '0.75rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--success)', fontFamily: 'var(--font-display)' }}>{listos.length}</div>
            <div className="text-sm text-muted">Listos ✓</div>
          </div>
        </div>
      )}

      {items.length === 0 && (
        <div className="empty"><div className="empty-icon">🛍</div><h3 style={{ color: 'var(--text-2)' }}>Lista vacía</h3><p>Agregá lo que hace falta para la juntada</p></div>
      )}

      {/* Lista pendientes */}
      {pendientes.length > 0 && (
        <div style={{ marginBottom: '1.25rem' }}>
          {pendientes.map(item => <ItemRow key={item.id} item={item} uid={currentUser?.uid} onAsignar={() => asignarme(item)} onListo={() => toggleListo(item)} onBorrar={() => borrar(item.id)} />)}
        </div>
      )}

      {/* Listos */}
      {listos.length > 0 && (
        <div>
          <p className="text-sm text-muted" style={{ marginBottom: '0.5rem' }}>Ya confirmados ({listos.length})</p>
          {listos.map(item => <ItemRow key={item.id} item={item} uid={currentUser?.uid} onAsignar={() => asignarme(item)} onListo={() => toggleListo(item)} onBorrar={() => borrar(item.id)} done />)}
        </div>
      )}
    </div>
  )
}

function ItemRow({ item, uid, onAsignar, onListo, onBorrar, done }) {
  const yaMio = item.asignadoA === uid
  return (
    <div className="flex items-center gap-3" style={{ padding: '0.625rem 0.875rem', background: 'white', borderRadius: 'var(--radius)', border: '1px solid var(--border)', marginBottom: 6, opacity: done ? 0.65 : 1 }}>
      <button onClick={onListo} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.125rem', lineHeight: 1, color: item.listo ? 'var(--success)' : 'var(--border-2)', flexShrink: 0 }}>
        {item.listo ? '✓' : '○'}
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.9375rem', color: 'var(--text)', textDecoration: done ? 'line-through' : 'none' }}>{item.nombre}</span>
          <span className="text-sm text-muted">{item.categoria}</span>
        </div>
        {item.asignadoNombre && (
          <span className="text-sm" style={{ color: yaMio ? 'var(--brand-dark)' : 'var(--text-2)' }}>
            {yaMio ? '👤 Vos' : `👤 ${item.asignadoNombre}`}
          </span>
        )}
      </div>
      <div className="flex gap-1">
        <button onClick={onAsignar} className={`btn btn-sm ${yaMio ? 'btn-primary' : 'btn-ghost'}`} style={{ fontSize: '0.75rem' }}>
          {yaMio ? 'Lo traigo' : item.asignadoA ? 'Tomar' : 'Lo traigo yo'}
        </button>
        <button onClick={onBorrar} className="btn btn-ghost btn-sm" style={{ color: 'var(--text-3)', fontSize: '0.75rem' }}>×</button>
      </div>
    </div>
  )
}
