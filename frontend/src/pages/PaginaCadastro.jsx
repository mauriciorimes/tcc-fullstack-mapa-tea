import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { useAuth } from '../contexts/authContext'
import { TAMANHO_MINIMO_DA_SENHA } from '../services/authService'

// Tela de criação de conta (RF04). Pede só o necessário: nome, e-mail e senha,
// além do aceite dos termos com a declaração de idade (RNF15).
export default function PaginaCadastro() {
  const { usuario, cadastrar } = useAuth()
  const navegar = useNavigate()
  const { state } = useLocation()
  const destino = state?.de ?? '/'

  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [aceitouTermos, setAceitouTermos] = useState(false)
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    document.title = 'Criar conta – Mapa TEA'
  }, [])

  async function enviar(evento) {
    evento.preventDefault()
    setErro('')
    setEnviando(true)
    try {
      await cadastrar({ nome, email, senha, aceitouTermos })
      navegar(destino, { replace: true })
    } catch (falha) {
      setErro(falha.message)
      setEnviando(false)
    }
  }

  if (usuario && !enviando) {
    return (
      <main className="container py-4 pagina-estreita">
        <h1 className="h3">Criar conta</h1>
        <p>Você já entrou como {usuario.nome}.</p>
        <Link className="btn btn-primary" to="/">
          Ir para o mapa
        </Link>
      </main>
    )
  }

  return (
    <main className="container py-4 pagina-estreita">
      <h1 className="h3">Criar conta</h1>
      <p>Com uma conta você pode cadastrar locais, avaliar, comentar e confirmar informações.</p>

      {erro && (
        <div className="alert alert-danger py-2" role="alert">
          {erro}
        </div>
      )}

      <form onSubmit={enviar} noValidate>
        <div className="mb-3">
          <label htmlFor="cadastro-nome" className="form-label">
            Nome
          </label>
          <input
            id="cadastro-nome"
            className="form-control"
            autoComplete="name"
            value={nome}
            onChange={(evento) => setNome(evento.target.value)}
            required
          />
        </div>

        <div className="mb-3">
          <label htmlFor="cadastro-email" className="form-label">
            E-mail
          </label>
          <input
            id="cadastro-email"
            type="email"
            className="form-control"
            autoComplete="email"
            value={email}
            onChange={(evento) => setEmail(evento.target.value)}
            aria-describedby="cadastro-email-ajuda"
            required
          />
          <div id="cadastro-email-ajuda" className="form-text">
            Usado só para entrar e para recuperar a senha. Não é exibido a outras pessoas.
          </div>
        </div>

        <div className="mb-3">
          <label htmlFor="cadastro-senha" className="form-label">
            Senha
          </label>
          <input
            id="cadastro-senha"
            type="password"
            className="form-control"
            autoComplete="new-password"
            minLength={TAMANHO_MINIMO_DA_SENHA}
            value={senha}
            onChange={(evento) => setSenha(evento.target.value)}
            aria-describedby="cadastro-senha-ajuda"
            required
          />
          <div id="cadastro-senha-ajuda" className="form-text">
            No mínimo {TAMANHO_MINIMO_DA_SENHA} caracteres.
          </div>
        </div>

        <div className="form-check mb-3">
          <input
            id="cadastro-termos"
            type="checkbox"
            className="form-check-input"
            checked={aceitouTermos}
            onChange={(evento) => setAceitouTermos(evento.target.checked)}
            required
          />
          <label htmlFor="cadastro-termos" className="form-check-label">
            Declaro que tenho 18 anos ou mais e aceito os termos de uso e a{' '}
            <Link to="/privacidade" target="_blank" rel="noopener">
              política de privacidade (abre em nova aba)
            </Link>
            .
          </label>
        </div>

        <button type="submit" className="btn btn-primary w-100" disabled={enviando}>
          {enviando ? 'Criando a conta…' : 'Criar conta'}
        </button>
      </form>

      <p className="mt-3 mb-0">
        Já tem conta?{' '}
        <Link to="/entrar" state={state}>
          Entrar
        </Link>
      </p>
    </main>
  )
}
