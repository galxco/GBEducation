import { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { SkeletonCard } from '../../components/common'
import api from '../../services/api'

interface Stats {
  totalAreas: number
  totalCursos: number
  totalDisciplinas: number
  totalTemas: number
  totalMateriais: number
  totalDocentes: number
  totalAlunos: number
}

interface StatCard {
  label: string
  value: number
  icon: string
  color: string
}

export default function AdminDashboard() {
  const { usuario } = useAuth()
  const [stats,     setStats]     = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    api.get('/api/admin/stats')
      .then((r) => setStats(r.data.dados))
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [])

  const cards: StatCard[] = stats ? [
    { label: 'Áreas de Conhecimento', value: stats.totalAreas,       icon: '◈', color: 'text-violet-400 bg-violet-400/10 border-violet-400/20' },
    { label: 'Cursos',                value: stats.totalCursos,      icon: '◉', color: 'text-brand-400 bg-brand-400/10 border-brand-400/20'     },
    { label: 'Disciplinas',           value: stats.totalDisciplinas, icon: '◎', color: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20'         },
    { label: 'Temas',                 value: stats.totalTemas,       icon: '◇', color: 'text-sky-400 bg-sky-400/10 border-sky-400/20'            },
    { label: 'Materiais',             value: stats.totalMateriais,   icon: '◈', color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'},
    { label: 'Docentes',              value: stats.totalDocentes,    icon: '◉', color: 'text-amber-400 bg-amber-400/10 border-amber-400/20'      },
    { label: 'Alunos',                value: stats.totalAlunos,      icon: '◎', color: 'text-rose-400 bg-rose-400/10 border-rose-400/20'         },
  ] : []

  return (
    <div className="animate-fade-in space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-white">
          Painel Administrativo — GBEducation
        </h1>
        <p className="text-slate-400 mt-1">
          Bem-vindo, <span className="text-violet-400 font-medium">{usuario?.nome}</span>.
          Aqui está um resumo da plataforma.
        </p>
      </div>

      {/* Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 7 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((card) => (
            <div key={card.label} className="card p-5 flex items-start gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg border ${card.color}`}>
                {card.icon}
              </div>
              <div>
                <p className="text-slate-400 text-xs font-medium">{card.label}</p>
                <p className="font-display text-3xl font-bold text-white mt-0.5">
                  {card.value}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Links rápidos */}
      <div>
        <h2 className="font-display text-sm font-semibold text-slate-400 uppercase tracking-widest mb-4">
          Acesso rápido
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Gerenciar Áreas',       to: '/admin/areas'       },
            { label: 'Gerenciar Cursos',      to: '/admin/cursos'      },
            { label: 'Gerenciar Disciplinas', to: '/admin/disciplinas' },
            { label: 'Gerenciar Temas',       to: '/admin/temas'       },
          ].map((link) => (
            <a
              key={link.to}
              href={link.to}
              className="card p-4 text-center text-sm font-medium text-slate-300
                hover:text-white hover:border-brand-500/50 hover:shadow-glow
                transition-all duration-200 cursor-pointer"
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
