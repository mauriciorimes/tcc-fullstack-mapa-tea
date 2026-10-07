import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { useAuth } from '../contexts/authContext'

// Tela de login (RF05). Quem tenta uma ação que exige conta é trazido para cá
// e, depois de entrar, volta para a tela em que estava.
export default function PaginaEntrar() {
  const { usuario, entrar } = useAuth()
  const navegar = useNavigate()
  const { state } = useLocation()
  const destino = state?.de ?? '/'

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    document.title = 'Entrar – Mapa TEA'
  }, [])

  async function enviar(evento) {
    evento.preventDefault()
    setErro('')
    setEnviando(true)
    try {
      await entrar(email, senha)
      navegar(destino, { replace: true })
    } catch (falha) {
      setErro(falha.message)
      setEnviando(false)
    }
  }

  if (usuario && !enviando) {
    return (
      <main className="container py-4 pagina-estreita">
        <h1 className="h3">Entrar</h1>
        <p>Você já entrou como {usuario.nome}.</p>
        <Link className="btn btn-primary" to="/">
          Ir para o mapa
        </Link>
      </main>
    )
  }

  return (
    <main className="container py-4 pagina-estreita">
      <h1 className="h3">Entrar</h1>

      {state?.aviso && <p className="alert alert-info py-2">{state.aviso}</p>}
      {erro && (
        <div className="alert alert-danger py-2" role="alert">
          {erro}
        </div>
      )}

      <form onSubmit={enviar} noValidate>
        <div className="mb-3">
          <label htmlFor="entrar-email" className="form-label">
            E-mail
          </label>
          <input
            id="entrar-email"
            type="email"
            className="form-control"
            autoComplete="email"
            value={email}
            onChange={(evento) => setEmail(evento.target.value)}
            required
          />
        </div>

        <div className="mb-3">
          <label htmlFor="entrar-senha" className="form-label">
            Senha
          </label>
          <input
            id="entrar-senha"
            type="password"
            className="form-control"
            autoComplete="current-password"
            value={senha}
            onChange={(evento) => setSenha(evento.target.value)}
            required
          />
        </div>

        <button type="submit" className="btn btn-primary w-100" disabled={enviando}>
          {enviando ? 'Entrando…' : 'Entrar'}
        </button>
      </form>

      <ul className="list-unstyled mt-3 mb-0">
        <li>
          <Link to="/recuperar-senha">Esqueci minha senha</Link>
        </li>
        <li>
          Ainda não tem conta?{' '}
          <Link to="/cadastro" state={state}>
            Criar conta
          </Link>
        </li>
      </ul>
    </main>
  )
}
