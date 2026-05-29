// =============================================================
//  GBEducation — Tipos compartilhados
// =============================================================

export type TipoUsuario = 'ADMIN' | 'DOCENTE' | 'ALUNO'

export interface Usuario {
  id: string
  nome: string
  email: string
  tipo: TipoUsuario
  areaConhecimentoId: string | null
  criadoEm?: string
  area?: { id: string; nome: string } | null
}

export interface AreaConhecimento {
  id: string
  nome: string
  descricao?: string
}

export interface Curso {
  id: string
  nome: string
  descricao?: string
  areaConhecimentoId: string
  area?: AreaConhecimento
}

export interface Disciplina {
  id: string
  nome: string
  descricao?: string
  cursoId: string
  curso?: Curso
}

export interface Tema {
  id: string
  nome: string
  descricao?: string
  disciplinaId: string
  disciplina?: Disciplina
}

export interface Material {
  id: string
  titulo: string
  descricao?: string
  arquivoUrl: string
  tipoArquivo: string
  tamanhoBytes: number
  downloads: number
  criadoEm: string
  atualizadoEm: string
  docenteId: string
  cursoId: string
  disciplinaId?: string
  temaId?: string
  docente?: { id: string; nome: string }
  curso?: { id: string; nome: string }
  disciplina?: { id: string; nome: string }
  tema?: { id: string; nome: string }
}

export interface ApiResponse<T = unknown> {
  sucesso: boolean
  mensagem: string
  dados: T
}

export interface PaginacaoMeta {
  total: number
  pagina: number
  limite: number
  totalPaginas: number
}
