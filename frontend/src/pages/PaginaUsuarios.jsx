import { Link } from 'react-router'
import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/authContext'
import { alterarPapel, editarUsuario, excluirUsuario, listarUsuarios } from '../services/authService'

const NOME_DO_PAPEL = { moderador: 'Moderador', usuario: 'Usuário comum' }

function formatarData(iso) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// Uma conta na lista, com as ações do moderador: editar os dados (RF28),
// alterar o papel (RF29) e excluir (RF30).
function Conta({ conta, eVoce, onEditar, onAlterarPapel, onExcluir }) {
  // 'editar', 'excluir' ou null: qual ação está aberta nesta conta.
  const [acao, setAcao] = useState(null)
  const [nome, setNome] = useState(conta.nome)
  const eModerador = conta.papel === 'moderador'
  const idDoNome = `nome-${conta.id}`

  async function salvarNome(evento) {
    evento.preventDefault()
    if (await onEditar(conta, nome)) setAcao(null)
  }

  return (
    <li className="list-group-item">
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-2">
        <div>
          <h2 className="h6 mb-1">
            {conta.nome}
            {eVoce && ' (você)'}
          </h2>
          <div className="small text-body-secondary">
            Perfil: <strong className="text-body">{NOME_DO_PAPEL[conta.papel]}</strong> · Conta criada em{' '}
            {formatarData(conta.dataCadastro)}
          </div>
        </div>
      </div>

      {acao === 'editar' && (
        <form className="mt-2" onSubmit={salvarNome} noValidate>
          <label htmlFor={idDoNome} className="form-label">
            Nome
          </label>
          <input
            id={idDoNome}
            className="form-control"
            value={nome}
            onChange={(evento) => setNome(evento.target.value)}
            required
            autoFocus
          />
          <div className="d-flex flex-wrap gap-2 mt-2">
            <button type="submit" className="btn btn-primary btn-sm">
              Salvar nome
            </button>
            <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setAcao(null)}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      {acao === 'excluir' && (
        <div className="mt-2" role="group" aria-label="Confirmação da exclusão">
          <p className="fw-semibold mb-2">Tem certeza de que quer excluir a conta de {conta.nome}?</p>
          <div className="d-flex flex-wrap gap-2">
            <button type="button" className="btn btn-danger btn-sm" onClick={() => onExcluir(conta)}>
              Sim, excluir a conta
            </button>
            <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setAcao(null)}>
              Não, manter
            </button>
          </div>
        </div>
      )}

      {acao === null && (
        <div className="d-flex flex-wrap gap-2 mt-2">
          <button
            type="button"
            className="btn btn-outline-primary btn-sm"
            onClick={() => {
              setNome(conta.nome)
              setAcao('editar')
            }}
          >
            Editar nome<span className="visually-hidden"> de {conta.nome}</span>
          </button>
          {!eVoce && (
            <>
              <button
                type="button"
                className="btn btn-outline-primary btn-sm"
                onClick={() => onAlterarPapel(conta, eModerador ? 'usuario' : 'moderador')}
              >
                {eModerador ? 'Rebaixar a usuário comum' : 'Promover a moderador'}
                <span className="visually-hidden">: {conta.nome}</span>
              </button>
              <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => setAcao('excluir')}>
                Excluir<span className="visually-hidden"> a conta de {conta.nome}</span>
              </button>
            </>
          )}
        </div>
      )}

      {eVoce && (
        <p className="small text-body-secondary mt-2 mb-0">
          Você não pode alterar o próprio papel. Para excluir a sua conta, use a tela Minha conta.
        </p>
      )}
    </li>
  )
}

// Gerenciamento de usuários (módulo UserManagementPanel). Exclusivo do moderador.
// O e-mail das contas não é exibido: o moderador vê apenas o nome (RNF10).
export default function PaginaUsuarios() {
  const { usuario, recarregarUsuario } = useAuth()
  const [contas, setContas] = useState(null)
  const [resultado, setResultado] = useState(null)

  useEffect(() => {
    document.title = 'Usuários – Mapa TEA'
    listarUsuarios().then(setContas)
  }, [])

  // Executa uma ação, recarrega a lista e mostra o resultado em texto.
  async function executar(acao, textoDeSucesso) {
    try {
      await acao()
      setContas(await listarUsuarios())
      recarregarUsuario()
      setResultado({ texto: textoDeSucesso })
      return true
    } catch (falha) {
      setResultado({ erro: true, texto: falha.message })
      return false
    }
  }

  const editar = (conta, nome) =>
    executar(() => editarUsuario(conta.id, { nome }), `O nome foi alterado para "${nome.trim()}".`)

  const mudarPapel = (conta, papel) =>
    executar(
      () => alterarPapel(conta.id, papel, usuario.id),
      papel === 'moderador'
        ? `${conta.nome} foi promovido a moderador.`
        : `${conta.nome} foi rebaixado a usuário comum.`,
    )

  const excluir = (conta) =>
    executar(() => excluirUsuario(conta.id, usuario.id), `A conta de ${conta.nome} foi excluída.`)

  return (
    <main className="container py-4 pagina-media">
      <Link className="btn btn-outline-secondary btn-sm mb-3" to="/moderador">
        <span aria-hidden="true">← </span>Painel do moderador
      </Link>
      <h1 className="h3">Usuários{contas ? ` (${contas.length})` : ''}</h1>
      <p>Contas cadastradas no Mapa TEA. O e-mail dos usuários não é exibido.</p>

      <div role="status" aria-live="polite">
        {resultado && (
          <div className={`alert py-2 ${resultado.erro ? 'alert-danger' : 'alert-success'}`}>
            {resultado.texto}
          </div>
        )}
      </div>

      {contas === null && <p>Carregando os usuários…</p>}
      {contas && (
        <ul className="list-group">
          {contas.map((conta) => (
            <Conta
              key={conta.id}
              conta={conta}
              eVoce={conta.id === usuario.id}
              onEditar={editar}
              onAlterarPapel={mudarPapel}
              onExcluir={excluir}
            />
          ))}
        </ul>
      )}
    </main>
  )
}
