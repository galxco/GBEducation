import { useEffect, useState, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Input, Select, Button, Skeleton } from '../../components/common'
import api from '../../services/api'
import type { Curso, Tema, Material, PaginacaoMeta } from '../../types'

const TIPOS_ICON: Record<string, string> = {
  PDF: '📄', DOCX: '📝', DOC: '📝', PPTX: '📊', PPT: '📊', MP4: '🎬', ZIP: '📦',
}
const TIPOS_COR: Record<string, string> = {
  PDF:  'text-red-400 bg-red-400/10 border-red-400/20',
  DOCX: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  DOC:  'text-blue-400 bg-blue-400/10 border-blue-400/20',
  PPTX: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
  PPT:  'text-orange-400 bg-orange-400/10 border-orange-400/20',
  MP4:  'text-purple-400 bg-purple-400/10 border-purple-400/20',
  ZIP:  'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function MaterialSkeleton() {
  return (
    <div className="card p-5 space-y-3">
      <div className="flex items-start gap-3">
        <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-8 w-full rounded-lg" />
    </div>
  )
}

export default function AlunoMateriais() {
  const { usuario }         = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  const [cursos,      setCursos]      = useState<Curso[]>([])
  const [temas,       setTemas]       = useState<Tema[]>([])
  const [materiais,   setMateriais]   = useState<Material[]>([])
  const [paginacao,   setPaginacao]   = useState<PaginacaoMeta | null>(null)
  const [isLoading,   setIsLoading]   = useState(true)

  const [cursoId,     setCursoId]     = useState(searchParams.get('cursoId') ?? '')
  const [temaId,      setTemaId]      = useState('')
  const [busca,       setBusca]       = useState(searchParams.get('busca') ?? '')
  const [pagina,      setPagina]      = useState(1)

  // Carrega cursos da área do aluno
  useEffect(() => {
    if (!usuario?.areaConhecimentoId) return
    api.get(`/api/cursos?areaId=${usuario.areaConhecimentoId}`)
      .then(r => setCursos(r.data.dados ?? []))
      .catch(console.error)
  }, [usuario])

  // Carrega temas ao selecionar curso
  useEffect(() => {
    setTemaId('')
    setTemas([])
    if (!cursoId) return
    api.get(`/api/temas`).then(r => {
      const todosTemas: Tema[] = r.data.dados ?? []
      // filtra temas do curso selecionado via disciplina
      setTemas(todosTemas)
    }).catch(console.error)
  }, [cursoId])

  const buscarMateriais = useCallback(() => {
    setIsLoading(true)
    const params = new URLSearchParams()
    if (cursoId) params.set('cursoId', cursoId)
    if (temaId)  params.set('temaId', temaId)
    if (busca)   params.set('busca', busca)
    params.set('pagina', String(pagina))
    params.set('limite', '10')

    api.get(`/api/materiais?${params.toString()}`)
      .then(r => {
        setMateriais(r.data.dados?.materiais ?? [])
        setPaginacao(r.data.dados?.paginacao ?? null)
      })
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [cursoId, temaId, busca, pagina])

  useEffect(() => { buscarMateriais() }, [buscarMateriais])

  const limparFiltros = () => {
    setCursoId(''); setTemaId(''); setBusca(''); setPagina(1)
    setSearchParams({})
  }

  const temFiltros = cursoId || temaId || busca

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Materiais</h1>
        <p className="text-slate-400 text-sm mt-1">
          {paginacao ? `${paginacao.total} material(is) disponível(is) na sua área` : 'Carregando...'}
        </p>
      </div>

      {/* Filtros */}
      <div className="card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Select value={cursoId} onChange={e => { setCursoId(e.target.value); setPagina(1) }}>
            <option value="">Todos os cursos</option>
            {cursos.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </Select>

          <Select value={temaId} onChange={e => { setTemaId(e.target.value); setPagina(1) }} disabled={!cursoId}>
            <option value="">Todos os temas</option>
            {temas.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
          </Select>

          <Input
            placeholder="🔍 Buscar por palavra-chave..."
            value={busca}
            onChange={e => { setBusca(e.target.value); setPagina(1) }}
          />
        </div>
        {temFiltros && (
          <div className="mt-3 flex justify-end">
            <Button variant="ghost" onClick={limparFiltros} className="text-xs py-1.5 px-3">
              ✕ Limpar filtros
            </Button>
          </div>
        )}
      </div>

      {/* Grid de materiais */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <MaterialSkeleton key={i} />)}
        </div>
      ) : materiais.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="text-6xl mb-4">📭</div>
          <h3 className="font-display text-lg font-semibold text-white mb-2">
            Nenhum material encontrado no GBEducation
          </h3>
          <p className="text-slate-500 text-sm">
            {temFiltros ? 'Tente ajustar os filtros de busca.' : 'Ainda não há materiais disponíveis na sua área.'}
          </p>
          {temFiltros && (
            <Button variant="ghost" onClick={limparFiltros} className="mt-4">
              Limpar filtros
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {materiais.map((m) => (
              <div key={m.id} className="card p-5 flex flex-col gap-3 hover:border-brand-500/30 transition-all duration-200">
                {/* Header */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center text-xl flex-shrink-0">
                    {TIPOS_ICON[m.tipoArquivo] ?? '📄'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white text-sm leading-tight line-clamp-2">
                      {m.titulo}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">{m.docente?.nome}</p>
                  </div>
                </div>

                {/* Metadados */}
                <div className="flex flex-wrap gap-1.5">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${TIPOS_COR[m.tipoArquivo] ?? 'text-slate-400 bg-slate-400/10 border-slate-400/20'}`}>
                    {m.tipoArquivo}
                  </span>
                  {m.curso && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300">
                      {m.curso.nome}
                    </span>
                  )}
                </div>

                {m.tema && (
                  <p className="text-xs text-slate-500 line-clamp-1">📌 {m.tema.nome}</p>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between text-xs text-slate-500 mt-auto pt-2 border-t border-surface-border">
                  <span>{formatDate(m.criadoEm)}</span>
                  <span>↓ {m.downloads}</span>
                </div>

                {/* Botão */}
                <Link
                  to={`/aluno/materiais/${m.id}`}
                  className="btn-secondary text-center text-xs py-2 w-full"
                >
                  Ver detalhes
                </Link>
              </div>
            ))}
          </div>

          {/* Paginação */}
          {paginacao && paginacao.totalPaginas > 1 && (
            <div className="flex items-center justify-between text-sm text-slate-400">
              <span>
                Página {paginacao.pagina} de {paginacao.totalPaginas} · {paginacao.total} materiais
              </span>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setPagina(p => Math.max(1, p - 1))}
                  disabled={pagina === 1} className="px-3 py-1.5 text-xs">
                  ← Anterior
                </Button>
                <Button variant="ghost" onClick={() => setPagina(p => Math.min(paginacao.totalPaginas, p + 1))}
                  disabled={pagina === paginacao.totalPaginas} className="px-3 py-1.5 text-xs">
                  Próximo →
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
