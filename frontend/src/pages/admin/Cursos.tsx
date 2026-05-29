import { useEffect, useState } from 'react'
import { useToast } from '../../contexts/ToastContext'
import { Button, Input, Select, Modal } from '../../components/common'
import DataTable, { type Column } from '../../components/common/DataTable'
import api from '../../services/api'
import type { Curso, AreaConhecimento } from '../../types'

type Form = { nome: string; descricao: string; areaConhecimentoId: string }
const formVazio: Form = { nome: '', descricao: '', areaConhecimentoId: '' }

export default function AdminCursos() {
  const { toast } = useToast()
  const [cursos,      setCursos]      = useState<Curso[]>([])
  const [areas,       setAreas]       = useState<AreaConhecimento[]>([])
  const [isLoading,   setIsLoading]   = useState(true)
  const [modalAberto, setModalAberto] = useState(false)
  const [confirmExcluir, setConfirmExcluir] = useState<Curso | null>(null)
  const [editando,    setEditando]    = useState<Curso | null>(null)
  const [form,        setForm]        = useState<Form>(formVazio)
  const [salvando,    setSalvando]    = useState(false)
  const [excluindo,   setExcluindo]   = useState(false)

  const carregar = () => {
    setIsLoading(true)
    Promise.all([
      api.get('/api/cursos'),
      api.get('/api/areas'),
    ])
      .then(([rc, ra]) => {
        setCursos(rc.data.dados ?? [])
        setAreas(ra.data.dados ?? [])
      })
      .catch(() => toast('error', 'Erro ao carregar dados.'))
      .finally(() => setIsLoading(false))
  }

  useEffect(() => { carregar() }, [])

  const abrirNovo = () => { setEditando(null); setForm(formVazio); setModalAberto(true) }

  const abrirEditar = (curso: Curso) => {
    setEditando(curso)
    setForm({ nome: curso.nome, descricao: curso.descricao ?? '', areaConhecimentoId: curso.areaConhecimentoId })
    setModalAberto(true)
  }

  const fecharModal = () => { setModalAberto(false); setEditando(null); setForm(formVazio) }

  const salvar = async () => {
    if (!form.nome.trim()) { toast('error', 'Nome é obrigatório.'); return }
    if (!form.areaConhecimentoId) { toast('error', 'Selecione uma área.'); return }
    setSalvando(true)
    try {
      if (editando) {
        await api.put(`/api/cursos/${editando.id}`, form)
        toast('success', 'Curso atualizado com sucesso!')
      } else {
        await api.post('/api/cursos', form)
        toast('success', 'Curso criado com sucesso!')
      }
      fecharModal(); carregar()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { mensagem?: string } } })?.response?.data?.mensagem ?? 'Erro ao salvar.'
      toast('error', msg)
    } finally { setSalvando(false) }
  }

  const excluir = async () => {
    if (!confirmExcluir) return
    setExcluindo(true)
    try {
      await api.delete(`/api/cursos/${confirmExcluir.id}`)
      toast('success', 'Curso excluído com sucesso!')
      setConfirmExcluir(null); carregar()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { mensagem?: string } } })?.response?.data?.mensagem ?? 'Erro ao excluir.'
      toast('error', msg)
    } finally { setExcluindo(false) }
  }

  const colunas: Column<Curso>[] = [
    { key: 'nome', label: 'Nome' },
    { key: 'area', label: 'Área', render: (r) => (
      <span className="text-xs px-2 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300">
        {r.area?.nome ?? '—'}
      </span>
    )},
    { key: 'descricao', label: 'Descrição', render: (r) => (
      <span className="text-slate-400 text-xs">{r.descricao ?? '—'}</span>
    )},
  ]

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Cursos</h1>
          <p className="text-slate-400 text-sm mt-1">Gerencie os cursos da plataforma</p>
        </div>
        <Button onClick={abrirNovo}>+ Adicionar</Button>
      </div>

      <div className="card p-6">
        <DataTable columns={colunas} data={cursos} onEditar={abrirEditar} onExcluir={setConfirmExcluir} isLoading={isLoading} />
      </div>

      {modalAberto && (
        <Modal
          title={editando ? 'Editar Curso' : 'Novo Curso'}
          onCancel={fecharModal} onConfirm={salvar}
          confirmLabel={editando ? 'Salvar' : 'Criar'} isLoading={salvando}
        >
          <div className="space-y-4">
            <Input label="Nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Ex: Desenvolvimento Web" />
            <Select label="Área de Conhecimento" value={form.areaConhecimentoId} onChange={(e) => setForm({ ...form, areaConhecimentoId: e.target.value })}>
              <option value="">Selecione uma área...</option>
              {areas.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
            </Select>
            <div>
              <label className="label-base">Descrição (opcional)</label>
              <textarea className="input-base resize-none h-24" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Descreva o curso..." />
            </div>
          </div>
        </Modal>
      )}

      {confirmExcluir && (
        <Modal title="Excluir Curso" onCancel={() => setConfirmExcluir(null)} onConfirm={excluir} confirmLabel="Excluir" confirmVariant="danger" isLoading={excluindo}>
          Tem certeza que deseja excluir o curso <strong className="text-white">"{confirmExcluir.nome}"</strong>?
        </Modal>
      )}
    </div>
  )
}
