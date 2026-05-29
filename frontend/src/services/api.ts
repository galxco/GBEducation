import axios from 'axios'

const api = axios.create({
  baseURL: '/',
  headers: { 'Content-Type': 'application/json' },
})

// Injeta JWT em todas as requisições
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('gbEducationToken')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Trata 401 — redireciona para login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('gbEducationToken')
      localStorage.removeItem('gbEducationUsuario')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
