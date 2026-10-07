import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router'
import { useAuth } from '../contexts/authContext'
import { excluirSolicitacao, listarMinhasSolicitacoes } from '../services/locaisService'
import { listarMinhasInclusoes } from '../services/inclusaoDeCategoriaService'
import { listarMinhasSugestoes } from '../services/sugestoesService'
import { categoriasDoLocal } from '../mocks/categorias'
import SimboloDaCategoria from '../components/SimboloDaCategoria'
import StatusBadge from '../components/StatusBadge'

function formatarDataHora(iso) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Uma solicitação do usuário, com o status e as ações permitidas em cada situação:
// pendente: editar (RF19) e excluir (RF20); rejeitada: ler o motivo e excluir;
// publicada: só consulta, porque a alteração passa a ser do moderador (RF56).
function Solicitacao({ solicitacao, onExcluir }) {
  const [confirmando, setConfirmando] = useState(false)
  const { status } = solicitacao

  return (
    <li className="card mb-3">
      <article className="card-body" aria-labelledby={`titulo-${solicitacao.id}`}>
        <div className="d-flex flex-wrap justify-content-between align-items-start gap-2">
          <h2 id={`titulo-${solicitacao.id}`} className="h5 card-title mb-0">
            {solicitacao.nome}
          </h2>
          <StatusBadge status={status} />
        </div>

        <dl className="mt-2 mb-2">
          <dt>Enviada em</dt>
          <dd>{solicitacao.criadoEm ? formatarDataHora(solicitacao.criadoEm) : 'Data não registrada'}</dd>
          {solicitacao.dataAnalise && (
            <>
              <dt>Analisada em</dt>
              <dd>{formatarDataHora(solicitacao.dataAnalise)}</dd>
            </>
          )}
          <dt>Categorias</dt>
          <dd>
            <ul className="list-unstyled mb-0">
              {categoriasDoLocal(solicitacao.categorias).map((categoria) => (
                <li key={categoria.id}>
                  <SimboloDaCategoria categoria={categoria} /> {categoria.nome}
                </li>
              ))}
            </ul>
          </dd>
        </dl>

        {status === 'rejeitado' && (
          <div className="alert alert-danger py-2">
            <strong>Motivo da rejeição:</strong> {solicitacao.motivoRejeicao}
          </div>
        )}
        {status === 'pendente' && (
          <p className="small text-body-secondary">
            A solicitação aparece no mapa depois de ser aprovada por um moderador.
          </p>
        )}
        {status === 'aprovado' && (
          <p className="small text-body-secondary">
            O local está publicado no mapa. A partir de agora, só o moderador pode alterá-lo.
          </p>
        )}
        {status === 'despublicado' && (
          <p className="small text-body-secondary">
            O local foi retirado do mapa por um moderador, depois da análise de uma denúncia.
          </p>
        )}

        {confirmando ? (
          <div role="group" aria-label="Confirmação da exclusão">
            <p className="fw-semibold">Tem certeza de que quer excluir esta solicitação?</p>
            <div className="d-flex flex-wrap gap-2">
              <button type="button" className="btn btn-danger" onClick={() => onExcluir(solicitacao)}>
                Sim, excluir
              </button>
              <button type="button" className="btn btn-outline-secondary" onClick={() => setConfirmando(false)}>
                Não, manter
              </button>
            </div>
          </div>
        ) : (
          <div className="d-flex flex-wrap gap-2">
            <Link className="btn btn-outline-primary btn-sm" to={`/local/${solicitacao.id}`}>
              Ver detalhes<span className="visually-hidden"> de {solicitacao.nome}</span>
            </Link>
            {status === 'pendente' && (
              <Link
                className="btn btn-outline-primary btn-sm"
                to={`/minhas-solicitacoes/${solicitacao.id}/editar`}
              >
                Editar<span className="visually-hidden"> {solicitacao.nome}</span>
              </Link>
            )}
            {(status === 'pendente' || status === 'rejeitado') && (
              <button
                type="button"
                className="btn btn-outline-danger btn-sm"
                onClick={() => setConfirmando(true)}
              >
                Excluir<span className="visually-hidden"> {solicitacao.nome}</span>
              </button>
            )}
          </div>
        )}
      </article>
    </li>
  )
}

// Acompanhamento das próprias solicitações (módulo RequestTrackingPage, RF21).
export default function PaginaMinhasSolicitacoes() {
  const { usuario } = useAuth()
  const { state } = useLocation()
  const [solicitacoes, setSolicitacoes] = useState(null)
  const [inclusoes, setInclusoes] = useState([])
  const [sugestoes, setSugestoes] = useState([])
  const [mensagem, setMensagem] = useState(state?.mensagem ?? '')

  useEffect(() => {
    document.title = 'Minhas solicitações – Mapa TEA'
    listarMinhasSolicitacoes(usuario.id).then(setSolicitacoes)
    listarMinhasInclusoes(usuario.id).then(setInclusoes)
    listarMinhasSugestoes(usuario.id).then(setSugestoes)
  }, [usuario.id])

  async function excluir(solicitacao) {
    await excluirSolicitacao(solicitacao.id, usuario.id)
    setSolicitacoes(await listarMinhasSolicitacoes(usuario.id))
    setMensagem(`A solicitação "${solicitacao.nome}" foi excluída.`)
  }

  return (
    <main className="container py-4 pagina-media">
      <h1 className="h3">Minhas solicitações</h1>
      <p>Aqui ficam os locais e os pedidos que você enviou, com a situação de cada um.</p>

      <div role="status" aria-live="polite">
        {mensagem && <div className="alert alert-success py-2">{mensagem}</div>}
      </div>

      <h2 className="h4">Locais enviados</h2>
      {solicitacoes === null && <p>Carregando as suas solicitações…</p>}
      {solicitacoes?.length === 0 && (
        <>
          <p>Você ainda não enviou nenhuma solicitação.</p>
          <Link className="btn btn-primary" to="/">
            Ir para o mapa e adicionar um local
          </Link>
        </>
      )}
      {solicitacoes?.length > 0 && (
        <ul className="list-unstyled">
          {solicitacoes.map((solicitacao) => (
            <Solicitacao key={solicitacao.id} solicitacao={solicitacao} onExcluir={excluir} />
          ))}
        </ul>
      )}

      {/* RF18 e RF21: pedidos de inclusão de categoria em locais já publicados. */}
      <h2 className="h4 mt-4">Inclusões de categoria</h2>
      {inclusoes.length === 0 ? (
        <p>Você ainda não pediu a inclusão de categoria em nenhum local.</p>
      ) : (
        <ul className="list-unstyled">
          {inclusoes.map((inclusao) => (
            <li className="card mb-3" key={inclusao.id}>
              <div className="card-body">
                <div className="d-flex flex-wrap justify-content-between align-items-start gap-2">
                  <h3 className="h6 card-title mb-0">
                    <SimboloDaCategoria categoria={inclusao.categoria} /> {inclusao.categoria.nome} em{' '}
                    <Link to={`/local/${inclusao.idDoPin}`}>{inclusao.nomeDoPin}</Link>
                  </h3>
                  <StatusBadge status={inclusao.status} />
                </div>
                <p className="small text-body-secondary mt-2 mb-0">
                  Pedido enviado em {formatarDataHora(inclusao.criadaEm)}.
                  {inclusao.dataAnalise && ` Analisado em ${formatarDataHora(inclusao.dataAnalise)}.`}
                </p>
                {inclusao.status === 'rejeitado' && (
                  <div className="alert alert-danger py-2 mt-2 mb-0">
                    <strong>Motivo da rejeição:</strong> {inclusao.motivoRejeicao}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* RF11 e RF21: sugestões de categorias que ainda não existem. */}
      <h2 className="h4 mt-4">Sugestões de categoria</h2>
      {sugestoes.length === 0 ? (
        <p>Você ainda não sugeriu nenhuma categoria nova.</p>
      ) : (
        <ul className="list-unstyled">
          {sugestoes.map((sugestao) => (
            <li className="card mb-3" key={sugestao.id}>
              <div className="card-body">
                <div className="d-flex flex-wrap justify-content-between align-items-start gap-2">
                  <h3 className="h6 card-title mb-0">{sugestao.nome}</h3>
                  <StatusBadge status={sugestao.status} />
                </div>
                <p className="small text-body-secondary mt-2 mb-0">
                  Sugestão enviada em {formatarDataHora(sugestao.criadaEm)}.
                  {sugestao.dataAnalise && ` Analisada em ${formatarDataHora(sugestao.dataAnalise)}.`}
                </p>
                {sugestao.status === 'rejeitado' && (
                  <div className="alert alert-danger py-2 mt-2 mb-0">
                    <strong>Motivo da rejeição:</strong> {sugestao.motivoRejeicao}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      <Link className="btn btn-outline-primary" to="/sugerir-categoria">
        Sugerir nova categoria
      </Link>
    </main>
  )
}
