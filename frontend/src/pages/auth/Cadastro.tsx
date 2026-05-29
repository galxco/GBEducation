import { useState, useEffect, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../../services/api'
import { useAuth, rotaPorPerfil } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { Button, Input, Select } from '../../components/common'
import type { AreaConhecimento } from '../../types'

export default function Cadastro() {
  const [nome,    setNome]    = useState('')
  const [email,   setEmail]   = useState('')
  const [senha,   setSenha]   = useState('')
  const [tipo,    setTipo]    = useState<'ALUNO' | 'DOCENTE'>('ALUNO')
  const [areaId,  setAreaId]  = useState('')
  const [areas,   setAreas]   = useState<AreaConhecimento[]>([])
  const [loading, setLoading] = useState(false)
  const [errors,  setErrors]  = useState<Record<string, string>>({})

  const { login } = useAuth()
  const { toast } = useToast()
  const navigate  = useNavigate()

  useEffect(() => {
    api.get('/api/areas')
      .then((r) => setAreas(r.data.dados ?? []))
      .catch(() => {/* silencia — áreas carregarão depois */})
  }, [])

  const validate = () => {
    const e: Record<string, string> = {}
    if (!nome || nome.length < 3)       e.nome  = 'Nome deve ter no mínimo 3 caracteres.'
    if (!email || !/\S+@\S+\.\S+/.test(email)) e.email = 'E-mail inválido.'
    if (!senha || senha.length < 8)     e.senha = 'Senha deve ter no mínimo 8 caracteres.'
    if (!/[A-Z]/.test(senha))           e.senha = 'Senha deve ter pelo menos 1 letra maiúscula.'
    if (!/[0-9]/.test(senha))           e.senha = 'Senha deve ter pelo menos 1 número.'
    if (tipo === 'ALUNO' && !areaId)    e.areaId = 'Selecione sua área de conhecimento.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      await api.post('/auth/cadastro', {
        nome, email, senha, tipo,
        ...(tipo === 'ALUNO' && { areaConhecimentoId: areaId }),
      })
      await login({ email, senha })
      const u = JSON.parse(localStorage.getItem('gbEducationUsuario') ?? '{}')
      navigate(rotaPorPerfil(u.tipo), { replace: true })
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { mensagem?: string } } })
        ?.response?.data?.mensagem ?? 'Erro ao cadastrar.'
      toast('error', msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96
          bg-brand-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14
            rounded-2xl bg-brand-600 shadow-glow-lg mb-4">
            <span className="font-display font-bold text-white text-xl">GB</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-white">GBEducation</h1>
          <p className="text-slate-500 text-sm mt-1">Crie sua conta</p>
        </div>

        <div className="card p-8">
          <h2 className="font-display text-lg font-semibold text-white mb-6">
            Criar conta
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Nome completo"
              placeholder="Seu nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              error={errors.nome}
            />

            <Input
              label="E-mail"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
            />

            <Input
              label="Senha"
              type="password"
              placeholder="Mín. 8 chars, 1 maiúscula, 1 número"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              error={errors.senha}
            />

            <Select
              label="Perfil"
              value={tipo}
              onChange={(e) => setTipo(e.target.value as 'ALUNO' | 'DOCENTE')}
            >
              <option value="ALUNO">Aluno</option>
              <option value="DOCENTE">Docente</option>
            </Select>

            {tipo === 'ALUNO' && (
              <Select
                label="Área de Conhecimento"
                value={areaId}
                onChange={(e) => setAreaId(e.target.value)}
                error={errors.areaId}
              >
                <option value="">Selecione sua área...</option>
                {areas.map((a) => (
                  <option key={a.id} value={a.id}>{a.nome}</option>
                ))}
              </Select>
            )}

            <Button type="submit" isLoading={loading} className="w-full mt-2">
              Criar conta
            </Button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Já tem uma conta?{' '}
            <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
