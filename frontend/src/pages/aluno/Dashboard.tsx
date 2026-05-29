import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { SkeletonCard } from '../../components/common'
import api from '../../services/api'
import type { Curso } from '../../types'

export default function AlunoDashboard() {
  const { usuario }   = useAuth()
  const [cursos,      setCursos]      = useState<Curso[]>([])
  const [isLoading,   setIsLoading]   = useState(true)

  useEffect(() => {
    if (!usuario?.areaConhecimentoId) { setIsLoading(false); return }
    api.get(`/api/cursos?areaId=${usuario.areaConhecimentoId}`)
      .then(r => setCursos(r.data.dados ?? []))
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [usuario])

  const cores = [
    'border-brand-500/30 bg-brand-500/5 hover:border-brand-500/60',
    'border-cyan-500/30 bg-cyan-500/5 hover:border-cyan-500/60',
    'border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/60',
    'border-violet-500/30 bg-violet-500/5 hover:border-violet-500/60',
    'border-amber-500/30 bg-amber-500/5 hover:border-amber-500/60',
    'border-rose-500/30 bg-rose-500/5 hover:border-rose-500/60',
  ]

  return (
    <div className="animate-fade-in space-y-8">
      {/* Saudação */}
      <div className="card p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-600/10 to-transparent pointer-events-none" />
        <div className="relative">
          <p className="text-slate-400 text-sm font-medium uppercase tracking-widest mb-1">
            Bem-vindo ao GBEducation
          </p>
          <h1 className="font-display text-3xl font-bold text-white">
            Olá, <span className="text-brand-400">{usuario?.nome?.split(' ')[0]}</span>! 👋
          </h1>
          {usuario?.area && (
            <div className="flex items-center gap-2 mt-3">
              <span className="text-slate-400 text-sm">Sua área:</span>
              <span className="text-xs font-medium px-3 py-1 rounded-full
                bg-brand-500/10 border border-brand-500/20 text-brand-300">
                {usuario.area.nome}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Cursos da área */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-sm font-semibold text-slate-400 uppercase tracking-widest">
            Cursos disponíveis na sua área
          </h2>
          <Link to="/aluno/materiais"
            className="text-xs text-brand-400 hover:text-brand-300 transition-colors">
            Ver todos os materiais →
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : cursos.length === 0 ? (
          <div className="card p-12 text-center text-slate-500">
            <p className="text-3xl mb-3">📚</p>
            <p>Nenhum curso disponível na sua área ainda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cursos.map((curso, idx) => (
              <Link
                key={curso.id}
                to={`/aluno/materiais?cursoId=${curso.id}`}
                className={`card p-5 flex flex-col gap-3 border transition-all duration-200 ${cores[idx % cores.length]}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-white text-sm leading-tight">{curso.nome}</h3>
                  <span className="text-slate-500 text-lg flex-shrink-0">→</span>
                </div>
                {curso.descricao && (
                  <p className="text-xs text-slate-500 line-clamp-2">{curso.descricao}</p>
                )}
                <p className="text-xs text-slate-500 mt-auto pt-2 border-t border-surface-border">
                  Clique para ver materiais
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Acesso rápido */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link to="/aluno/materiais"
          className="card p-4 text-center text-sm font-medium text-slate-300
            hover:text-white hover:border-brand-500/50 hover:shadow-glow transition-all duration-200">
          📚 Explorar Materiais
        </Link>
        <Link to="/aluno/materiais?busca="
          className="card p-4 text-center text-sm font-medium text-slate-300
            hover:text-white hover:border-emerald-500/50 transition-all duration-200">
          🔍 Buscar por palavra-chave
        </Link>
      </div>
    </div>
  )
}
