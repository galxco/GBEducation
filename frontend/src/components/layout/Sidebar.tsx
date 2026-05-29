import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import type { TipoUsuario } from '../../types'

// =============================================================
//  Itens de menu por perfil
// =============================================================

interface NavItem { label: string; to: string; icon: string }

const menus: Record<TipoUsuario, NavItem[]> = {
  ADMIN: [
    { label: 'Dashboard',    to: '/admin/dashboard',    icon: '⊞' },
    { label: 'Áreas',        to: '/admin/areas',        icon: '◈' },
    { label: 'Cursos',       to: '/admin/cursos',       icon: '◉' },
    { label: 'Disciplinas',  to: '/admin/disciplinas',  icon: '◎' },
    { label: 'Temas',        to: '/admin/temas',        icon: '◇' },
  ],
  DOCENTE: [
    { label: 'Dashboard',   to: '/docente/dashboard',  icon: '⊞' },
    { label: 'Meus Cursos', to: '/docente/cursos',     icon: '◉' },
    { label: 'Materiais',   to: '/docente/materiais',  icon: '◈' },
    { label: 'Upload',      to: '/docente/upload',     icon: '↑' },
  ],
  ALUNO: [
    { label: 'Dashboard',   to: '/aluno/dashboard',    icon: '⊞' },
    { label: 'Materiais',   to: '/aluno/materiais',    icon: '◈' },
  ],
}

// =============================================================
//  Sidebar
// =============================================================

export default function Sidebar() {
  const { usuario, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  if (!usuario) return null

  const items = menus[usuario.tipo]

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const labelPerfil: Record<TipoUsuario, string> = {
    ADMIN:   'Administrador',
    DOCENTE: 'Docente',
    ALUNO:   'Aluno',
  }

  const corPerfil: Record<TipoUsuario, string> = {
    ADMIN:   'text-violet-400 bg-violet-400/10 border-violet-400/20',
    DOCENTE: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
    ALUNO:   'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  }

  const SidebarContent = () => (
    <aside className="flex flex-col h-full w-64 bg-surface-card border-r border-surface-border">
      {/* Logo */}
      <div className="px-6 pt-7 pb-6 border-b border-surface-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center shadow-glow">
            <span className="text-white font-display font-bold text-sm">GB</span>
          </div>
          <span className="font-display font-bold text-white text-lg tracking-tight">
            GBEducation
          </span>
        </div>
      </div>

      {/* Perfil */}
      <div className="px-4 py-4 border-b border-surface-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center text-brand-400 font-bold text-sm">
            {usuario.nome.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{usuario.nome}</p>
            <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full border mt-0.5 ${corPerfil[usuario.tipo]}`}>
              {labelPerfil[usuario.tipo]}
            </span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
              ${isActive
                ? 'bg-brand-600/20 text-brand-300 border border-brand-500/30 shadow-glow'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-surface-muted/40'
              }`
            }
          >
            <span className="text-base w-5 text-center">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-6 pt-2 border-t border-surface-border">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
            text-slate-600 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400
            hover:bg-red-500/10 transition-all duration-200"
        >
          <span className="text-base w-5 text-center">→</span>
          Sair
        </button>
      </div>
    </aside>
  )

  return (
    <>
      {/* Desktop */}
      <div className="hidden lg:flex h-screen sticky top-0">
        <SidebarContent />
      </div>

      {/* Mobile hamburger */}
      <div className="lg:hidden">
        <button
          onClick={() => setOpen(true)}
          className="fixed top-4 left-4 z-50 w-10 h-10 flex items-center justify-center
            rounded-xl bg-surface-card border border-surface-border
            text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white
            transition-colors shadow-lg"
        >
          ☰
        </button>

        {open && (
          <div className="fixed inset-0 z-50 flex animate-fade-in">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
            <div className="relative animate-slide-in">
              <SidebarContent />
            </div>
          </div>
        )}
      </div>
    </>
  )
}
