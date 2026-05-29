import { useState, useMemo } from 'react'
import { Skeleton, Button } from '../common'

// =============================================================
//  Tipos
// =============================================================

export interface Column<T> {
  key: keyof T | string
  label: string
  render?: (row: T) => React.ReactNode
}

interface DataTableProps<T extends { id: string }> {
  columns: Column<T>[]
  data: T[]
  onEditar?: (row: T) => void
  onExcluir?: (row: T) => void
  isLoading?: boolean
  pageSize?: number
}

// =============================================================
//  DataTable
// =============================================================

export default function DataTable<T extends { id: string }>({
  columns,
  data,
  onEditar,
  onExcluir,
  isLoading = false,
  pageSize = 8,
}: DataTableProps<T>) {
  const [busca,  setBusca]  = useState('')
  const [pagina, setPagina] = useState(1)

  // Busca local — filtra em todos os campos string
  const filtrado = useMemo(() => {
    if (!busca.trim()) return data
    const q = busca.toLowerCase()
    return data.filter((row) =>
      Object.values(row as Record<string, unknown>).some((v) =>
        String(v ?? '').toLowerCase().includes(q)
      )
    )
  }, [data, busca])

  const totalPaginas = Math.max(1, Math.ceil(filtrado.length / pageSize))
  const paginaAtual  = Math.min(pagina, totalPaginas)
  const inicio       = (paginaAtual - 1) * pageSize
  const paginados    = filtrado.slice(inicio, inicio + pageSize)

  const getValue = (row: T, key: string) => {
    const val = (row as Record<string, unknown>)[key]
    if (val && typeof val === 'object' && 'nome' in val) return (val as { nome: string }).nome
    return String(val ?? '—')
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Busca */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        >
          <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
        </svg>
        <input
          type="text"
          placeholder="Buscar..."
          value={busca}
          onChange={(e) => { setBusca(e.target.value); setPagina(1) }}
          className="input-base pl-10"
        />
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto rounded-xl border border-surface-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-border bg-surface-card/50">
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider"
                >
                  {col.label}
                </th>
              ))}
              {(onEditar || onExcluir) && (
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Ações
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border">
            {paginados.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + 1}
                  className="text-center py-12 text-slate-500"
                >
                  Nenhum registro encontrado.
                </td>
              </tr>
            ) : (
              paginados.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-surface-card/40 transition-colors"
                >
                  {columns.map((col) => (
                    <td key={String(col.key)} className="px-4 py-3 text-slate-300">
                      {col.render ? col.render(row) : getValue(row, String(col.key))}
                    </td>
                  ))}
                  {(onEditar || onExcluir) && (
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {onEditar && (
                          <button
                            onClick={() => onEditar(row)}
                            title="Editar"
                            className="w-8 h-8 flex items-center justify-center rounded-lg
                              text-slate-400 hover:text-brand-400 hover:bg-brand-500/10
                              transition-all duration-200"
                          >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                          </button>
                        )}
                        {onExcluir && (
                          <button
                            onClick={() => onExcluir(row)}
                            title="Excluir"
                            className="w-8 h-8 flex items-center justify-center rounded-lg
                              text-slate-400 hover:text-red-400 hover:bg-red-500/10
                              transition-all duration-200"
                          >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6"/>
                              <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                              <path d="M10 11v6M14 11v6"/>
                              <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      {totalPaginas > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-400">
          <span>
            {inicio + 1}–{Math.min(inicio + pageSize, filtrado.length)} de {filtrado.length}
          </span>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={() => setPagina((p) => Math.max(1, p - 1))}
              disabled={paginaAtual === 1}
              className="px-3 py-1.5 text-xs"
            >
              ← Anterior
            </Button>
            <Button
              variant="ghost"
              onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
              disabled={paginaAtual === totalPaginas}
              className="px-3 py-1.5 text-xs"
            >
              Próximo →
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
