import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useToast } from '../../contexts/ToastContext'
import { Button, Input, Modal } from '../../components/common'
import DataTable, { type Column } from '../../components/common/DataTable'
import api from '../../services/api'
import type { Material } from '../../types'

const TIPOS_ICON: Record<string, string> = {
  PDF: '📄', DOCX: '📝', DOC: '📝', PPTX: '📊', PPT: '📊', MP4: '🎬', ZIP: '📦',
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

type FormEdit = { titulo: string; descricao: string }

export default function DocenteMateriais() {
  const { toast } = useToast()
  const [materiais,      setMateriais]      = useState<Material[]>([])
  const [isLoading,      setIsLoading]      = useState(true)
  const [confirmExcluir, setConfirmExcluir] = useState<Material | null>(null)
  const [editando,       setEditando]       = useState<Material | null>(null)
  const [formEdit,       setFormEdit]       = useState<FormEdit>({ titulo: '', descricao: '' })
  const [excluindo,      setExcluindo]      = useState(false)
  const [salvando,       setSalvando]       = useState(false)

  const carregar = () => {
    setIsLoading(true)
    api.get('/api/docente/materiais/meus')
      .then(r => setMateriais(r.data.dados ?? []))
      .catch(() => toast('error', 'Erro ao carregar materiais.'))
      .finally(() => setIsLoading(false))
  }

  useEffect(() => { carregar() }, [])

  const abrirEditar = (m: Material) => {
    setEditando(m)
    setFormEdit({ titulo: m.titulo, descricao: m.descricao ?? '' })
  }

  const salvar = async () => {
    if (!editando) return
    if (!formEdit.titulo.trim()) { toast('error', 'Título é obrigatório.'); return }
    setSalvando(true)
    try {
      await api.put(`/api/docente/materiais/${editando.id}`, formEdit)
      toast('success', 'Material atualizado com sucesso!')
      setEditando(null)
      carregar()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { mensagem?: string } } })?.response?.data?.mensagem ?? 'Erro ao salvar.'
      toast('error', msg)
    } finally { setSalvando(false) }
  }

  const excluir = async () => {
    if (!confirmExcluir) return
    setExcluindo(true)
    try {
      await api.delete(`/api/docente/materiais/${confirmExcluir.id}`)
      toast('success', 'Material removido com sucesso!')
      setConfirmExcluir(null)
      carregar()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { mensagem?: string } } })?.response?.data?.mensagem ?? 'Erro ao excluir.'
      toast('error', msg)
    } finally { setExcluindo(false) }
  }

  const colunas: Column<Material>[] = [
    {
      key: 'titulo', label: 'Material',
      render: (m) => (
        <div className="flex items-center gap-3">
          <span className="text-xl">{TIPOS_ICON[m.tipoArquivo] ?? '📄'}</span>
          <div>
            <p className="font-medium text-white text-sm">{m.titulo}</p>
            <p className="text-xs text-slate-500">{formatBytes(m.tamanhoBytes)}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'curso', label: 'Curso',
      render: (m) => (
        <span className="text-xs px-2 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300">
          {m.curso?.nome ?? '—'}
        </span>
      ),
    },
    {
      key: 'criadoEm', label: 'Publicado em',
      render: (m) => <span className="text-slate-400 text-xs">{formatDate(m.criadoEm)}</span>,
    },
    {
      key: 'downloads', label: 'Downloads',
      render: (m) => (
        <span className="flex items-center gap-1 text-emerald-400 text-sm font-medium">
          ↓ {m.downloads}
        </span>
      ),
    },
  ]

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Meus Materiais</h1>
          <p className="text-slate-400 text-sm mt-1">{materiais.length} material(is) publicado(s)</p>
        </div>
        <Link to="/docente/upload">
          <Button>↑ Publicar material</Button>
        </Link>
      </div>

      <div className="card p-6">
        <DataTable
          columns={colunas}
          data={materiais}
          onEditar={abrirEditar}
          onExcluir={setConfirmExcluir}
          isLoading={isLoading}
        />
      </div>

      {/* Modal editar */}
      {editando && (
        <Modal
          title="Editar Material"
          onCancel={() => setEditando(null)}
          onConfirm={salvar}
          confirmLabel="Salvar"
          isLoading={salvando}
        >
          <div className="space-y-4">
            <Input
              label="Título"
              value={formEdit.titulo}
              onChange={e => setFormEdit({ ...formEdit, titulo: e.target.value })}
              placeholder="Título do material"
            />
            <div>
              <label className="label-base">Descrição (opcional)</label>
              <textarea
                className="input-base resize-none h-24"
                value={formEdit.descricao}
                onChange={e => setFormEdit({ ...formEdit, descricao: e.target.value })}
                placeholder="Descreva o conteúdo do material..."
              />
            </div>
          </div>
        </Modal>
      )}

      {/* Modal excluir */}
      {confirmExcluir && (
        <Modal
          title="Remover Material"
          onCancel={() => setConfirmExcluir(null)}
          onConfirm={excluir}
          confirmLabel="Remover"
          confirmVariant="danger"
          isLoading={excluindo}
        >
          Tem certeza que deseja remover o material{' '}
          <strong className="text-white">"{confirmExcluir.titulo}"</strong>?
          Esta ação não pode ser desfeita.
        </Modal>
      )}
    </div>
  )
}
