import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { actualizarEstadoInvitado } from '../../utils/firestore'
import Avatar from '../shared/Avatar'

const ESTADOS = {
  va:        { label: 'Va', cls: 'badge-success' },
  no_va:     { label: 'No va', cls: 'badge-danger' },
  pendiente: { label: 'Pendiente', cls: 'badge-warning' },
}

function Stepper({ label, value, onChange, min = 0 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
      <span style={{ fontSize: '0.75rem', color: 'var(--text-2)', fontWeight: 500 }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button type="button" onClick={() => onChange(Math.max(min, value - 1))}
          style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid var(--border-2)', background: 'white', fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text)', fontFamily: 'var(--font)' }}>−</button>
        <span style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--font-display)', minWidth: 24, textAlign: 'center' }}>{value}</span>
        <button type="button" onClick={() => onChange(value + 1)}
          style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid var(--border-2)', background: 'white', fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text)', fontFamily: 'var(--font)' }}>+</button>
      </div>
    </div>
  )
}

export default function TabInvitados({ juntada, reload, esOrganizador }) {
  const { currentUser } = useAuth()
  const invitados = juntada.invitados || []
  const miInvitado = invitados.find(i => i.uid === currentUser?.uid)
  const miEstado = miInvitado?.estado
  const [adultos, setAdultos] = useState(miInvitado?.adultos ?? 1)
  const [menores, setMenores] = useState(miInvitado?.menores ?? 0)
  const [guardando, setGuardando] = useState(false)

  async function cambiarEstado(estado) {
    setGuardando(true)
    const cantidades = estado === 'va' ? { adultos, menores } : null
    await actualizarEstadoInvitado(juntada.id, currentUser.uid, estado, cantidades)
    await reload()
    setGuardando(false)
  }

  async function actualizarCantidades() {
    if (miEstado !== 'va') return
    setGuardando(true)
    await actualizarEstadoInvitado(juntada.id, currentUser.uid, 'va', { adultos, menores })
    await reload()
    setGuardando(false)
  }

  const grupos = {
    va: invitados.filter(i => i.estado === 'va'),
    pendiente: invitados.filter(i => i.estado === 'pendiente'),
    no_va: invitados.filter(i => i.estado === 'no_va'),
  }

  const totalAdultos = invitados.filter(i => i.estado === 'va').reduce((s, i) => s + (i.adultos ?? 1), 0)
  const totalMenores = invitados.filter(i => i.estado === 'va').reduce((s, i) => s + (i.menores ?? 0), 0)

  return (
    <div>
      {/* Mi confirmación */}
      {miEstado && (
        <div className="card" style={{ marginBottom: '1.25rem', background: 'var(--surface-2)' }}>
          <p className="font-medium" style={{ marginBottom: '0.75rem', color: 'var(--text)' }}>¿Vos vas?</p>
          <div className="flex gap-2" style={{ marginBottom: miEstado === 'va' ? '1rem' : 0 }}>
            {[
              { val: 'va', label: '✓ Sí, voy', active: 'btn-primary' },
              { val: 'no_va', label: '✗ No puedo', active: 'btn-danger' },
              { val: 'pendiente', label: '? Capaz', active: 'btn-secondary' },
            ].map(opt => (
              <button key={opt.val}
                onClick={() => cambiarEstado(opt.val)}
                disabled={guardando}
                className={`btn btn-sm ${miEstado === opt.val ? opt.active : 'btn-ghost'}`}>
                {opt.label}
              </button>
            ))}
          </div>

          {miEstado === 'va' && (
            <div>
              <div style={{ height: '1px', background: 'var(--border)', margin: '0 0 1rem' }} />
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-2)', marginBottom: '0.875rem' }}>¿Cuántos van con vos?</p>
              <div style={{ display: 'flex', gap: '2rem', marginBottom: '1rem' }}>
                <Stepper label="Adultos" value={adultos} onChange={setAdultos} min={1} />
                <Stepper label="Menores" value={menores} onChange={setMenores} min={0} />
                {menores > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center', justifyContent: 'flex-end' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>Total</span>
                    <span style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--font-display)' }}>{adultos + menores}</span>
                  </div>
                )}
              </div>
              <button onClick={actualizarCantidades} disabled={guardando} className="btn btn-secondary btn-sm">
                {guardando ? 'Guardando...' : 'Actualizar'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Totales */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.625rem', marginBottom: '1.25rem' }}>
        {[
          { val: grupos.va.length, label: 'Personas que van', color: 'var(--success)' },
          { val: totalAdultos, label: 'Adultos', color: 'var(--text)' },
          { val: totalMenores, label: 'Menores', color: 'var(--info)' },
          { val: grupos.pendiente.length, label: 'Pendientes', color: 'var(--warning)' },
        ].map((g, i) => (
          <div key={i} style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius)', padding: '0.75rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.375rem', fontWeight: 600, color: g.color, fontFamily: 'var(--font-display)' }}>{g.val}</div>
            <div className="text-sm text-muted" style={{ fontSize: '0.75rem' }}>{g.label}</div>
          </div>
        ))}
      </div>

      {/* Lista */}
      {Object.entries(grupos).map(([estado, lista]) =>
        lista.length > 0 && (
          <div key={estado} style={{ marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '0.8125rem', color: 'var(--text-2)', fontFamily: 'var(--font)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.625rem' }}>
              {ESTADOS[estado].label} ({lista.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {lista.map(inv => (
                <div key={inv.uid} className="flex items-center gap-3" style={{ padding: '0.625rem 0.875rem', background: 'white', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                  <Avatar nombre={inv.nombre} size="sm" />
                  <span style={{ flex: 1, fontSize: '0.9375rem', color: 'var(--text)' }}>{inv.nombre}</span>
                  {estado === 'va' && (
                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-2)' }}>
                      {(inv.adultos ?? 1) + (inv.menores ?? 0)} pers.
                      {(inv.menores ?? 0) > 0 && <span style={{ color: 'var(--info)', marginLeft: 4 }}>({inv.menores} menor{inv.menores > 1 ? 'es' : ''})</span>}
                    </span>
                  )}
                  {inv.esOrganizador && <span className="badge badge-brand">Organizador</span>}
                  <span className={`badge ${ESTADOS[estado].cls}`}>{ESTADOS[estado].label}</span>
                </div>
              ))}
            </div>
          </div>
        )
      )}

      {invitados.length === 0 && (
        <div className="empty">
          <div className="empty-icon">👥</div>
          <h3 style={{ color: 'var(--text-2)' }}>Solo estás vos</h3>
          <p>Compartí el link para que se sumen</p>
        </div>
      )}
    </div>
  )
}
