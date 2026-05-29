import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useToast } from '../../contexts/ToastContext'
import { Button, Skeleton } from '../../components/common'
import api from '../../services/api'
import type { Material } from '../../types'

const TIPOS_ICON: Record<string, string> = {
  PDF: '📄', DOCX: '📝', DOC: '📝', PPTX: '📊', PPT: '📊', MP4: '🎬', ZIP: '📦',
}
const TIPOS_VISUALIZAVEL = ['PDF', 'MP4']

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
}
function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export default function MaterialDetalhe() {
  const { id }          = useParams<{ id: string }>()
  const { toast }       = useToast()
  const navigate        = useNavigate()
  const [material,      setMaterial]      = useState<Material | null>(null)
  const [isLoading,     setIsLoading]     = useState(true)
  const [downloading,   setDownloading]   = useState(false)
  const [downloads,     setDownloads]     = useState(0)

  useEffect(() => {
    if (!id) return
    api.get(`/api/materiais/${id}`)
      .then(r => {
        setMaterial(r.data.dados)
        setDownloads(r.data.dados.downloads ?? 0)
      })
      .catch(() => {
        toast('error', 'Material não encontrado.')
        navigate('/aluno/materiais')
      })
      .finally(() => setIsLoading(false))
  }, [id])

  const handleDownload = async () => {
    if (!material) return
    setDownloading(true)
    try {
      const response = await api.get(`/api/materiais/${material.id}/download`, {
        responseType: 'blob',
      })
      const url  = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href  = url
      link.setAttribute('download', material.titulo)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      setDownloads(d => d + 1)
      toast('success', 'Download iniciado!')
    } catch {
      toast('error', 'Erro ao baixar o arquivo.')
    } finally {
      setDownloading(false)
    }
  }

  const handleVisualizar = () => {
    if (!material) return
    window.open(material.arquivoUrl, '_blank')
  }

  if (isLoading) {
    return (
      <div className="animate-fade-in space-y-6 max-w-3xl">
        <Skeleton className="h-6 w-48" />
        <div className="card p-8 space-y-4">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      </div>
    )
  }

  if (!material) return null

  // Breadcrumb
  const breadcrumbs = [
    { label: 'Materiais', to: '/aluno/materiais' },
    material.curso      && { label: material.curso.nome,      to: `/aluno/materiais?cursoId=${material.curso.id}` },
    material.disciplina && { label: material.disciplina.nome, to: null },
    material.tema       && { label: material.tema.nome,       to: null },
  ].filter(Boolean) as { label: string; to: string | null }[]

  return (
    <div className="animate-fade-in space-y-6 max-w-3xl">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
        {breadcrumbs.map((crumb, idx) => (
          <span key={idx} className="flex items-center gap-2">
            {idx > 0 && <span>›</span>}
            {crumb.to ? (
              <Link to={crumb.to} className="hover:text-brand-400 transition-colors">
                {crumb.label}
              </Link>
            ) : (
              <span className="text-slate-400">{crumb.label}</span>
            )}
          </span>
        ))}
      </nav>

      {/* Card principal */}
      <div className="card p-8 space-y-6">
        {/* Tipo + Título */}
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-surface border border-surface-border
            flex items-center justify-center text-3xl flex-shrink-0">
            {TIPOS_ICON[material.tipoArquivo] ?? '📄'}
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-white leading-tight">
              {material.titulo}
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Publicado por <span className="text-white">{material.docente?.nome}</span>
            </p>
          </div>
        </div>

        {/* Descrição */}
        {material.descricao && (
          <div>
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
              Descrição
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed">{material.descricao}</p>
          </div>
        )}

        {/* Metadados */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { label: 'Tipo',       value: material.tipoArquivo },
            { label: 'Tamanho',    value: formatBytes(material.tamanhoBytes) },
            { label: 'Downloads',  value: String(downloads) },
            { label: 'Publicado',  value: formatDate(material.criadoEm) },
            material.curso      && { label: 'Curso',      value: material.curso.nome },
            material.disciplina && { label: 'Disciplina', value: material.disciplina.nome },
            material.tema       && { label: 'Tema',       value: material.tema.nome },
          ].filter(Boolean).map((meta) => {
            const m = meta as { label: string; value: string }
            return (
              <div key={m.label} className="bg-surface rounded-xl p-3">
                <p className="text-xs text-slate-500 font-medium">{m.label}</p>
                <p className="text-sm text-white font-medium mt-0.5 truncate">{m.value}</p>
              </div>
            )
          })}
        </div>

        {/* Botões */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-surface-border">
          {TIPOS_VISUALIZAVEL.includes(material.tipoArquivo) && (
            <Button variant="secondary" onClick={handleVisualizar} className="flex-1">
              👁 Visualizar
            </Button>
          )}
          <Button onClick={handleDownload} isLoading={downloading} className="flex-1">
            ↓ Download · {downloads}
          </Button>
        </div>
      </div>

      {/* Voltar */}
      <Link to="/aluno/materiais"
        className="inline-flex items-center gap-2 text-sm text-slate-400
          hover:text-white transition-colors">
        ← Voltar para materiais
      </Link>
    </div>
  )
}
