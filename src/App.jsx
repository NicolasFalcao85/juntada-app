import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import PrivateRoute from './components/shared/PrivateRoute'
import AuthPage from './pages/AuthPage'
import Home from './pages/Home'
import NuevaJuntada from './pages/NuevaJuntada'
import JuntadaPage from './pages/JuntadaPage'
import UnirseJuntada from './pages/UnirseJuntada'
import Perfil from './pages/Perfil'
import './styles/global.css'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/unirse/:code" element={<UnirseJuntada />} />
          <Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} />
          <Route path="/nueva" element={<PrivateRoute><NuevaJuntada /></PrivateRoute>} />
          <Route path="/j/:id" element={<PrivateRoute><JuntadaPage /></PrivateRoute>} />
          <Route path="/perfil" element={<PrivateRoute><Perfil /></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
