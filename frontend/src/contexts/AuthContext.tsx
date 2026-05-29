import {
  createContext, useContext, useState, useEffect, useCallback,
  type ReactNode,
} from 'react'
import api from '../services/api'
import type { Usuario, TipoUsuario } from '../types'

// =============================================================
//  Tipos
// =============================================================

interface LoginPayload { email: string; senha: string }
interface AuthState { usuario: Usuario | null; token: string | null }

interface AuthContextValue {
  usuario: Usuario | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (payload: LoginPayload) => Promise<void>
  logout: () => void
}

// =============================================================
//  Context
// =============================================================

const AuthContext = createContext<AuthContextValue | null>(null)

// =============================================================
//  Rota por perfil
// =============================================================

export function rotaPorPerfil(tipo: TipoUsuario): string {
  const rotas: Record<TipoUsuario, string> = {
    ADMIN:   '/admin/dashboard',
    DOCENTE: '/docente/dashboard',
    ALUNO:   '/aluno/dashboard',
  }
  return rotas[tipo]
}

// =============================================================
//  Provider
// =============================================================

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ usuario: null, token: null })
  const [isLoading, setIsLoading] = useState(true)

  // Restaura sessão do localStorage
  useEffect(() => {
    const token   = localStorage.getItem('gbEducationToken')
    const raw     = localStorage.getItem('gbEducationUsuario')
    if (token && raw) {
      try {
        const usuario = JSON.parse(raw) as Usuario
        setState({ token, usuario })
      } catch {
        localStorage.removeItem('gbEducationToken')
        localStorage.removeItem('gbEducationUsuario')
      }
    }
    setIsLoading(false)
  }, [])

  const login = useCallback(async (payload: LoginPayload) => {
    const { data } = await api.post('/auth/login', payload)
    const { accessToken, usuario } = data.dados

    localStorage.setItem('gbEducationToken', accessToken)
    localStorage.setItem('gbEducationUsuario', JSON.stringify(usuario))
    setState({ token: accessToken, usuario })
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('gbEducationToken')
    localStorage.removeItem('gbEducationUsuario')
    setState({ token: null, usuario: null })
    window.location.href = '/login'
  }, [])

  return (
    <AuthContext.Provider
      value={{
        usuario: state.usuario,
        isAuthenticated: !!state.token,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// =============================================================
//  Hook
// =============================================================

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}
