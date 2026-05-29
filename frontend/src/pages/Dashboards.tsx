import { useAuth } from '../contexts/AuthContext'

export function AdminDashboard() {
  const { usuario } = useAuth()
  return (
    <div className="animate-fade-in">
      <h1 className="font-display text-2xl font-bold text-white mb-2">
        Painel do Administrador
      </h1>
      <p className="text-slate-400">Bem-vindo, <span className="text-brand-400">{usuario?.nome}</span>!</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
        {['Áreas', 'Cursos', 'Disciplinas', 'Temas'].map((item) => (
          <div key={item} className="card p-5">
            <p className="text-slate-400 text-sm">{item}</p>
            <p className="font-display text-3xl font-bold text-white mt-1">—</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export function DocenteDashboard() {
  const { usuario } = useAuth()
  return (
    <div className="animate-fade-in">
      <h1 className="font-display text-2xl font-bold text-white mb-2">
        Painel do Docente
      </h1>
      <p className="text-slate-400">Bem-vindo, <span className="text-cyan-400">{usuario?.nome}</span>!</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
        {['Meus Cursos', 'Meus Materiais'].map((item) => (
          <div key={item} className="card p-5">
            <p className="text-slate-400 text-sm">{item}</p>
            <p className="font-display text-3xl font-bold text-white mt-1">—</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export function AlunoDashboard() {
  const { usuario } = useAuth()
  return (
    <div className="animate-fade-in">
      <h1 className="font-display text-2xl font-bold text-white mb-2">
        Painel do Aluno
      </h1>
      <p className="text-slate-400">Bem-vindo, <span className="text-emerald-400">{usuario?.nome}</span>!</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
        {['Materiais Disponíveis', 'Downloads'].map((item) => (
          <div key={item} className="card p-5">
            <p className="text-slate-400 text-sm">{item}</p>
            <p className="font-display text-3xl font-bold text-white mt-1">—</p>
          </div>
        ))}
      </div>
    </div>
  )
}
