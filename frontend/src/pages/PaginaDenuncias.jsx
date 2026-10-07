import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { analisarDenuncia, listarDenunciasPendentes } from '../services/denunciasService'
import { nomeDoMotivo } from '../mocks/motivosDeDenuncia'

function formatarDataHora(iso) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Uma denúncia na fila, com o conteúdo denunciado e as duas decisões possíveis:
// manter ou despublicar (RF43).
function Denuncia({ denuncia, onDecidir }) {
  const eComentario = denuncia.tipoDoAlvo === 'comentario'

  return (
    <li className="card mb-3">
      <article className="card-body" aria-labelledby={`titulo-${denuncia.id}`}>
        <h3 id={`titulo-${denuncia.id}`} className="h5 card-title">
          {eComentario ? 'Comentário' : 'Pin'} denunciado: {nomeDoMotivo(denuncia.motivo)}
        </h3>

        <dl className="mb-2">
          <dt>Local</dt>
          <dd>
            {denuncia.nomeDoPin ? (
              <Link to={`/local/${denuncia.idDoPin}`}>{denuncia.nomeDoPin}</Link>
            ) : (
              'Local não encontrado.'
            )}
          </dd>
          {eComentario && (
            <>
              <dt>Comentário</dt>
              <dd>
                {denuncia.comentario ? (
                  <blockquote className="border-start ps-3 mb-0">
                    {denuncia.comentario.texto}
                    <footer className="small text-body-secondary">{denuncia.comentario.autor}</footer>
                  </blockquote>
                ) : (
                  'Comentário não encontrado.'
                )}
              </dd>
            </>
          )}
          <dt>Motivo</dt>
          <dd>{nomeDoMotivo(denuncia.motivo)}</dd>
          <dt>Denunciado por</dt>
          <dd>{denuncia.nomeDoDenunciante}</dd>
          <dt>Denunciado em</dt>
          <dd>{formatarDataHora(denuncia.criadaEm)}</dd>
        </dl>

        {denuncia.conteudoExiste ? (
          <div className="d-flex flex-wrap gap-2">
            <button type="button" className="btn btn-outline-primary" onClick={() => onDecidir(denuncia, 'manter')}>
              <span aria-hidden="true">✓ </span>Manter o conteúdo
            </button>
            <button type="button" className="btn btn-outline-danger" onClick={() => onDecidir(denuncia, 'despublicar')}>
              <span aria-hidden="true">✕ </span>Despublicar o conteúdo
            </button>
          </div>
        ) : (
          <>
            <p>O conteúdo denunciado já não está publicado.</p>
            <button type="button" className="btn btn-outline-primary" onClick={() => onDecidir(denuncia, 'manter')}>
              Encerrar a denúncia
            </button>
          </>
        )}
      </article>
    </li>
  )
}

// Painel de denúncias (módulo ReportPanel): listagem (RF42) e análise (RF43).
// Exclusivo do moderador.
export default function PaginaDenuncias() {
  const [denuncias, setDenuncias] = useState(null)
  const [mensagem, setMensagem] = useState('')

  useEffect(() => {
    document.title = 'Denúncias – Mapa TEA'
    listarDenunciasPendentes().then(setDenuncias)
  }, [])

  async function decidir(denuncia, decisao) {
    await analisarDenuncia(denuncia.id, decisao)
    setDenuncias(await listarDenunciasPendentes())
    const alvo = denuncia.tipoDoAlvo === 'comentario' ? 'O comentário' : 'O pin'
    setMensagem(
      decisao === 'despublicar'
        ? `${alvo} foi despublicado e a denúncia foi encerrada.`
        : `${alvo} foi mantido e a denúncia foi encerrada.`,
    )
  }

  return (
    <main className="container py-4 pagina-media">
      <Link className="btn btn-outline-secondary btn-sm mb-3" to="/moderador">
        <span aria-hidden="true">← </span>Painel do moderador
      </Link>
      <h1 className="h3">Denúncias</h1>

      <div role="status" aria-live="polite">
        {mensagem && <div className="alert alert-success py-2">{mensagem}</div>}
      </div>

      <section aria-labelledby="titulo-fila-denuncias">
        <h2 id="titulo-fila-denuncias" className="h4">
          Denúncias recebidas{denuncias ? ` (${denuncias.length})` : ''}
        </h2>

        {denuncias === null && <p>Carregando as denúncias…</p>}
        {denuncias?.length === 0 && <p>Não há denúncias aguardando análise.</p>}
        {denuncias?.length > 0 && (
          <ul className="list-unstyled">
            {denuncias.map((denuncia) => (
              <Denuncia key={denuncia.id} denuncia={denuncia} onDecidir={decidir} />
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
