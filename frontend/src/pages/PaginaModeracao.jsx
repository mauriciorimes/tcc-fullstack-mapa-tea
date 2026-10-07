import { useEffect, useState } from 'react'
import {
  aprovarSolicitacao,
  listarSolicitacoesPendentes,
  rejeitarSolicitacao,
} from '../services/locaisService'
import { categoriasDoLocal } from '../mocks/categorias'
import SimboloDaCategoria from '../components/SimboloDaCategoria'
import MapaDoLocal from '../components/MapaDoLocal'
import { Link } from 'react-router'
import {
  aprovarComentario,
  listarComentariosPendentes,
  rejeitarComentario,
} from '../services/interacoesService'
import { listarLocais } from '../services/locaisService'
import { motivosDeRejeicaoDeComentario } from '../mocks/motivosDeRejeicaoDeComentario'
import {
  aprovarSugestao,
  listarSugestoesPendentes,
  rejeitarSugestao,
} from '../services/sugestoesService'
import {
  aprovarInclusao,
  listarInclusoesPendentes,
  rejeitarInclusao,
} from '../services/inclusaoDeCategoriaService'

function formatarDataHora(iso) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Uma solicitação de pin na fila, com as informações enviadas pelo usuário e
// as ações de aprovar (RF33) e rejeitar com motivo (RF34).
function Solicitacao({ solicitacao, onAprovar, onRejeitar }) {
  const [rejeitando, setRejeitando] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [erro, setErro] = useState('')
  const idDoMotivo = `motivo-${solicitacao.id}`

  function confirmarRejeicao(evento) {
    evento.preventDefault()
    if (!motivo.trim()) {
      setErro('Informe o motivo da rejeição. Ele será mostrado a quem enviou a solicitação.')
      return
    }
    onRejeitar(solicitacao, motivo.trim())
  }

  return (
    <li className="card mb-3">
      <article className="card-body" aria-labelledby={`titulo-${solicitacao.id}`}>
        <div className="row g-3">
          <div className="col-md-7">
            <h3 id={`titulo-${solicitacao.id}`} className="h5 card-title">
              <Link to={`/local/${solicitacao.id}`}>{solicitacao.nome}</Link>
            </h3>
            <dl className="mb-2">
              <dt>Enviada por</dt>
              <dd>{solicitacao.nomeDoAutor}</dd>
              <dt>Enviada em</dt>
              <dd>{solicitacao.criadoEm ? formatarDataHora(solicitacao.criadoEm) : 'Data não registrada'}</dd>
              <dt>Verificação de presença</dt>
              <dd>
                {!solicitacao.seloSolicitado && 'O selo de localidade não foi solicitado.'}
                {solicitacao.seloSolicitado && solicitacao.seloLocalidade && (
                  <>
                    <span aria-hidden="true">✓ </span>Selo concedido: quem enviou estava no local.
                  </>
                )}
                {solicitacao.seloSolicitado && !solicitacao.seloLocalidade && (
                  <>
                    <span aria-hidden="true">✕ </span>Selo não concedido: a presença no local não foi
                    confirmada.
                  </>
                )}
              </dd>
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
              <dt>Descrição</dt>
              <dd>{solicitacao.descricao || 'Sem descrição.'}</dd>
              <dt>Fotos</dt>
              <dd>
                {(solicitacao.fotos ?? []).length === 0 ? (
                  'Sem fotos.'
                ) : (
                  <ul className="list-unstyled row g-2 mb-0">
                    {solicitacao.fotos.map((foto, indice) => (
                      <li className="col-4" key={foto.url}>
                        <img
                          src={foto.url}
                          alt={`Foto ${indice + 1} de ${solicitacao.fotos.length}: ${foto.descricao}`}
                          className="foto-do-pin rounded border"
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </dd>
            </dl>
          </div>

          <div className="col-md-5">
            <MapaDoLocal local={solicitacao} />
            <p className="small text-body-secondary mt-2 mb-0">
              Coordenadas: {solicitacao.latitude.toFixed(5)}, {solicitacao.longitude.toFixed(5)}
            </p>
          </div>
        </div>

        {rejeitando ? (
          <form className="mt-3" onSubmit={confirmarRejeicao} noValidate>
            <label htmlFor={idDoMotivo} className="form-label">
              Motivo da rejeição
            </label>
            <textarea
              id={idDoMotivo}
              className="form-control"
              rows="2"
              value={motivo}
              onChange={(evento) => setMotivo(evento.target.value)}
              aria-describedby={`${idDoMotivo}-ajuda`}
              required
              autoFocus
            />
            <div id={`${idDoMotivo}-ajuda`} className="form-text">
              O motivo é mostrado a quem enviou a solicitação.
            </div>
            {erro && (
              <div className="alert alert-danger py-2 mt-2 mb-0" role="alert">
                {erro}
              </div>
            )}
            <div className="d-flex flex-wrap gap-2 mt-3">
              <button type="submit" className="btn btn-danger">
                Confirmar rejeição
              </button>
              <button type="button" className="btn btn-outline-secondary" onClick={() => setRejeitando(false)}>
                Cancelar
              </button>
            </div>
          </form>
        ) : (
          <div className="d-flex flex-wrap gap-2 mt-3">
            <button type="button" className="btn btn-success" onClick={() => onAprovar(solicitacao)}>
              <span aria-hidden="true">✓ </span>Aprovar
              <span className="visually-hidden"> {solicitacao.nome}</span>
            </button>
            <button type="button" className="btn btn-outline-danger" onClick={() => setRejeitando(true)}>
              <span aria-hidden="true">✕ </span>Rejeitar
              <span className="visually-hidden"> {solicitacao.nome}</span>
            </button>
          </div>
        )}
      </article>
    </li>
  )
}

// Um grupo de pedidos de inclusão da mesma categoria no mesmo pin, com a
// contagem de usuários que pediram (RF32) e as ações de aprovar (RF35) e
// rejeitar com motivo (RF36).
function Inclusao({ grupo, onAprovar, onRejeitar }) {
  const [rejeitando, setRejeitando] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [erro, setErro] = useState('')
  const idDoMotivo = `motivo-${grupo.chave.replace('|', '-')}`
  const nomeDoPin = grupo.pin?.nome ?? 'Local não encontrado'

  function confirmarRejeicao(evento) {
    evento.preventDefault()
    if (!motivo.trim()) {
      setErro('Informe o motivo da rejeição. Ele será mostrado a quem enviou o pedido.')
      return
    }
    onRejeitar(grupo, motivo.trim())
  }

  return (
    <li className="card mb-3">
      <article className="card-body">
        <h3 className="h5 card-title">
          Incluir <SimboloDaCategoria categoria={grupo.categoria} /> {grupo.categoria.nome} em{' '}
          {grupo.pin ? <Link to={`/local/${grupo.idDoPin}`}>{nomeDoPin}</Link> : nomeDoPin}
        </h3>
        <dl className="mb-2">
          <dt>Pedidos recebidos</dt>
          <dd>
            {grupo.quantidade} {grupo.quantidade === 1 ? 'usuário pediu' : 'usuários pediram'} esta inclusão.
          </dd>
          <dt>Categorias atuais do local</dt>
          <dd>
            <ul className="list-unstyled mb-0">
              {categoriasDoLocal(grupo.pin?.categorias ?? []).map((categoria) => (
                <li key={categoria.id}>
                  <SimboloDaCategoria categoria={categoria} /> {categoria.nome}
                </li>
              ))}
            </ul>
          </dd>
          <dt>Primeiro pedido em</dt>
          <dd>{formatarDataHora(grupo.primeiraEm)}</dd>
        </dl>

        {rejeitando ? (
          <form onSubmit={confirmarRejeicao} noValidate>
            <label htmlFor={idDoMotivo} className="form-label">
              Motivo da rejeição
            </label>
            <textarea
              id={idDoMotivo}
              className="form-control"
              rows="2"
              value={motivo}
              onChange={(evento) => setMotivo(evento.target.value)}
              required
              autoFocus
            />
            {erro && (
              <div className="alert alert-danger py-2 mt-2 mb-0" role="alert">
                {erro}
              </div>
            )}
            <div className="d-flex flex-wrap gap-2 mt-3">
              <button type="submit" className="btn btn-danger">
                Confirmar rejeição
              </button>
              <button type="button" className="btn btn-outline-secondary" onClick={() => setRejeitando(false)}>
                Cancelar
              </button>
            </div>
          </form>
        ) : (
          <div className="d-flex flex-wrap gap-2">
            <button type="button" className="btn btn-success" onClick={() => onAprovar(grupo)}>
              <span aria-hidden="true">✓ </span>Aprovar inclusão
            </button>
            <button type="button" className="btn btn-outline-danger" onClick={() => setRejeitando(true)}>
              <span aria-hidden="true">✕ </span>Rejeitar
            </button>
          </div>
        )}
      </article>
    </li>
  )
}

// Um comentário aguardando análise. O moderador aprova (RF40) ou rejeita,
// escolhendo o motivo em uma lista pré-definida (RF41).
function Comentario({ comentario, onAprovar, onRejeitar }) {
  const [rejeitando, setRejeitando] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [erro, setErro] = useState('')

  function confirmarRejeicao(evento) {
    evento.preventDefault()
    if (!motivo) {
      setErro('Selecione o motivo da rejeição.')
      return
    }
    onRejeitar(comentario, motivo)
  }

  return (
    <li className="card mb-3">
      <article className="card-body">
        <h3 className="h5 card-title">
          Comentário em{' '}
          {comentario.nomeDoPin ? (
            <Link to={`/local/${comentario.idDoPin}`}>{comentario.nomeDoPin}</Link>
          ) : (
            'local não encontrado'
          )}
        </h3>
        <blockquote className="border-start ps-3">{comentario.texto}</blockquote>
        <p className="small text-body-secondary">
          Enviado por {comentario.nomeDoAutor} em {formatarDataHora(comentario.criadoEm)}.
        </p>

        {rejeitando ? (
          <form onSubmit={confirmarRejeicao} noValidate>
            <fieldset>
              <legend className="fs-6 fw-semibold">Motivo da rejeição</legend>
              {motivosDeRejeicaoDeComentario.map((opcao) => (
                <div className="form-check" key={opcao.id}>
                  <input
                    id={`${comentario.id}-${opcao.id}`}
                    type="radio"
                    name={`${comentario.id}-motivo`}
                    className="form-check-input"
                    checked={motivo === opcao.id}
                    onChange={() => setMotivo(opcao.id)}
                  />
                  <label htmlFor={`${comentario.id}-${opcao.id}`} className="form-check-label">
                    {opcao.nome}
                  </label>
                </div>
              ))}
            </fieldset>
            {erro && (
              <div className="alert alert-danger py-2 mt-2 mb-0" role="alert">
                {erro}
              </div>
            )}
            <div className="d-flex flex-wrap gap-2 mt-3">
              <button type="submit" className="btn btn-danger">
                Confirmar rejeição
              </button>
              <button type="button" className="btn btn-outline-secondary" onClick={() => setRejeitando(false)}>
                Cancelar
              </button>
            </div>
          </form>
        ) : (
          <div className="d-flex flex-wrap gap-2">
            <button type="button" className="btn btn-success" onClick={() => onAprovar(comentario)}>
              Aprovar comentário
            </button>
            <button type="button" className="btn btn-outline-danger" onClick={() => setRejeitando(true)}>
              Rejeitar
            </button>
          </div>
        )}
      </article>
    </li>
  )
}

// Uma sugestão de nova categoria (RF11). Aprovada, ela passa a existir no sistema.
function Sugestao({ sugestao, onAprovar, onRejeitar }) {
  const [rejeitando, setRejeitando] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [erro, setErro] = useState('')
  const idDoMotivo = `motivo-${sugestao.id}`

  function confirmarRejeicao(evento) {
    evento.preventDefault()
    if (!motivo.trim()) {
      setErro('Informe o motivo da rejeição. Ele será mostrado a quem enviou a sugestão.')
      return
    }
    onRejeitar(sugestao, motivo.trim())
  }

  return (
    <li className="card mb-3">
      <article className="card-body">
        <h3 className="h5 card-title">Nova categoria: {sugestao.nome}</h3>
        <dl className="mb-2">
          <dt>Justificativa</dt>
          <dd>{sugestao.justificativa || 'Não informada.'}</dd>
          <dt>Sugerida por</dt>
          <dd>
            {sugestao.nomeDoAutor} em {formatarDataHora(sugestao.criadaEm)}
          </dd>
        </dl>

        {rejeitando ? (
          <form onSubmit={confirmarRejeicao} noValidate>
            <label htmlFor={idDoMotivo} className="form-label">
              Motivo da rejeição
            </label>
            <textarea
              id={idDoMotivo}
              className="form-control"
              rows="2"
              value={motivo}
              onChange={(evento) => setMotivo(evento.target.value)}
              required
              autoFocus
            />
            {erro && (
              <div className="alert alert-danger py-2 mt-2 mb-0" role="alert">
                {erro}
              </div>
            )}
            <div className="d-flex flex-wrap gap-2 mt-3">
              <button type="submit" className="btn btn-danger">
                Confirmar rejeição
              </button>
              <button type="button" className="btn btn-outline-secondary" onClick={() => setRejeitando(false)}>
                Cancelar
              </button>
            </div>
          </form>
        ) : (
          <div className="d-flex flex-wrap gap-2">
            <button type="button" className="btn btn-success" onClick={() => onAprovar(sugestao)}>
              Aprovar e criar a categoria
            </button>
            <button type="button" className="btn btn-outline-danger" onClick={() => setRejeitando(true)}>
              Rejeitar
            </button>
          </div>
        )}
      </article>
    </li>
  )
}

// Comentários pendentes, já com o nome do local de cada um.
async function carregarComentarios() {
  const [pendentes, locais] = await Promise.all([listarComentariosPendentes(), listarLocais()])
  return pendentes.map((comentario) => ({
    ...comentario,
    nomeDoPin: locais.find((local) => local.id === comentario.idDoPin)?.nome ?? null,
  }))
}

// Painel de moderação (módulo ModerationPanel): filas das solicitações de pin
// (RF31), dos pedidos de inclusão de categoria (RF32) e dos comentários (RF40).
// Exclusivo do moderador.
export default function PaginaModeracao() {
  const [solicitacoes, setSolicitacoes] = useState(null)
  const [inclusoes, setInclusoes] = useState(null)
  const [comentarios, setComentarios] = useState(null)
  const [sugestoes, setSugestoes] = useState(null)
  const [mensagem, setMensagem] = useState('')

  useEffect(() => {
    document.title = 'Moderação – Mapa TEA'
    listarSolicitacoesPendentes().then(setSolicitacoes)
    listarInclusoesPendentes().then(setInclusoes)
    carregarComentarios().then(setComentarios)
    listarSugestoesPendentes().then(setSugestoes)
  }, [])

  async function aprovarCategoriaNova(sugestao) {
    await aprovarSugestao(sugestao.id)
    setSugestoes(await listarSugestoesPendentes())
    setMensagem(`A categoria "${sugestao.nome}" foi criada e já pode ser usada nos locais.`)
  }

  async function rejeitarCategoriaNova(sugestao, motivo) {
    await rejeitarSugestao(sugestao.id, motivo)
    setSugestoes(await listarSugestoesPendentes())
    setMensagem(`A sugestão "${sugestao.nome}" foi rejeitada. O motivo ficou registrado para quem sugeriu.`)
  }

  async function aprovarTexto(comentario) {
    await aprovarComentario(comentario.id)
    setComentarios(await carregarComentarios())
    setMensagem('O comentário foi aprovado e publicado.')
  }

  async function rejeitarTexto(comentario, motivo) {
    await rejeitarComentario(comentario.id, motivo)
    setComentarios(await carregarComentarios())
    setMensagem('O comentário foi rejeitado. O motivo ficou registrado para quem escreveu.')
  }

  async function aprovarCategoria(grupo) {
    await aprovarInclusao(grupo.idDoPin, grupo.idDaCategoria)
    setInclusoes(await listarInclusoesPendentes())
    setMensagem(`A categoria "${grupo.categoria.nome}" foi incluída em "${grupo.pin?.nome}".`)
  }

  async function rejeitarCategoria(grupo, motivo) {
    await rejeitarInclusao(grupo.idDoPin, grupo.idDaCategoria, motivo)
    setInclusoes(await listarInclusoesPendentes())
    setMensagem(
      `O pedido de inclusão de "${grupo.categoria.nome}" foi rejeitado. O motivo ficou registrado para quem pediu.`,
    )
  }

  async function aprovar(solicitacao) {
    await aprovarSolicitacao(solicitacao.id)
    setSolicitacoes(await listarSolicitacoesPendentes())
    setMensagem(`"${solicitacao.nome}" foi aprovado e publicado no mapa.`)
  }

  async function rejeitar(solicitacao, motivo) {
    await rejeitarSolicitacao(solicitacao.id, motivo)
    setSolicitacoes(await listarSolicitacoesPendentes())
    setMensagem(`"${solicitacao.nome}" foi rejeitado. O motivo ficou registrado para quem enviou.`)
  }

  return (
    <main className="container py-4">
      <Link className="btn btn-outline-secondary btn-sm mb-3" to="/moderador">
        <span aria-hidden="true">← </span>Painel do moderador
      </Link>
      <h1 className="h3">Moderação</h1>

      <div role="status" aria-live="polite">
        {mensagem && <div className="alert alert-success py-2">{mensagem}</div>}
      </div>

      <section aria-labelledby="titulo-fila-pins">
        <h2 id="titulo-fila-pins" className="h4">
          Solicitações de pin{solicitacoes ? ` (${solicitacoes.length})` : ''}
        </h2>

        {solicitacoes === null && <p>Carregando as solicitações…</p>}
        {solicitacoes?.length === 0 && <p>Não há solicitações de pin pendentes.</p>}
        {solicitacoes?.length > 0 && (
          <ul className="list-unstyled">
            {solicitacoes.map((solicitacao) => (
              <Solicitacao
                key={solicitacao.id}
                solicitacao={solicitacao}
                onAprovar={aprovar}
                onRejeitar={rejeitar}
              />
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="titulo-fila-categorias" className="mt-4">
        <h2 id="titulo-fila-categorias" className="h4">
          Inclusões de categoria{inclusoes ? ` (${inclusoes.length})` : ''}
        </h2>

        {inclusoes === null && <p>Carregando os pedidos…</p>}
        {inclusoes?.length === 0 && <p>Não há pedidos de inclusão de categoria pendentes.</p>}
        {inclusoes?.length > 0 && (
          <ul className="list-unstyled">
            {inclusoes.map((grupo) => (
              <Inclusao
                key={grupo.chave}
                grupo={grupo}
                onAprovar={aprovarCategoria}
                onRejeitar={rejeitarCategoria}
              />
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="titulo-fila-comentarios" className="mt-4">
        <h2 id="titulo-fila-comentarios" className="h4">
          Comentários{comentarios ? ` (${comentarios.length})` : ''}
        </h2>

        {comentarios === null && <p>Carregando os comentários…</p>}
        {comentarios?.length === 0 && <p>Não há comentários pendentes.</p>}
        {comentarios?.length > 0 && (
          <ul className="list-unstyled">
            {comentarios.map((comentario) => (
              <Comentario
                key={comentario.id}
                comentario={comentario}
                onAprovar={aprovarTexto}
                onRejeitar={rejeitarTexto}
              />
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="titulo-fila-sugestoes" className="mt-4">
        <h2 id="titulo-fila-sugestoes" className="h4">
          Sugestões de categoria{sugestoes ? ` (${sugestoes.length})` : ''}
        </h2>

        {sugestoes === null && <p>Carregando as sugestões…</p>}
        {sugestoes?.length === 0 && <p>Não há sugestões de categoria pendentes.</p>}
        {sugestoes?.length > 0 && (
          <ul className="list-unstyled">
            {sugestoes.map((sugestao) => (
              <Sugestao
                key={sugestao.id}
                sugestao={sugestao}
                onAprovar={aprovarCategoriaNova}
                onRejeitar={rejeitarCategoriaNova}
              />
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
