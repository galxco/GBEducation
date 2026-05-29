import { useEffect, useState } from 'react'
import { useToast } from '../../contexts/ToastContext'
import { Button, Input, Select, Modal } from '../../components/common'
import DataTable, { type Column } from '../../components/common/DataTable'
import api from '../../services/api'
import type { Tema, Disciplina } from '../../types'

type Form = { nome: string; descricao: string; disciplinaId: string }
const formVazio: Form = { nome: '', descricao: '', disciplinaId: '' }

export default function AdminTemas() {
  const { toast } = useToast()
  const [temas,        setTemas]        = useState<Tema[]>([])
  const [disciplinas,  setDisciplinas]  = useState<Disciplina[]>([])
  const [isLoading,    setIsLoading]    = useState(true)
  const [modalAberto,  setModalAberto]  = useState(false)
  const [confirmExcluir, setConfirmExcluir] = useState<Tema | null>(null)
  const [editando,     setEditando]     = useState<Tema | null>(null)
  const [form,         setForm]         = useState<Form>(formVazio)
  const [salvando,     setSalvando]     = useState(false)
  const [excluindo,    setExcluindo]    = useState(false)

  const carregar = () => {
    setIsLoading(true)
    Promise.all([api.get('/api/temas'), api.get('/api/disciplinas')])
      .then(([rt, rd]) => { setTemas(rt.data.dados ?? []); setDisciplinas(rd.data.dados ?? []) })
      .catch(() => toast('error', 'Erro ao carregar dados.'))
      .finally(() => setIsLoading(false))
  }

  useEffect(() => { carregar() }, [])

  const abrirNovo = () => { setEditando(null); setForm(formVazio); setModalAberto(true) }

  const abrirEditar = (t: Tema) => {
    setEditando(t)
    setForm({ nome: t.nome, descricao: t.descricao ?? '', disciplinaId: t.disciplinaId })
    setModalAberto(true)
  }

  const fecharModal = () => { setModalAberto(false); setEditando(null); setForm(formVazio) }

  const salvar = async () => {
    if (!form.nome.trim())       { toast('error', 'Nome é obrigatório.'); return }
    if (!form.disciplinaId)      { toast('error', 'Selecione uma disciplina.'); return }
    setSalvando(true)
    try {
      if (editando) {
        await api.put(`/api/temas/${editando.id}`, form)
        toast('success', 'Tema atualizado!')
      } else {
        await api.post('/api/temas', form)
        toast('success', 'Tema criado!')
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
      await api.delete(`/api/temas/${confirmExcluir.id}`)
      toast('success', 'Tema excluído!')
      setConfirmExcluir(null); carregar()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { mensagem?: string } } })?.response?.data?.mensagem ?? 'Erro ao excluir.'
      toast('error', msg)
    } finally { setExcluindo(false) }
  }

  const colunas: Column<Tema>[] = [
    { key: 'nome', label: 'Nome' },
    { key: 'disciplina', label: 'Disciplina', render: (r) => (
      <span className="text-xs px-2 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-300">
        {r.disciplina?.nome ?? '—'}
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
          <h1 className="font-display text-2xl font-bold text-white">Temas</h1>
          <p className="text-slate-400 text-sm mt-1">Gerencie os temas por disciplina</p>
        </div>
        <Button onClick={abrirNovo}>+ Adicionar</Button>
      </div>

      <div className="card p-6">
        <DataTable columns={colunas} data={temas} onEditar={abrirEditar} onExcluir={setConfirmExcluir} isLoading={isLoading} />
      </div>

      {modalAberto && (
        <Modal title={editando ? 'Editar Tema' : 'Novo Tema'} onCancel={fecharModal} onConfirm={salvar} confirmLabel={editando ? 'Salvar' : 'Criar'} isLoading={salvando}>
          <div className="space-y-4">
            <Input label="Nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Ex: Gerenciamento de Estado com Zustand" />
            <Select label="Disciplina" value={form.disciplinaId} onChange={(e) => setForm({ ...form, disciplinaId: e.target.value })}>
              <option value="">Selecione uma disciplina...</option>
              {disciplinas.map((d) => <option key={d.id} value={d.id}>{d.nome}</option>)}
            </Select>
            <div>
              <label className="label-base">Descrição (opcional)</label>
              <textarea className="input-base resize-none h-24" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Descreva o tema..." />
            </div>
          </div>
        </Modal>
      )}

      {confirmExcluir && (
        <Modal title="Excluir Tema" onCancel={() => setConfirmExcluir(null)} onConfirm={excluir} confirmLabel="Excluir" confirmVariant="danger" isLoading={excluindo}>
          Tem certeza que deseja excluir o tema <strong className="text-white">"{confirmExcluir.nome}"</strong>?
        </Modal>
      )}
    </div>
  )
}
