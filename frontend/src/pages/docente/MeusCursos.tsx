import { useEffect, useState, useMemo } from 'react'
import { useToast } from '../../contexts/ToastContext'
import { Button, Select, Modal } from '../../components/common'
import api from '../../services/api'
import type { Curso, AreaConhecimento } from '../../types'

export default function MeusCursos() {
  const { toast } = useToast()
  const [meusCursos,    setMeusCursos]    = useState<Curso[]>([])
  const [todosCursos,   setTodosCursos]   = useState<Curso[]>([])
  const [areas,         setAreas]         = useState<AreaConhecimento[]>([])
  const [isLoading,     setIsLoading]     = useState(true)
  const [modalVincular, setModalVincular] = useState(false)
  const [confirmDesvincular, setConfirmDesvincular] = useState<Curso | null>(null)
  const [cursoSelecionado,   setCursoSelecionado]   = useState('')
  const [filtroArea,         setFiltroArea]          = useState('')
  const [vinculando,   setVinculando]   = useState(false)
  const [desvinculando, setDesvinculando] = useState(false)

  const carregar = () => {
    setIsLoading(true)
    Promise.all([
      api.get('/api/docente/cursos'),
      api.get('/api/cursos'),
      api.get('/api/areas'),
    ])
      .then(([rmc, rtc, ra]) => {
        setMeusCursos(rmc.data.dados ?? [])
        setTodosCursos(rtc.data.dados ?? [])
        setAreas(ra.data.dados ?? [])
      })
      .catch(() => toast('error', 'Erro ao carregar cursos.'))
      .finally(() => setIsLoading(false))
  }

  useEffect(() => { carregar() }, [])

  // Cursos disponíveis = todos - já vinculados, filtrado por área
  const meusIds = new Set(meusCursos.map(c => c.id))
  const cursosDisponiveis = useMemo(() =>
    todosCursos.filter(c =>
      !meusIds.has(c.id) &&
      (!filtroArea || c.areaConhecimentoId === filtroArea)
    ),
    [todosCursos, meusIds, filtroArea]
  )

  const vincular = async () => {
    if (!cursoSelecionado) { toast('error', 'Selecione um curso.'); return }
    setVinculando(true)
    try {
      await api.post('/api/docente/cursos', { cursoId: cursoSelecionado })
      toast('success', 'Vínculo criado com sucesso!')
      setModalVincular(false)
      setCursoSelecionado('')
      setFiltroArea('')
      carregar()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { mensagem?: string } } })?.response?.data?.mensagem ?? 'Erro ao vincular.'
      toast('error', msg)
    } finally { setVinculando(false) }
  }

  const desvincular = async () => {
    if (!confirmDesvincular) return
    setDesvinculando(true)
    try {
      await api.delete(`/api/docente/cursos/${confirmDesvincular.id}`)
      toast('success', 'Desvinculado com sucesso!')
      setConfirmDesvincular(null)
      carregar()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { mensagem?: string } } })?.response?.data?.mensagem ?? 'Erro ao desvincular.'
      toast('error', msg)
    } finally { setDesvinculando(false) }
  }

  const corArea: Record<number, string> = {
    0: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
    1: 'text-violet-400 bg-violet-400/10 border-violet-400/20',
    2: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Meus Cursos</h1>
          <p className="text-slate-400 text-sm mt-1">Cursos que você ministra na plataforma</p>
        </div>
        <Button onClick={() => setModalVincular(true)}>+ Vincular curso</Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => (
            <div key={i} className="card p-5 animate-pulse space-y-3">
              <div className="h-4 bg-surface-muted rounded w-2/3" />
              <div className="h-3 bg-surface-muted rounded w-full" />
            </div>
          ))}
        </div>
      ) : meusCursos.length === 0 ? (
        <div className="card p-12 text-center text-slate-500">
          <p className="text-3xl mb-3">🎓</p>
          <p className="font-medium text-slate-300">Nenhum curso vinculado ainda.</p>
          <p className="text-sm mt-1">Clique em "Vincular curso" para começar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {meusCursos.map((curso, idx) => (
            <div key={curso.id} className="card p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-white text-sm leading-tight">{curso.nome}</h3>
                <button
                  onClick={() => setConfirmDesvincular(curso)}
                  className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg
                    text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                  title="Desvincular"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
              </div>

              {curso.descricao && (
                <p className="text-xs text-slate-500 line-clamp-2">{curso.descricao}</p>
              )}

              <span className={`self-start text-xs font-medium px-2.5 py-1 rounded-full border ${corArea[idx % 3]}`}>
                {curso.area?.nome ?? 'Área não informada'}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Modal vincular */}
      {modalVincular && (
        <Modal
          title="Vincular a um Curso"
          onCancel={() => { setModalVincular(false); setCursoSelecionado(''); setFiltroArea('') }}
          onConfirm={vincular}
          confirmLabel="Vincular"
          isLoading={vinculando}
        >
          <div className="space-y-4">
            <Select label="Filtrar por Área" value={filtroArea} onChange={(e) => { setFiltroArea(e.target.value); setCursoSelecionado('') }}>
              <option value="">Todas as áreas</option>
              {areas.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
            </Select>
            <Select label="Curso" value={cursoSelecionado} onChange={(e) => setCursoSelecionado(e.target.value)}>
              <option value="">Selecione um curso...</option>
              {cursosDisponiveis.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </Select>
            {cursosDisponiveis.length === 0 && (
              <p className="text-xs text-slate-500 text-center py-2">
                Nenhum curso disponível para vincular.
              </p>
            )}
          </div>
        </Modal>
      )}

      {/* Modal desvincular */}
      {confirmDesvincular && (
        <Modal
          title="Desvincular Curso"
          onCancel={() => setConfirmDesvincular(null)}
          onConfirm={desvincular}
          confirmLabel="Desvincular"
          confirmVariant="danger"
          isLoading={desvinculando}
        >
          Tem certeza que deseja se desvincular do curso{' '}
          <strong className="text-white">"{confirmDesvincular.nome}"</strong>?
          Seus materiais publicados neste curso não serão removidos.
        </Modal>
      )}
    </div>
  )
}
