import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'

const DIETAS = [
  { id: 'vegetariano', label: '🥦 Vegetariano' },
  { id: 'vegano', label: '🌱 Vegano' },
  { id: 'celiaco', label: '🌾 Celíaco' },
  { id: 'sin_lactosa', label: '🥛 Sin lactosa' },
  { id: 'sin_mariscos', label: '🦐 Sin mariscos' },
  { id: 'kosher', label: '✡ Kosher' },
  { id: 'halal', label: '☪ Halal' },
  { id: 'diabetico', label: '🍬 Diabético' },
]

export default function Perfil() {
  const { currentUser, userProfile, logout, loadUserProfile } = useAuth()
  const navigate = useNavigate()
  const [dietary, setDietary] = useState(userProfile?.dietary || [])
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)

  function toggleDieta(id) {
    setDietary(d => d.includes(id) ? d.filter(x => x !== id) : [...d, id])
    setSaved(false)
  }

  async function guardar() {
    setLoading(true)
    await updateDoc(doc(db, 'users', currentUser.uid), { dietary })
    await loadUserProfile(currentUser.uid)
    setSaved(true)
    setLoading(false)
  }

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '1.5rem 1rem' }}>
      <Link to="/" className="btn btn-ghost btn-sm" style={{ paddingLeft: 0, marginBottom: '1.5rem' }}>
        ← Volver
      </Link>

      <h1 style={{ marginBottom: '0.25rem' }}>Mi perfil</h1>
      <p style={{ marginBottom: '1.75rem' }}>Esta info se muestra a los organizadores de las juntadas.</p>

      {/* Info básica */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#FF5C3522', border: '2px solid #FF5C3544', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: 600, color: '#C93E20', flexShrink: 0, overflow: 'hidden' }}>
            {currentUser?.photoURL
              ? <img src={currentUser.photoURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : currentUser?.displayName?.[0]?.toUpperCase()
            }
          </div>
          <div>
            <div style={{ fontWeight: 500, fontSize: '1rem', color: 'var(--text)' }}>{currentUser?.displayName}</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-2)' }}>{currentUser?.email}</div>
          </div>
        </div>
      </div>

      {/* Restricciones */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <h3 style={{ fontFamily: 'var(--font)', fontSize: '0.9375rem', fontWeight: 500, marginBottom: '0.25rem' }}>
          Restricciones alimentarias
        </h3>
        <p style={{ fontSize: '0.8125rem', marginBottom: '1rem' }}>
          El organizador puede verlas para no servir algo que no podés comer.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
          {DIETAS.map(d => (
            <button key={d.id} onClick={() => toggleDieta(d.id)}
              style={{
                padding: '0.6rem 0.875rem',
                borderRadius: 'var(--radius)',
                border: dietary.includes(d.id) ? '2px solid var(--brand)' : '1px solid var(--border)',
                background: dietary.includes(d.id) ? 'var(--brand-soft)' : 'white',
                color: dietary.includes(d.id) ? 'var(--brand-dark)' : 'var(--text)',
                fontSize: '0.875rem',
                cursor: 'pointer',
                textAlign: 'left',
                fontFamily: 'var(--font)',
                transition: 'all 0.15s'
              }}>
              {d.label}
            </button>
          ))}
        </div>

        <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button onClick={guardar} className="btn btn-primary btn-sm" disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
          {saved && <span style={{ fontSize: '0.875rem', color: 'var(--success)' }}>✓ Guardado</span>}
        </div>
      </div>

      {/* Salir */}
      <button onClick={() => logout().then(() => navigate('/auth'))} className="btn btn-ghost" style={{ color: 'var(--danger)', paddingLeft: 0 }}>
        Cerrar sesión
      </button>
    </div>
  )
}
