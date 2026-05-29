import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth, rotaPorPerfil } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { Button, Input } from '../../components/common'

export default function Login() {
  const [email, setEmail]     = useState('')
  const [senha, setSenha]     = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors]   = useState<{ email?: string; senha?: string }>({})

  const { login } = useAuth()
  const { toast } = useToast()
  const navigate  = useNavigate()

  const validate = () => {
    const e: typeof errors = {}
    if (!email) e.email = 'E-mail é obrigatório.'
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'E-mail inválido.'
    if (!senha) e.senha = 'Senha é obrigatória.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      await login({ email, senha })
      const u = JSON.parse(localStorage.getItem('gbEducationUsuario') ?? '{}')
      navigate(rotaPorPerfil(u.tipo), { replace: true })
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { mensagem?: string } } })
        ?.response?.data?.mensagem ?? 'Erro ao fazer login.'
      toast('error', msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Glow bg */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96
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
          <p className="text-slate-500 text-sm mt-1">Plataforma de materiais acadêmicos</p>
        </div>

        {/* Card */}
        <div className="card p-8">
          <h2 className="font-display text-lg font-semibold text-white mb-6">
            Entrar na plataforma
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="E-mail"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              icon={
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              }
            />

            <Input
              label="Senha"
              type="password"
              placeholder="••••••••"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              error={errors.senha}
              icon={
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0110 0v4"/>
                </svg>
              }
            />

            <Button type="submit" isLoading={loading} className="w-full mt-2">
              Entrar
            </Button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Não tem uma conta?{' '}
            <Link to="/cadastro" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
              Cadastre-se
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
