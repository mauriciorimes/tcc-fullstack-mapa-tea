import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../contexts/authContext'
import { TAMANHO_MINIMO_DA_SENHA } from '../services/authService'

// Mensagem de resultado de cada formulário: sucesso em verde, erro em vermelho.
function Resultado({ resultado }) {
  return (
    <div aria-live="polite">
      {resultado && (
        <div className={`alert py-2 ${resultado.erro ? 'alert-danger' : 'alert-success'}`}>
          {resultado.texto}
        </div>
      )}
    </div>
  )
}

// RF09: o usuário edita os dados do próprio perfil.
function DadosDoPerfil() {
  const { usuario, atualizarPerfil } = useAuth()
  const [nome, setNome] = useState(usuario.nome)
  const [email, setEmail] = useState(usuario.email)
  const [resultado, setResultado] = useState(null)

  async function enviar(evento) {
    evento.preventDefault()
    try {
      await atualizarPerfil({ nome, email })
      setResultado({ texto: 'Seus dados foram salvos.' })
    } catch (falha) {
      setResultado({ erro: true, texto: falha.message })
    }
  }

  return (
    <section className="card mb-4" aria-labelledby="titulo-perfil">
      <form className="card-body" onSubmit={enviar} noValidate>
        <h2 id="titulo-perfil" className="h5 card-title">
          Meus dados
        </h2>
        <Resultado resultado={resultado} />

        <div className="mb-3">
          <label htmlFor="conta-nome" className="form-label">
            Nome
          </label>
          <input
            id="conta-nome"
            className="form-control"
            autoComplete="name"
            value={nome}
            onChange={(evento) => setNome(evento.target.value)}
            required
          />
        </div>

        <div className="mb-3">
          <label htmlFor="conta-email" className="form-label">
            E-mail
          </label>
          <input
            id="conta-email"
            type="email"
            className="form-control"
            autoComplete="email"
            value={email}
            onChange={(evento) => setEmail(evento.target.value)}
            aria-describedby="conta-email-ajuda"
            required
          />
          <div id="conta-email-ajuda" className="form-text">
            Usado só para entrar e para recuperar a senha. Não é exibido a outras pessoas.
          </div>
        </div>

        <button type="submit" className="btn btn-primary">
          Salvar dados
        </button>
      </form>
    </section>
  )
}

// RF07: o usuário altera a própria senha.
function TrocaDeSenha() {
  const { trocarSenha } = useAuth()
  const [senhaAtual, setSenhaAtual] = useState('')
  const [senhaNova, setSenhaNova] = useState('')
  const [resultado, setResultado] = useState(null)

  async function enviar(evento) {
    evento.preventDefault()
    try {
      await trocarSenha(senhaAtual, senhaNova)
      setSenhaAtual('')
      setSenhaNova('')
      setResultado({ texto: 'Sua senha foi alterada.' })
    } catch (falha) {
      setResultado({ erro: true, texto: falha.message })
    }
  }

  return (
    <section className="card mb-4" aria-labelledby="titulo-senha">
      <form className="card-body" onSubmit={enviar} noValidate>
        <h2 id="titulo-senha" className="h5 card-title">
          Alterar senha
        </h2>
        <Resultado resultado={resultado} />

        <div className="mb-3">
          <label htmlFor="conta-senha-atual" className="form-label">
            Senha atual
          </label>
          <input
            id="conta-senha-atual"
            type="password"
            className="form-control"
            autoComplete="current-password"
            value={senhaAtual}
            onChange={(evento) => setSenhaAtual(evento.target.value)}
            required
          />
        </div>

        <div className="mb-3">
          <label htmlFor="conta-senha-nova" className="form-label">
            Senha nova
          </label>
          <input
            id="conta-senha-nova"
            type="password"
            className="form-control"
            autoComplete="new-password"
            minLength={TAMANHO_MINIMO_DA_SENHA}
            value={senhaNova}
            onChange={(evento) => setSenhaNova(evento.target.value)}
            aria-describedby="conta-senha-nova-ajuda"
            required
          />
          <div id="conta-senha-nova-ajuda" className="form-text">
            No mínimo {TAMANHO_MINIMO_DA_SENHA} caracteres.
          </div>
        </div>

        <button type="submit" className="btn btn-primary">
          Alterar senha
        </button>
      </form>
    </section>
  )
}

// RF10 e RNF13: o usuário exclui a própria conta direto no sistema, sem
// precisar pedir a um moderador. A exclusão pede uma confirmação na própria tela.
function ExclusaoDaConta() {
  const { excluirConta } = useAuth()
  const navegar = useNavigate()
  const [confirmando, setConfirmando] = useState(false)
  const [erro, setErro] = useState('')

  async function excluir() {
    try {
      await excluirConta()
      navegar('/', { replace: true })
    } catch (falha) {
      setErro(falha.message)
    }
  }

  return (
    <section className="card border-danger-subtle" aria-labelledby="titulo-excluir">
      <div className="card-body">
        <h2 id="titulo-excluir" className="h5 card-title">
          Excluir minha conta
        </h2>
        <p>
          A exclusão é definitiva. Seu nome, seu e-mail e sua senha são apagados, e você deixa de
          poder entrar com esta conta.
        </p>

        {erro && (
          <div className="alert alert-danger py-2" role="alert">
            {erro}
          </div>
        )}

        {confirmando ? (
          <div role="group" aria-label="Confirmação da exclusão">
            <p className="fw-semibold">Tem certeza de que quer excluir a conta?</p>
            <div className="d-flex flex-wrap gap-2">
              <button type="button" className="btn btn-danger" onClick={excluir}>
                Sim, excluir minha conta
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setConfirmando(false)}
              >
                Não, manter a conta
              </button>
            </div>
          </div>
        ) : (
          <button type="button" className="btn btn-outline-danger" onClick={() => setConfirmando(true)}>
            Excluir minha conta
          </button>
        )}
      </div>
    </section>
  )
}

// Tela de gerenciamento da própria conta (módulo UserPage).
export default function PaginaMinhaConta() {
  const { eModerador } = useAuth()

  useEffect(() => {
    document.title = 'Minha conta – Mapa TEA'
  }, [])

  return (
    <main className="container py-4 pagina-media">
      <h1 className="h3">Minha conta</h1>
      <p>
        Perfil: <strong>{eModerador ? 'moderador' : 'usuário'}</strong>
      </p>

      <DadosDoPerfil />
      <TrocaDeSenha />
      <ExclusaoDaConta />
    </main>
  )
}
