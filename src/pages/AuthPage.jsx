import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function AuthPage() {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ email: '', password: '', nombre: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, register, loginWithGoogle } = useAuth()
  const navigate = useNavigate()

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  function getRedirect() {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    return code ? `/unirse/${code}` : '/'
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'login') {
        await login(form.email, form.password)
      } else {
        if (!form.nombre.trim()) { setError('Ingresá tu nombre'); setLoading(false); return }
        await register(form.email, form.password, form.nombre.trim())
      }
      navigate(getRedirect())
    } catch (err) {
      const msgs = {
        'auth/user-not-found': 'No existe una cuenta con ese email.',
        'auth/wrong-password': 'Contraseña incorrecta.',
        'auth/email-already-in-use': 'Ya existe una cuenta con ese email.',
        'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
        'auth/invalid-email': 'Email inválido.',
        'auth/invalid-credential': 'Email o contraseña incorrectos.',
      }
      setError(msgs[err.code] || 'Algo salió mal, intentá de nuevo.')
    }
    setLoading(false)
  }

  async function handleGoogle() {
    setError('')
    setLoading(true)
    try {
      await loginWithGoogle()
      navigate(getRedirect())
    } catch {
      setError('No se pudo iniciar sesión con Google.')
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', background: 'var(--surface)' }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🎉</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--text)' }}>
            Juntada
          </h1>
          <p style={{ color: 'var(--text-2)', marginTop: '0.25rem', fontSize: '0.9rem' }}>
            {mode === 'login' ? 'Bienvenido de vuelta' : 'Creá tu cuenta, es gratis'}
          </p>
        </div>

        <div className="card" style={{ boxShadow: 'var(--shadow-lg)' }}>

          <div style={{ display: 'flex', background: 'var(--surface-2)', borderRadius: 'var(--radius)', padding: '3px', marginBottom: '1.5rem' }}>
            {['login', 'register'].map(m => (
              <button key={m} onClick={() => { setMode(m); setError('') }}
                style={{ flex: 1, padding: '0.45rem', border: 'none', borderRadius: 'calc(var(--radius) - 2px)', background: mode === m ? 'white' : 'transparent', color: mode === m ? 'var(--text)' : 'var(--text-2)', fontWeight: mode === m ? 500 : 400, fontSize: '0.875rem', cursor: 'pointer', boxShadow: mode === m ? 'var(--shadow-sm)' : 'none', transition: 'all 0.15s', fontFamily: 'var(--font)' }}>
                {m === 'login' ? 'Iniciar sesión' : 'Registrarse'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {mode === 'register' && (
              <div className="form-group">
                <label>Tu nombre</label>
                <input type="text" value={form.nombre} onChange={set('nombre')} placeholder="Ej: Nico García" required autoFocus />
              </div>
            )}
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={form.email} onChange={set('email')} placeholder="vos@email.com" required autoFocus={mode === 'login'} />
            </div>
            <div className="form-group">
              <label>Contraseña</label>
              <input type="password" value={form.password} onChange={set('password')} placeholder={mode === 'register' ? 'Mínimo 6 caracteres' : '••••••'} required />
            </div>

            {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}><span>⚠</span> {error}</div>}

            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
              {loading ? 'Un segundo...' : mode === 'login' ? 'Entrar' : 'Crear cuenta'}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '1.25rem 0' }}>
            <div className="divider" style={{ flex: 1, margin: 0 }} />
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-3)' }}>o</span>
            <div className="divider" style={{ flex: 1, margin: 0 }} />
          </div>

          <button onClick={handleGoogle} className="btn btn-secondary btn-full" disabled={loading}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615Z" fill="#4285F4"/><path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/><path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/><path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58Z" fill="#EA4335"/></svg>
            Continuar con Google
          </button>
        </div>
      </div>
    </div>
  )
}
