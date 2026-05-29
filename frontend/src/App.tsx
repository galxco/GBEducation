import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth, rotaPorPerfil } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import { ToastContainer } from './components/common'
import Layout from './components/layout/Layout'
import AccessibilityVisual from './components/accessibility/AccessibilityVisual'
import AccessibilityAudio from './components/accessibility/AccessibilityAudio'
import ProtectedRoute from './components/layout/ProtectedRoute'
import PublicRoute from './components/layout/PublicRoute'
import Login from './pages/auth/Login'
import Cadastro from './pages/auth/Cadastro'

// Admin
import AdminDashboard   from './pages/admin/Dashboard'
import AdminAreas       from './pages/admin/Areas'
import AdminCursos      from './pages/admin/Cursos'
import AdminDisciplinas from './pages/admin/Disciplinas'
import AdminTemas       from './pages/admin/Temas'

// Docente
import DocenteDashboard from './pages/docente/Dashboard'
import MeusCursos       from './pages/docente/MeusCursos'
import DocenteMateriais from './pages/docente/Materiais'
import Upload           from './pages/docente/Upload'

// Aluno
import AlunoDashboard   from './pages/aluno/Dashboard'
import AlunoMateriais   from './pages/aluno/Materiais'
import MaterialDetalhe  from './pages/aluno/Material'

function RootRedirect() {
  const { usuario, isAuthenticated, isLoading } = useAuth()
  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (!isAuthenticated || !usuario) return <Navigate to="/login" replace />
  return <Navigate to={rotaPorPerfil(usuario.tipo)} replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/cadastro" element={<PublicRoute><Cadastro /></PublicRoute>} />
            <Route path="/"         element={<RootRedirect />} />

            {/* Admin */}
            <Route path="/admin" element={
              <ProtectedRoute perfisPermitidos={['ADMIN']}><Layout /></ProtectedRoute>
            }>
              <Route path="dashboard"   element={<AdminDashboard />} />
              <Route path="areas"       element={<AdminAreas />} />
              <Route path="cursos"      element={<AdminCursos />} />
              <Route path="disciplinas" element={<AdminDisciplinas />} />
              <Route path="temas"       element={<AdminTemas />} />
            </Route>

            {/* Docente */}
            <Route path="/docente" element={
              <ProtectedRoute perfisPermitidos={['DOCENTE']}><Layout /></ProtectedRoute>
            }>
              <Route path="dashboard" element={<DocenteDashboard />} />
              <Route path="cursos"    element={<MeusCursos />} />
              <Route path="materiais" element={<DocenteMateriais />} />
              <Route path="upload"    element={<Upload />} />
            </Route>

            {/* Aluno */}
            <Route path="/aluno" element={
              <ProtectedRoute perfisPermitidos={['ALUNO']}><Layout /></ProtectedRoute>
            }>
              <Route path="dashboard"       element={<AlunoDashboard />} />
              <Route path="materiais"       element={<AlunoMateriais />} />
              <Route path="materiais/:id"   element={<MaterialDetalhe />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <ToastContainer />
          <AccessibilityAudio />
          <AccessibilityVisual />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
