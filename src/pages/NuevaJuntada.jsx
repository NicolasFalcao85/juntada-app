import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { createJuntada } from '../utils/firestore'

export default function NuevaJuntada() {
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ nombre: '', descripcion: '', lugar: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.nombre.trim()) return
    setLoading(true)
    setError('')
    try {
      const { id } = await createJuntada({
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim(),
        lugar: form.lugar.trim(),
        organizadorId: currentUser.uid,
        organizadorName: currentUser.displayName
      })
      navigate(`/j/${id}`)
    } catch (err) {
      setError('No se pudo crear la juntada. Revisá tu conexión.')
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 520, margin: '0 auto', padding: '1.5rem 1rem' }}>
      <Link to="/" className="btn btn-ghost btn-sm" style={{ marginBottom: '1.5rem', paddingLeft: 0 }}>
        ← Volver
      </Link>

      <h1 style={{ marginBottom: '0.375rem' }}>Nueva juntada</h1>
      <p style={{ marginBottom: '1.75rem' }}>Empezá con lo básico, el resto lo completás después.</p>

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>¿Cómo se llama? *</label>
            <input
              type="text"
              value={form.nombre}
              onChange={set('nombre')}
              placeholder="Ej: Asado en lo de Martín, Cumple de Sofi..."
              autoFocus
              maxLength={80}
              required
            />
          </div>

          <div className="form-group">
            <label>Descripción (opcional)</label>
            <textarea
              value={form.descripcion}
              onChange={set('descripcion')}
              placeholder="Una descripción corta para que todos sepan de qué va"
              rows={3}
              maxLength={300}
              style={{ resize: 'vertical' }}
            />
          </div>

          <div className="form-group">
            <label>Lugar (opcional)</label>
            <input
              type="text"
              value={form.lugar}
              onChange={set('lugar')}
              placeholder="Ej: Palermo, lo de Nico, Parque Centenario..."
            />
          </div>

          {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>⚠ {error}</div>}

          <div className="flex gap-3" style={{ marginTop: '0.5rem' }}>
            <Link to="/" className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>Cancelar</Link>
            <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={loading || !form.nombre.trim()}>
              {loading ? 'Creando...' : 'Crear juntada →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
