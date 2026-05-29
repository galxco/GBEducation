import { useEffect, useState } from 'react'
import { useToast } from '../../contexts/ToastContext'
import { Button, Input, Select, Modal } from '../../components/common'
import DataTable, { type Column } from '../../components/common/DataTable'
import api from '../../services/api'
import type { Disciplina, Curso } from '../../types'

type Form = { nome: string; descricao: string; cursoId: string }
const formVazio: Form = { nome: '', descricao: '', cursoId: '' }

export default function AdminDisciplinas() {
  const { toast } = useToast()
  const [disciplinas,  setDisciplinas]  = useState<Disciplina[]>([])
  const [cursos,       setCursos]       = useState<Curso[]>([])
  const [isLoading,    setIsLoading]    = useState(true)
  const [modalAberto,  setModalAberto]  = useState(false)
  const [confirmExcluir, setConfirmExcluir] = useState<Disciplina | null>(null)
  const [editando,     setEditando]     = useState<Disciplina | null>(null)
  const [form,         setForm]         = useState<Form>(formVazio)
  const [salvando,     setSalvando]     = useState(false)
  const [excluindo,    setExcluindo]    = useState(false)

  const carregar = () => {
    setIsLoading(true)
    Promise.all([api.get('/api/disciplinas'), api.get('/api/cursos')])
      .then(([rd, rc]) => { setDisciplinas(rd.data.dados ?? []); setCursos(rc.data.dados ?? []) })
      .catch(() => toast('error', 'Erro ao carregar dados.'))
      .finally(() => setIsLoading(false))
  }

  useEffect(() => { carregar() }, [])

  const abrirNovo = () => { setEditando(null); setForm(formVazio); setModalAberto(true) }

  const abrirEditar = (d: Disciplina) => {
    setEditando(d)
    setForm({ nome: d.nome, descricao: d.descricao ?? '', cursoId: d.cursoId })
    setModalAberto(true)
  }

  const fecharModal = () => { setModalAberto(false); setEditando(null); setForm(formVazio) }

  const salvar = async () => {
    if (!form.nome.trim()) { toast('error', 'Nome é obrigatório.'); return }
    if (!form.cursoId)     { toast('error', 'Selecione um curso.'); return }
    setSalvando(true)
    try {
      if (editando) {
        await api.put(`/api/disciplinas/${editando.id}`, form)
        toast('success', 'Disciplina atualizada!')
      } else {
        await api.post('/api/disciplinas', form)
        toast('success', 'Disciplina criada!')
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
      await api.delete(`/api/disciplinas/${confirmExcluir.id}`)
      toast('success', 'Disciplina excluída!')
      setConfirmExcluir(null); carregar()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { mensagem?: string } } })?.response?.data?.mensagem ?? 'Erro ao excluir.'
      toast('error', msg)
    } finally { setExcluindo(false) }
  }

  const colunas: Column<Disciplina>[] = [
    { key: 'nome', label: 'Nome' },
    { key: 'curso', label: 'Curso', render: (r) => (
      <span className="text-xs px-2 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300">
        {r.curso?.nome ?? '—'}
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
          <h1 className="font-display text-2xl font-bold text-white">Disciplinas</h1>
          <p className="text-slate-400 text-sm mt-1">Gerencie as disciplinas por curso</p>
        </div>
        <Button onClick={abrirNovo}>+ Adicionar</Button>
      </div>

      <div className="card p-6">
        <DataTable columns={colunas} data={disciplinas} onEditar={abrirEditar} onExcluir={setConfirmExcluir} isLoading={isLoading} />
      </div>

      {modalAberto && (
        <Modal title={editando ? 'Editar Disciplina' : 'Nova Disciplina'} onCancel={fecharModal} onConfirm={salvar} confirmLabel={editando ? 'Salvar' : 'Criar'} isLoading={salvando}>
          <div className="space-y-4">
            <Input label="Nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Ex: React e Ecossistema" />
            <Select label="Curso" value={form.cursoId} onChange={(e) => setForm({ ...form, cursoId: e.target.value })}>
              <option value="">Selecione um curso...</option>
              {cursos.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </Select>
            <div>
              <label className="label-base">Descrição (opcional)</label>
              <textarea className="input-base resize-none h-24" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Descreva a disciplina..." />
            </div>
          </div>
        </Modal>
      )}

      {confirmExcluir && (
        <Modal title="Excluir Disciplina" onCancel={() => setConfirmExcluir(null)} onConfirm={excluir} confirmLabel="Excluir" confirmVariant="danger" isLoading={excluindo}>
          Tem certeza que deseja excluir a disciplina <strong className="text-white">"{confirmExcluir.nome}"</strong>?
        </Modal>
      )}
    </div>
  )
}
