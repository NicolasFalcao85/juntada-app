import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getJuntadaByShareCode, unirseAJuntada } from '../utils/firestore'

export default function UnirseJuntada() {
  const { code } = useParams()
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const [estado, setEstado] = useState('buscando')
  const [juntada, setJuntada] = useState(null)

  useEffect(() => {
    async function tryJoin() {
      try {
        const j = await getJuntadaByShareCode(code)
        if (!j) { setEstado('no-encontrada'); return }
        setJuntada(j)
        if (!currentUser) { setEstado('necesita-auth'); return }
        await unirseAJuntada(j.id, currentUser)
        navigate(`/j/${j.id}`)
      } catch {
        setEstado('error')
      }
    }
    tryJoin()
  }, [code, currentUser])

  if (estado === 'buscando') return (
    <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
      <p>Buscando la juntada...</p>
    </div>
  )

  if (estado === 'necesita-auth') return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <div style={{ textAlign: 'center', maxWidth: 380 }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
        <h2 style={{ marginBottom: '0.5rem' }}>Te invitaron a {juntada?.nombre}</h2>
        <p style={{ marginBottom: '1.5rem' }}>Necesitás una cuenta para confirmar tu asistencia y participar.</p>
        <button
          className="btn btn-primary btn-lg btn-full"
          onClick={() => {
            sessionStorage.setItem('redirectAfterLogin', `/unirse/${code}`)
            navigate('/auth')
          }}>
          Crear cuenta o iniciar sesión →
        </button>
      </div>
    </div>
  )

  if (estado === 'no-encontrada') return (
    <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
      <h2>Link inválido</h2>
      <p style={{ marginTop: '0.5rem' }}>Este link de invitación no existe o expiró.</p>
    </div>
  )

  return (
    <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
      <p>Algo salió mal. Pedile al organizador que te mande el link de nuevo.</p>
    </div>
  )
}
