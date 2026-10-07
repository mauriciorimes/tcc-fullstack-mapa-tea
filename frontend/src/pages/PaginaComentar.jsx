import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { useAuth } from '../contexts/authContext'
import { buscarDetalhesDoLocal } from '../services/locaisService'
import {
  TAMANHO_MAXIMO_DO_COMENTARIO,
  buscarMeuComentario,
  editarComentario,
  excluirComentario,
  publicarComentario,
} from '../services/interacoesService'

// Tela para publicar um comentário em um pin (RF22) e para editar ou excluir o
// próprio comentário (RF24). O comentário passa pela moderação antes de aparecer (RF45).
// Endereços: /local/:id/comentar e /local/:id/comentarios/:idDoComentario/editar.
export default function PaginaComentar() {
  const { id, idDoComentario } = useParams()
  const { usuario } = useAuth()
  const navegar = useNavigate()
  const [resultado, setResultado] = useState(null)
  const [texto, setTexto] = useState('')
  const [erro, setErro] = useState('')
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false)
  const editando = Boolean(idDoComentario)
  const enderecoDoLocal = `/local/${id}`

  useEffect(() => {
    document.title = `${idDoComentario ? 'Editar comentário' : 'Comentar'} – Mapa TEA`
    Promise.all([
      buscarDetalhesDoLocal(id),
      idDoComentario ? buscarMeuComentario(idDoComentario, usuario.id) : null,
    ])
      .then(([local, comentario]) => {
        setResultado({ local })
        if (comentario) setTexto(comentario.texto)
      })
      .catch(() => setResultado({ erro: true }))
  }, [id, idDoComentario, usuario.id])

  const local = resultado?.local
  const naoEncontrado = resultado && (resultado.erro || local.status !== 'aprovado')

  function voltarComMensagem(mensagem) {
    navegar(enderecoDoLocal, { state: { mensagem } })
  }

  async function enviar(evento) {
    evento.preventDefault()
    try {
      if (editando) await editarComentario(idDoComentario, usuario.id, texto)
      else await publicarComentario({ idDoPin: id, idDoAutor: usuario.id, texto })
      voltarComMensagem('Seu comentário foi enviado para moderação. Ele aparece depois de aprovado.')
    } catch (falha) {
      setErro(falha.message)
    }
  }

  async function excluir() {
    await excluirComentario(idDoComentario, usuario.id)
    voltarComMensagem('Seu comentário foi excluído.')
  }

  return (
    <main className="container py-4 pagina-media">
      <Link className="btn btn-outline-secondary btn-sm mb-3" to={naoEncontrado ? '/' : enderecoDoLocal}>
        <span aria-hidden="true">← </span>
        {naoEncontrado ? 'Voltar ao mapa' : 'Voltar ao local'}
      </Link>

      <h1 className="h3">{editando ? 'Editar comentário' : 'Comentar'}</h1>

      {!resultado && <p role="status">Carregando…</p>}

      {naoEncontrado && (
        <div className="alert alert-warning" role="alert">
          O local ou o comentário não foi encontrado.
        </div>
      )}

      {local && !naoEncontrado && (
        <form onSubmit={enviar} noValidate>
          <label htmlFor="texto-do-comentario" className="form-label">
            Seu comentário sobre {local.nome}
          </label>
          <textarea
            id="texto-do-comentario"
            className="form-control"
            rows="4"
            maxLength={TAMANHO_MAXIMO_DO_COMENTARIO}
            value={texto}
            onChange={(evento) => setTexto(evento.target.value)}
            aria-describedby="texto-do-comentario-ajuda"
            required
          />
          <div id="texto-do-comentario-ajuda" className="form-text">
            {texto.length} de {TAMANHO_MAXIMO_DO_COMENTARIO} caracteres. O comentário é analisado por
            um moderador antes de aparecer.
            {editando && ' Ao salvar, ele volta para a análise.'}
          </div>

          {erro && (
            <div className="alert alert-danger py-2 mt-2 mb-0" role="alert">
              {erro}
            </div>
          )}

          {confirmandoExclusao ? (
            <div className="mt-3" role="group" aria-label="Confirmação da exclusão">
              <p className="fw-semibold mb-2">Tem certeza de que quer excluir este comentário?</p>
              <div className="d-flex flex-wrap gap-2">
                <button type="button" className="btn btn-danger" onClick={excluir}>
                  Sim, excluir
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setConfirmandoExclusao(false)}
                >
                  Não, manter
                </button>
              </div>
            </div>
          ) : (
            <div className="d-flex flex-wrap gap-2 mt-3">
              <button type="submit" className="btn btn-primary">
                {editando ? 'Salvar comentário' : 'Enviar comentário'}
              </button>
              <button type="button" className="btn btn-outline-secondary" onClick={() => navegar(enderecoDoLocal)}>
                Cancelar
              </button>
              {editando && (
                <button
                  type="button"
                  className="btn btn-outline-danger"
                  onClick={() => setConfirmandoExclusao(true)}
                >
                  Excluir comentário
                </button>
              )}
            </div>
          )}
        </form>
      )}
    </main>
  )
}
