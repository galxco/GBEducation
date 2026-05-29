import { Navigate } from 'react-router-dom'
import { useAuth, rotaPorPerfil } from '../../contexts/AuthContext'
import type { ReactNode } from 'react'

interface PublicRouteProps {
  children: ReactNode
}

// Redireciona usuários já autenticados para o dashboard do seu perfil
export default function PublicRoute({ children }: PublicRouteProps) {
  const { usuario, isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (isAuthenticated && usuario) {
    return <Navigate to={rotaPorPerfil(usuario.tipo)} replace />
  }

  return <>{children}</>
}
