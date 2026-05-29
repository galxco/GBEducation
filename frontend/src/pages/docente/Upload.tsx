import { useEffect, useState, useRef, useCallback, type DragEvent, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../../contexts/ToastContext'
import { Button, Input, Select } from '../../components/common'
import api from '../../services/api'
import type { Curso, Disciplina, Tema } from '../../types'

const TIPOS_PERMITIDOS = ['application/pdf', 'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'video/mp4', 'application/zip', 'application/x-zip-compressed']

const TAMANHO_MAX = 50 * 1024 * 1024 // 50MB

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export default function Upload() {
  const { toast }  = useToast()
  const navigate   = useNavigate()
  const inputRef   = useRef<HTMLInputElement>(null)

  const [cursos,      setCursos]      = useState<Curso[]>([])
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([])
  const [temas,       setTemas]       = useState<Tema[]>([])

  const [titulo,      setTitulo]      = useState('')
  const [descricao,   setDescricao]   = useState('')
  const [cursoId,     setCursoId]     = useState('')
  const [disciplinaId, setDisciplinaId] = useState('')
  const [temaId,      setTemaId]      = useState('')
  const [arquivo,     setArquivo]     = useState<File | null>(null)

  const [isDragging,  setIsDragging]  = useState(false)
  const [progresso,   setProgresso]   = useState(0)
  const [enviando,    setEnviando]    = useState(false)
  const [errors,      setErrors]      = useState<Record<string, string>>({})

  // Carrega cursos do docente
  useEffect(() => {
    api.get('/api/docente/cursos')
      .then(r => setCursos(r.data.dados ?? []))
      .catch(() => toast('error', 'Erro ao carregar cursos.'))
  }, [])

  // Carrega disciplinas ao selecionar curso
  useEffect(() => {
    setDisciplinaId('')
    setTemaId('')
    setDisciplinas([])
    setTemas([])
    if (!cursoId) return
    api.get(`/api/disciplinas?cursoId=${cursoId}`)
      .then(r => setDisciplinas(r.data.dados ?? []))
      .catch(console.error)
  }, [cursoId])

  // Carrega temas ao selecionar disciplina
  useEffect(() => {
    setTemaId('')
    setTemas([])
    if (!disciplinaId) return
    api.get(`/api/temas?disciplinaId=${disciplinaId}`)
      .then(r => setTemas(r.data.dados ?? []))
      .catch(console.error)
  }, [disciplinaId])

  const validarArquivo = (file: File): string | null => {
    if (!TIPOS_PERMITIDOS.includes(file.type)) {
      return 'Tipo não permitido. Use: PDF, DOC, DOCX, PPT, PPTX, MP4 ou ZIP.'
    }
    if (file.size > TAMANHO_MAX) {
      return `Arquivo muito grande. Máximo: 50 MB. Seu arquivo: ${formatBytes(file.size)}`
    }
    return null
  }

  const selecionarArquivo = useCallback((file: File) => {
    const erro = validarArquivo(file)
    if (erro) { toast('error', erro); return }
    setArquivo(file)
    setErrors(prev => ({ ...prev, arquivo: '' }))
  }, [toast])

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) selecionarArquivo(file)
  }

  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) selecionarArquivo(file)
  }

  const validar = () => {
    const e: Record<string, string> = {}
    if (!titulo.trim()) e.titulo   = 'Título é obrigatório.'
    if (!cursoId)       e.cursoId  = 'Selecione um curso.'
    if (!arquivo)       e.arquivo  = 'Selecione um arquivo.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const enviar = async () => {
    if (!validar() || !arquivo) return
    setEnviando(true)
    setProgresso(0)

    const formData = new FormData()
    formData.append('arquivo',  arquivo)
    formData.append('titulo',   titulo)
    formData.append('descricao', descricao)
    formData.append('cursoId',  cursoId)
    if (disciplinaId) formData.append('disciplinaId', disciplinaId)
    if (temaId)       formData.append('temaId',       temaId)

    try {
      const { data } = await api.post('/api/docente/materiais', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (ev) => {
          if (ev.total) setProgresso(Math.round((ev.loaded / ev.total) * 100))
        },
      })

      toast('success', `✓ "${data.dados.titulo}" publicado com sucesso!`)
      navigate('/docente/materiais')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { mensagem?: string } } })?.response?.data?.mensagem ?? 'Erro ao enviar material.'
      toast('error', msg)
      setProgresso(0)
    } finally { setEnviando(false) }
  }

  const extensaoArquivo = arquivo?.name.split('.').pop()?.toUpperCase() ?? ''

  return (
    <div className="animate-fade-in space-y-6 max-w-2xl">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Publicar Material</h1>
        <p className="text-slate-400 text-sm mt-1">Faça upload de materiais para seus alunos</p>
      </div>

      <div className="card p-6 space-y-5">
        {/* Título */}
        <Input
          label="Título *"
          value={titulo}
          onChange={e => setTitulo(e.target.value)}
          placeholder="Ex: Introdução ao React Hooks"
          error={errors.titulo}
        />

        {/* Descrição */}
        <div>
          <label className="label-base">Descrição (opcional)</label>
          <textarea
            className="input-base resize-none h-24"
            value={descricao}
            onChange={e => setDescricao(e.target.value)}
            placeholder="Descreva o conteúdo deste material..."
          />
        </div>

        {/* Curso */}
        <Select label="Curso *" value={cursoId} onChange={e => setCursoId(e.target.value)} error={errors.cursoId}>
          <option value="">Selecione um curso...</option>
          {cursos.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </Select>

        {/* Disciplina */}
        <Select label="Disciplina (opcional)" value={disciplinaId} onChange={e => setDisciplinaId(e.target.value)} disabled={!cursoId}>
          <option value="">Selecione uma disciplina...</option>
          {disciplinas.map(d => <option key={d.id} value={d.id}>{d.nome}</option>)}
        </Select>

        {/* Tema */}
        <Select label="Tema (opcional)" value={temaId} onChange={e => setTemaId(e.target.value)} disabled={!disciplinaId}>
          <option value="">Selecione um tema...</option>
          {temas.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
        </Select>

        {/* Drag & Drop */}
        <div>
          <label className="label-base">Arquivo * <span className="text-slate-500 font-normal">(PDF, DOC, DOCX, PPT, PPTX, MP4, ZIP — máx. 50MB)</span></label>

          {arquivo ? (
            <div className="flex items-center gap-4 p-4 rounded-xl border border-brand-500/30 bg-brand-500/5">
              <div className="w-10 h-10 rounded-xl bg-brand-600/20 flex items-center justify-center text-brand-400 font-bold text-xs">
                {extensaoArquivo}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{arquivo.name}</p>
                <p className="text-xs text-slate-500">{formatBytes(arquivo.size)}</p>
              </div>
              <button
                onClick={() => { setArquivo(null); if (inputRef.current) inputRef.current.value = '' }}
                className="text-slate-500 hover:text-red-400 transition-colors text-lg"
              >×</button>
            </div>
          ) : (
            <div
              onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200
                ${isDragging
                  ? 'border-brand-500 bg-brand-500/10'
                  : 'border-surface-border hover:border-brand-500/50 hover:bg-surface-card/50'
                }
                ${errors.arquivo ? 'border-red-500/50' : ''}
              `}
            >
              <div className="text-3xl mb-2">📁</div>
              <p className="text-slate-300 text-sm font-medium">Arraste o arquivo aqui</p>
              <p className="text-slate-500 text-xs mt-1">ou clique para selecionar</p>
              <input ref={inputRef} type="file" className="hidden" onChange={onInputChange}
                accept=".pdf,.doc,.docx,.ppt,.pptx,.mp4,.zip" />
            </div>
          )}
          {errors.arquivo && <p className="mt-1.5 text-xs text-red-400">{errors.arquivo}</p>}
        </div>

        {/* Barra de progresso */}
        {enviando && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Enviando...</span>
              <span>{progresso}%</span>
            </div>
            <div className="h-2 bg-surface rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-500 rounded-full transition-all duration-300 shadow-glow"
                style={{ width: `${progresso}%` }}
              />
            </div>
          </div>
        )}

        {/* Botões */}
        <div className="flex gap-3 pt-2">
          <Button variant="secondary" onClick={() => navigate('/docente/materiais')} disabled={enviando}>
            Cancelar
          </Button>
          <Button onClick={enviar} isLoading={enviando} className="flex-1">
            {enviando ? `Enviando... ${progresso}%` : '↑ Publicar Material'}
          </Button>
        </div>
      </div>
    </div>
  )
}
