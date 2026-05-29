import { useEffect, useState } from 'react'
import { useToast } from '../../contexts/ToastContext'
import { Button, Input, Modal } from '../../components/common'
import DataTable, { type Column } from '../../components/common/DataTable'
import api from '../../services/api'
import type { AreaConhecimento } from '../../types'

type Form = { nome: string; descricao: string }
const formVazio: Form = { nome: '', descricao: '' }

export default function AdminAreas() {
  const { toast } = useToast()
  const [areas,       setAreas]       = useState<AreaConhecimento[]>([])
  const [isLoading,   setIsLoading]   = useState(true)
  const [modalAberto, setModalAberto] = useState(false)
  const [confirmExcluir, setConfirmExcluir] = useState<AreaConhecimento | null>(null)
  const [editando,    setEditando]    = useState<AreaConhecimento | null>(null)
  const [form,        setForm]        = useState<Form>(formVazio)
  const [salvando,    setSalvando]    = useState(false)
  const [excluindo,   setExcluindo]   = useState(false)

  const carregar = () => {
    setIsLoading(true)
    api.get('/api/areas')
      .then((r) => setAreas(r.data.dados ?? []))
      .catch(() => toast('error', 'Erro ao carregar áreas.'))
      .finally(() => setIsLoading(false))
  }

  useEffect(() => { carregar() }, [])

  const abrirNovo = () => {
    setEditando(null)
    setForm(formVazio)
    setModalAberto(true)
  }

  const abrirEditar = (area: AreaConhecimento) => {
    setEditando(area)
    setForm({ nome: area.nome, descricao: area.descricao ?? '' })
    setModalAberto(true)
  }

  const fecharModal = () => { setModalAberto(false); setEditando(null); setForm(formVazio) }

  const salvar = async () => {
    if (!form.nome.trim()) { toast('error', 'Nome é obrigatório.'); return }
    setSalvando(true)
    try {
      if (editando) {
        await api.put(`/api/areas/${editando.id}`, form)
        toast('success', 'Área atualizada com sucesso!')
      } else {
        await api.post('/api/areas', form)
        toast('success', 'Área criada com sucesso!')
      }
      fecharModal()
      carregar()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { mensagem?: string } } })?.response?.data?.mensagem ?? 'Erro ao salvar.'
      toast('error', msg)
    } finally {
      setSalvando(false)
    }
  }

  const excluir = async () => {
    if (!confirmExcluir) return
    setExcluindo(true)
    try {
      await api.delete(`/api/areas/${confirmExcluir.id}`)
      toast('success', 'Área excluída com sucesso!')
      setConfirmExcluir(null)
      carregar()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { mensagem?: string } } })?.response?.data?.mensagem ?? 'Erro ao excluir.'
      toast('error', msg)
    } finally {
      setExcluindo(false)
    }
  }

  const colunas: Column<AreaConhecimento>[] = [
    { key: 'nome',     label: 'Nome' },
    { key: 'descricao', label: 'Descrição', render: (r) => (
      <span className="text-slate-400 text-xs">{r.descricao ?? '—'}</span>
    )},
  ]

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Áreas de Conhecimento</h1>
          <p className="text-slate-400 text-sm mt-1">Gerencie as áreas disponíveis na plataforma</p>
        </div>
        <Button onClick={abrirNovo}>+ Adicionar</Button>
      </div>

      <div className="card p-6">
        <DataTable
          columns={colunas}
          data={areas}
          onEditar={abrirEditar}
          onExcluir={setConfirmExcluir}
          isLoading={isLoading}
        />
      </div>

      {/* Modal form */}
      {modalAberto && (
        <Modal
          title={editando ? 'Editar Área' : 'Nova Área de Conhecimento'}
          onCancel={fecharModal}
          onConfirm={salvar}
          confirmLabel={editando ? 'Salvar' : 'Criar'}
          isLoading={salvando}
        >
          <div className="space-y-4">
            <Input
              label="Nome"
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              placeholder="Ex: Tecnologia da Informação"
            />
            <div>
              <label className="label-base">Descrição (opcional)</label>
              <textarea
                className="input-base resize-none h-24"
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                placeholder="Descreva brevemente esta área..."
              />
            </div>
          </div>
        </Modal>
      )}

      {/* Modal confirmação exclusão */}
      {confirmExcluir && (
        <Modal
          title="Excluir Área"
          onCancel={() => setConfirmExcluir(null)}
          onConfirm={excluir}
          confirmLabel="Excluir"
          confirmVariant="danger"
          isLoading={excluindo}
        >
          Tem certeza que deseja excluir a área{' '}
          <strong className="text-white">"{confirmExcluir.nome}"</strong>?
          Esta ação não pode ser desfeita.
        </Modal>
      )}
    </div>
  )
}
