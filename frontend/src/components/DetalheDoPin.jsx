import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import {
  atualizarFotosDoLocal,
  buscarDetalhesDoLocal,
  despublicarCategoriaDoLocal,
  excluirLocal,
} from '../services/locaisService'
import { confirmarInformacoes, minhasInteracoes } from '../services/interacoesService'
import { nomeDoMotivoDeRejeicao } from '../mocks/motivosDeRejeicaoDeComentario'
import CampoDeFotos from './CampoDeFotos'
import { useAuth } from '../contexts/authContext'
import { categorias, categoriasDoLocal } from '../mocks/categorias'
import SimboloDaCategoria from './SimboloDaCategoria'
import StatusBadge from './StatusBadge'

function formatarData(iso) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

function formatarNota(nota) {
  return nota.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
}

// Fotos do pin. Enquanto a solicitação está pendente, quem cadastrou pode
// adicionar e remover fotos (RF19); depois de publicada, só o moderador (RF56).
function FotosDoPin({ local, onAtualizar }) {
  const { usuario } = useAuth()
  const eDoAutor = Boolean(usuario) && local.idDoAutor === usuario.id
  const [editando, setEditando] = useState(false)
  const [rascunho, setRascunho] = useState([])
  const [erro, setErro] = useState('')
  const publicado = local.status === 'aprovado'

  function comecar() {
    setRascunho(local.fotos)
    setErro('')
    setEditando(true)
  }

  async function salvar() {
    try {
      onAtualizar(await atualizarFotosDoLocal(local.id, rascunho))
      setEditando(false)
    } catch (falha) {
      setErro(falha.message)
    }
  }

  return (
    <section aria-labelledby="titulo-fotos" className="mb-3">
      <h2 id="titulo-fotos" className="h5">
        Fotos
      </h2>

      {editando ? (
        <>
          <CampoDeFotos id="fotos-do-pin" fotos={rascunho} onMudar={setRascunho} />
          {erro && (
            <div className="alert alert-danger py-2 mt-2 mb-0" role="alert">
              {erro}
            </div>
          )}
          <div className="d-flex gap-2 mt-3">
            <button type="button" className="btn btn-primary btn-sm" onClick={salvar}>
              Salvar fotos
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={() => setEditando(false)}
            >
              Cancelar
            </button>
          </div>
        </>
      ) : (
        <>
          {local.fotos.length === 0 ? (
            <p className="mb-0">Sem fotos.</p>
          ) : (
            <ul className="list-unstyled row g-2 mb-0">
              {local.fotos.map((foto, indice) => (
                <li className="col-4" key={foto.url}>
                  <img
                    src={foto.url}
                    alt={`Foto ${indice + 1} de ${local.fotos.length}: ${foto.descricao}`}
                    className="foto-do-pin rounded border"
                  />
                </li>
              ))}
            </ul>
          )}
          {eDoAutor && publicado && (
            <p className="small text-body-secondary mt-2 mb-0">
              Este local já foi publicado. Só o moderador pode alterar as fotos.
            </p>
          )}
          {eDoAutor && !publicado && (
            <button type="button" className="btn btn-outline-primary btn-sm mt-2" onClick={comecar}>
              {local.fotos.length === 0 ? 'Adicionar fotos' : 'Editar fotos'}
            </button>
          )}
        </>
      )}
    </section>
  )
}

// Ações exclusivas do moderador sobre um pin publicado: editar (RF37) e
// excluir (RF38). A exclusão pede confirmação na própria tela.
function AcoesDoModerador({ local, onExcluir }) {
  const [confirmando, setConfirmando] = useState(false)

  return (
    <section aria-labelledby="titulo-moderador" className="border rounded p-3 mb-3">
      <h2 id="titulo-moderador" className="h5">
        Ações do moderador
      </h2>
      {confirmando ? (
        <div role="group" aria-label="Confirmação da exclusão">
          <p className="fw-semibold mb-2">Tem certeza de que quer excluir este pin?</p>
          <div className="d-flex flex-wrap gap-2">
            <button type="button" className="btn btn-danger btn-sm" onClick={onExcluir}>
              Sim, excluir o pin
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={() => setConfirmando(false)}
            >
              Não, manter
            </button>
          </div>
        </div>
      ) : (
        <div className="d-flex flex-wrap gap-2">
          <Link className="btn btn-outline-primary btn-sm" to={`/local/${local.id}/editar`}>
            Editar pin
          </Link>
          <button
            type="button"
            className="btn btn-outline-danger btn-sm"
            onClick={() => setConfirmando(true)}
          >
            Excluir pin
          </button>
        </div>
      )}
    </section>
  )
}

// Detalhes do pin (RF03): fotos, descrição, categorias, avaliações,
// comentários e data da última confirmação. A consulta é pública; confirmar,
// avaliar, comentar e denunciar exigem conta de usuário.
export default function DetalheDoPin({ idDoLocal, textoDaDistancia, onCarregar }) {
  // O resultado guarda o id consultado; enquanto ele for de outro local, a
  // tela mostra "Carregando".
  const [resultado, setResultado] = useState(null)
  // O que o usuário logado já fez neste pin: avaliação, comentários e confirmação.
  const [minhas, setMinhas] = useState(null)
  const [aviso, setAviso] = useState('')
  const [categoriaADespublicar, setCategoriaADespublicar] = useState(null)
  const { usuario, eModerador } = useAuth()
  // "state.mensagem" traz o aviso de outra tela, como a de denúncia enviada.
  const { pathname, state } = useLocation()
  const navegar = useNavigate()
  const titulo = useRef(null)

  const idDoUsuario = usuario?.id

  async function carregar() {
    const local = await buscarDetalhesDoLocal(idDoLocal)
    // Solicitações ainda não publicadas não aparecem na consulta pública:
    // só quem enviou e o moderador conseguem abrir.
    const podeVer =
      local.status === 'aprovado' || eModerador || (idDoUsuario && local.idDoAutor === idDoUsuario)
    if (!podeVer) throw new Error('Local não encontrado.')
    return { local, minhas: idDoUsuario ? await minhasInteracoes(idDoLocal, idDoUsuario) : null }
  }

  useEffect(() => {
    let cancelado = false
    carregar()
      .then((dados) => {
        if (cancelado) return
        setResultado({ id: idDoLocal, local: dados.local })
        setMinhas(dados.minhas)
        onCarregar?.(dados.local)
      })
      .catch((falha) => {
        if (cancelado) return
        setResultado({ id: idDoLocal, erro: falha.message })
        onCarregar?.(null)
      })
    return () => {
      cancelado = true
    }
    // A consulta se repete quando muda o local ou quem está logado.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idDoLocal, idDoUsuario, eModerador])

  const atual = resultado?.id === idDoLocal ? resultado : null
  const local = atual?.local
  const idCarregado = local?.id

  // Leva o foco ao título quando os detalhes aparecem, para leitores de tela e
  // para rolar a página até o conteúdo no celular.
  useEffect(() => {
    if (idCarregado) titulo.current?.focus()
  }, [idCarregado])

  // Relê os dados depois de uma ação feita nesta tela.
  async function atualizar(mensagem) {
    const dados = await carregar()
    setResultado({ id: idDoLocal, local: dados.local })
    setMinhas(dados.minhas)
    onCarregar?.(dados.local)
    setAviso(mensagem)
  }

  // RF25: confirma que as informações continuam corretas.
  async function confirmar() {
    if (!usuario) {
      navegar('/entrar', {
        state: { de: pathname, aviso: 'Entre na sua conta para confirmar as informações.' },
      })
      return
    }
    await confirmarInformacoes(idDoLocal, usuario.id)
    await atualizar('Obrigado. Sua confirmação foi registrada.')
  }

  // RF39: o moderador retira uma categoria e mantém as demais.
  async function despublicarCategoria(categoria) {
    setCategoriaADespublicar(null)
    await despublicarCategoriaDoLocal(idDoLocal, categoria.id)
    await atualizar(`A categoria "${categoria.nome}" foi despublicada deste pin.`)
  }

  async function excluirPin() {
    await excluirLocal(idDoLocal)
    navegar('/', { replace: true })
  }

  if (!atual) {
    return (
      <p role="status" className="mb-0">
        Carregando os detalhes do local…
      </p>
    )
  }

  if (atual.erro) {
    return (
      <div className="alert alert-warning" role="alert">
        {atual.erro}
      </div>
    )
  }

  const publicado = local.status === 'aprovado'
  const doLocal = categoriasDoLocal(local.categorias)
  // Comentários do próprio usuário que ainda não estão publicados.
  const meusNaoPublicados = (minhas?.comentarios ?? []).filter(
    (comentario) => comentario.status !== 'aprovado',
  )

  return (
    <article aria-labelledby="titulo-detalhe">
      <div role="status" aria-live="polite">
        {(aviso || state?.mensagem) && (
          <p className="alert alert-success py-2">{aviso || state.mensagem}</p>
        )}
      </div>

      <h1 id="titulo-detalhe" className="h3 mb-1" tabIndex={-1} ref={titulo}>
        {local.nome}
      </h1>
      <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
        <StatusBadge status={local.status} />
        {local.seloLocalidade && (
          <span className="badge text-bg-light border">
            <span aria-hidden="true">📍 </span>Selo de localidade
          </span>
        )}
        {textoDaDistancia && <span className="small text-body-secondary">{textoDaDistancia}</span>}
      </div>
      {local.seloLocalidade && (
        <p className="small text-body-secondary">
          O selo indica que quem cadastrou estava no local no momento do cadastro.
        </p>
      )}

      {eModerador && publicado && <AcoesDoModerador local={local} onExcluir={excluirPin} />}

      <section aria-labelledby="titulo-categorias" className="mb-3">
        <h2 id="titulo-categorias" className="h5">
          Categorias
        </h2>
        <ul className="list-unstyled mb-0">
          {doLocal.map((categoria) => (
            <li key={categoria.id} className="mb-1">
              <SimboloDaCategoria categoria={categoria} /> {categoria.nome}
              {/* RF39: despublicar uma categoria, mantendo as demais. */}
              {eModerador && publicado && categoriaADespublicar !== categoria.id && (
                <button
                  type="button"
                  className="btn btn-link btn-sm py-0"
                  onClick={() => setCategoriaADespublicar(categoria.id)}
                >
                  Despublicar<span className="visually-hidden"> a categoria {categoria.nome}</span>
                </button>
              )}
              {categoriaADespublicar === categoria.id && (
                <span className="d-block mt-1" role="group" aria-label="Confirmação">
                  {doLocal.length === 1
                    ? 'Esta é a única categoria. Sem ela, o pin sai do mapa. Despublicar mesmo assim? '
                    : `Despublicar "${categoria.nome}" deste pin? `}
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => despublicarCategoria(categoria)}
                  >
                    Sim, despublicar
                  </button>{' '}
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => setCategoriaADespublicar(null)}
                  >
                    Não
                  </button>
                </span>
              )}
            </li>
          ))}
        </ul>
        {/* RF18: pedir a inclusão de uma categoria que o local ainda não tem. */}
        {publicado && local.categorias.length < categorias.length && (
          <Link className="btn btn-outline-primary btn-sm mt-2" to={`/local/${idDoLocal}/incluir-categoria`}>
            Solicitar inclusão de categoria
          </Link>
        )}
      </section>

      <section aria-labelledby="titulo-descricao" className="mb-3">
        <h2 id="titulo-descricao" className="h5">
          Descrição
        </h2>
        <p className="mb-0">{local.descricao || 'Sem descrição.'}</p>
      </section>

      <FotosDoPin
        local={local}
        onAtualizar={(atualizado) => setResultado({ id: idDoLocal, local: atualizado })}
      />

      <section aria-labelledby="titulo-avaliacoes" className="mb-3">
        <h2 id="titulo-avaliacoes" className="h5">
          Avaliações
        </h2>
        {local.totalAvaliacoes === 0 ? (
          <p className="mb-1">Ainda não há avaliações.</p>
        ) : (
          <p className="mb-1">
            <span aria-hidden="true">★ </span>
            Nota média <strong>{formatarNota(local.notaMedia)} de 5</strong>, em{' '}
            {local.totalAvaliacoes} {local.totalAvaliacoes === 1 ? 'avaliação' : 'avaliações'}.
          </p>
        )}
        {minhas?.avaliacao && <p className="mb-1">Sua nota: {minhas.avaliacao.nota} de 5.</p>}
        {publicado && (
          <Link className="btn btn-outline-primary btn-sm" to={`/local/${idDoLocal}/avaliar`}>
            {minhas?.avaliacao ? 'Alterar minha avaliação' : 'Avaliar'}
          </Link>
        )}
      </section>

      <section aria-labelledby="titulo-confirmacao" className="mb-3">
        <h2 id="titulo-confirmacao" className="h5">
          Última confirmação
        </h2>
        <p className="mb-1">
          {local.dataUltimaConfirmacao
            ? `As informações foram confirmadas por um usuário em ${formatarData(local.dataUltimaConfirmacao)}.`
            : 'As informações ainda não foram confirmadas por outros usuários.'}
        </p>
        {publicado && (
          <button type="button" className="btn btn-outline-primary btn-sm" onClick={confirmar}>
            {minhas?.confirmou ? 'Confirmar de novo' : 'Confirmar que as informações estão corretas'}
          </button>
        )}
      </section>

      <section aria-labelledby="titulo-comentarios" className="mb-3">
        <h2 id="titulo-comentarios" className="h5">
          Comentários ({local.comentarios.length})
        </h2>
        {local.comentarios.length === 0 ? (
          <p className="mb-2">Ainda não há comentários.</p>
        ) : (
          <ul className="list-group mb-2">
            {local.comentarios.map((comentario) => (
              <li key={comentario.id} className="list-group-item">
                <div className="small text-body-secondary">
                  <strong className="text-body">{comentario.autor}</strong> em{' '}
                  {formatarData(comentario.data)}
                </div>
                {comentario.texto}
                <div className="d-flex flex-wrap gap-3">
                  {/* RF24: editar ou excluir o próprio comentário. */}
                  {comentario.idDoAutor && comentario.idDoAutor === idDoUsuario && (
                    <Link className="small" to={`/local/${idDoLocal}/comentarios/${comentario.id}/editar`}>
                      Editar ou excluir<span className="visually-hidden"> o meu comentário</span>
                    </Link>
                  )}
                  {/* RF26: a denúncia tem tela própria e exige conta de usuário. */}
                  <Link className="small" to={`/local/${idDoLocal}/comentarios/${comentario.id}/denunciar`}>
                    Denunciar<span className="visually-hidden"> o comentário de {comentario.autor}</span>
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* RF45: os comentários do próprio usuário que ainda não foram publicados. */}
        {meusNaoPublicados.length > 0 && (
          <>
            <h3 className="h6">Seus comentários em análise</h3>
            <ul className="list-group mb-2">
              {meusNaoPublicados.map((comentario) => (
                <li key={comentario.id} className="list-group-item">
                  <StatusBadge status={comentario.status} /> {comentario.texto}
                  {comentario.status === 'rejeitado' && (
                    <div className="small">
                      <strong>Motivo da rejeição:</strong>{' '}
                      {nomeDoMotivoDeRejeicao(comentario.motivoRejeicao)}
                    </div>
                  )}
                  <div>
                    <Link className="small" to={`/local/${idDoLocal}/comentarios/${comentario.id}/editar`}>
                      Editar ou excluir
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}

        {publicado && (
          <Link className="btn btn-outline-primary btn-sm" to={`/local/${idDoLocal}/comentar`}>
            Comentar
          </Link>
        )}
      </section>

      {publicado && (
        <section aria-labelledby="titulo-denunciar">
          <h2 id="titulo-denunciar" className="h5">
            Algo errado com este local?
          </h2>
          <Link className="btn btn-outline-primary btn-sm" to={`/local/${idDoLocal}/denunciar`}>
            Denunciar este local
          </Link>
        </section>
      )}
    </article>
  )
}
