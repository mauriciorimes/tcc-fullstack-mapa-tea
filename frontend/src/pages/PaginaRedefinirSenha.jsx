import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { redefinirSenha, TAMANHO_MINIMO_DA_SENHA } from '../services/authService'

// Segunda etapa da recuperação de senha (RF06): a tela aberta pelo link
// recebido, onde o usuário cria a senha nova.
export default function PaginaRedefinirSenha() {
  const { codigo } = useParams()
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [concluido, setConcluido] = useState(false)

  useEffect(() => {
    document.title = 'Criar senha nova – Mapa TEA'
  }, [])

  async function enviar(evento) {
    evento.preventDefault()
    try {
      await redefinirSenha(codigo, senha)
      setConcluido(true)
    } catch (falha) {
      setErro(falha.message)
    }
  }

  return (
    <main className="container py-4 pagina-estreita">
      <h1 className="h3">Criar senha nova</h1>

      {concluido ? (
        <div role="status">
          <p className="alert alert-success">Sua senha foi alterada.</p>
          <Link className="btn btn-primary" to="/entrar">
            Entrar
          </Link>
        </div>
      ) : (
        <>
          {erro && (
            <div className="alert alert-danger py-2" role="alert">
              {erro}
            </div>
          )}

          <form onSubmit={enviar} noValidate>
            <div className="mb-3">
              <label htmlFor="senha-nova" className="form-label">
                Senha nova
              </label>
              <input
                id="senha-nova"
                type="password"
                className="form-control"
                autoComplete="new-password"
                minLength={TAMANHO_MINIMO_DA_SENHA}
                value={senha}
                onChange={(evento) => setSenha(evento.target.value)}
                aria-describedby="senha-nova-ajuda"
                required
              />
              <div id="senha-nova-ajuda" className="form-text">
                No mínimo {TAMANHO_MINIMO_DA_SENHA} caracteres.
              </div>
            </div>
            <button type="submit" className="btn btn-primary w-100">
              Salvar senha nova
            </button>
          </form>

          <p className="mt-3 mb-0">
            <Link to="/recuperar-senha">Pedir um link novo</Link>
          </p>
        </>
      )}
    </main>
  )
}
