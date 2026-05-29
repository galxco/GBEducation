import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { SkeletonCard } from '../../components/common'
import api from '../../services/api'
import type { Material } from '../../types'

interface Stats {
  cursos: number
  materiais: number
  downloads: number
}

const TIPOS_ICON: Record<string, string> = {
  PDF: '📄', DOCX: '📝', DOC: '📝', PPTX: '📊', PPT: '📊', MP4: '🎬', ZIP: '📦',
}

export default function DocenteDashboard() {
  const { usuario } = useAuth()
  const [stats,     setStats]     = useState<Stats | null>(null)
  const [recentes,  setRecentes]  = useState<Material[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/api/docente/cursos'),
      api.get('/api/docente/materiais/meus'),
    ])
      .then(([rc, rm]) => {
        const cursos    = rc.data.dados ?? []
        const materiais = rm.data.dados ?? []
        const downloads = materiais.reduce((acc: number, m: Material) => acc + (m.downloads ?? 0), 0)
        setStats({ cursos: cursos.length, materiais: materiais.length, downloads })
        setRecentes(materiais.slice(0, 5))
      })
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [])

  const cards = stats ? [
    { label: 'Cursos vinculados',    value: stats.cursos,    color: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',     icon: '◉' },
    { label: 'Materiais publicados', value: stats.materiais, color: 'text-brand-400 bg-brand-400/10 border-brand-400/20',  icon: '◈' },
    { label: 'Downloads totais',     value: stats.downloads, color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20', icon: '↓' },
  ] : []

  function formatBytes(bytes: number) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  return (
    <div className="animate-fade-in space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Painel do Docente</h1>
        <p className="text-slate-400 mt-1">
          Bem-vindo, <span className="text-cyan-400 font-medium">{usuario?.nome}</span>!
          Gerencie seus cursos e materiais.
        </p>
      </div>

      {/* Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1,2,3].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {cards.map((card) => (
            <div key={card.label} className="card p-5 flex items-start gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg border ${card.color}`}>
                {card.icon}
              </div>
              <div>
                <p className="text-slate-400 text-xs font-medium">{card.label}</p>
                <p className="font-display text-3xl font-bold text-white mt-0.5">{card.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Materiais recentes */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-sm font-semibold text-slate-400 uppercase tracking-widest">
            Materiais recentes
          </h2>
          <Link to="/docente/materiais" className="text-xs text-brand-400 hover:text-brand-300 transition-colors">
            Ver todos →
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-3">{[1,2,3].map(i => <SkeletonCard key={i} />)}</div>
        ) : recentes.length === 0 ? (
          <div className="card p-8 text-center text-slate-500">
            <p className="text-2xl mb-2">📂</p>
            <p>Nenhum material publicado ainda.</p>
            <Link to="/docente/upload" className="text-brand-400 hover:text-brand-300 text-sm mt-2 inline-block">
              Publicar primeiro material →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recentes.map((m) => (
              <div key={m.id} className="card p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center text-xl flex-shrink-0">
                  {TIPOS_ICON[m.tipoArquivo] ?? '📄'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white text-sm truncate">{m.titulo}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {m.curso?.nome} · {formatBytes(m.tamanhoBytes)}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-xs px-2 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300">
                    {m.tipoArquivo}
                  </span>
                  <p className="text-xs text-slate-500 mt-1">{m.downloads} downloads</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Acesso rápido */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: 'Meus Cursos',        to: '/docente/cursos'    },
          { label: 'Meus Materiais',     to: '/docente/materiais' },
          { label: 'Publicar Material',  to: '/docente/upload'    },
        ].map((link) => (
          <Link key={link.to} to={link.to}
            className="card p-4 text-center text-sm font-medium text-slate-300
              hover:text-white hover:border-cyan-500/50 hover:shadow-glow
              transition-all duration-200">
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  )
}
