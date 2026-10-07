import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { solicitarRecuperacao } from '../services/authService'

// Primeira etapa da recuperação de senha (RF06): o usuário informa o e-mail e
// recebe um link para criar uma senha nova.
export default function PaginaRecuperarSenha() {
  const [email, setEmail] = useState('')
  const [erro, setErro] = useState('')
  const [pedido, setPedido] = useState(null)

  useEffect(() => {
    document.title = 'Recuperar senha – Mapa TEA'
  }, [])

  async function enviar(evento) {
    evento.preventDefault()
    if (!email.includes('@')) {
      setErro('Informe um e-mail válido.')
      return
    }
    setErro('')
    setPedido({ codigo: await solicitarRecuperacao(email) })
  }

  return (
    <main className="container py-4 pagina-estreita">
      <h1 className="h3">Recuperar senha</h1>

      {pedido ? (
        <div role="status">
          {/* A mesma mensagem com ou sem conta, para não revelar quais e-mails estão cadastrados. */}
          <p className="alert alert-success">
            Se existir uma conta com esse e-mail, enviamos um link para criar uma senha nova. O link
            vale por uma hora.
          </p>
          {pedido.codigo && (
            <p className="alert alert-secondary">
              <strong>Demonstração:</strong> como ainda não há envio de e-mail, o link aparece aqui.{' '}
              <Link to={`/redefinir-senha/${pedido.codigo}`}>Abrir o link de recuperação</Link>
            </p>
          )}
          <Link to="/entrar">Voltar para Entrar</Link>
        </div>
      ) : (
        <>
          <p>Informe o e-mail da sua conta. Você receberá um link para criar uma senha nova.</p>

          {erro && (
            <div className="alert alert-danger py-2" role="alert">
              {erro}
            </div>
          )}

          <form onSubmit={enviar} noValidate>
            <div className="mb-3">
              <label htmlFor="recuperar-email" className="form-label">
                E-mail
              </label>
              <input
                id="recuperar-email"
                type="email"
                className="form-control"
                autoComplete="email"
                value={email}
                onChange={(evento) => setEmail(evento.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary w-100">
              Enviar link
            </button>
          </form>

          <p className="mt-3 mb-0">
            <Link to="/entrar">Voltar para Entrar</Link>
          </p>
        </>
      )}
    </main>
  )
}
