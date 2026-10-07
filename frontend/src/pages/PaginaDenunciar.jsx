import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { useAuth } from '../contexts/authContext'
import { buscarDetalhesDoLocal } from '../services/locaisService'
import { registrarDenuncia } from '../services/denunciasService'
import FormularioDeDenuncia from '../components/FormularioDeDenuncia'

// Tela de denúncia de um pin ou de um comentário (RF26).
// Endereços: /local/:id/denunciar e /local/:id/comentarios/:idDoComentario/denunciar.
export default function PaginaDenunciar() {
  const { id, idDoComentario } = useParams()
  const { usuario } = useAuth()
  const navegar = useNavigate()
  const [resultado, setResultado] = useState(null)
  const enderecoDoLocal = `/local/${id}`

  useEffect(() => {
    document.title = 'Denunciar – Mapa TEA'
    buscarDetalhesDoLocal(id)
      .then((local) => setResultado({ local }))
      .catch(() => setResultado({ erro: true }))
  }, [id])

  const local = resultado?.local
  const comentario = idDoComentario
    ? local?.comentarios.find((item) => item.id === idDoComentario)
    : null
  // Só dá para denunciar conteúdo que está publicado.
  const naoEncontrado =
    resultado &&
    (resultado.erro || local.status !== 'aprovado' || (Boolean(idDoComentario) && !comentario))

  async function enviar(motivo) {
    await registrarDenuncia({ idDoPin: id, idDoComentario, motivo, idDoAutor: usuario.id })
    navegar(enderecoDoLocal, {
      state: { mensagem: 'Sua denúncia foi enviada e será analisada por um moderador.' },
    })
  }

  return (
    <main className="container py-4 pagina-media">
      <Link className="btn btn-outline-secondary btn-sm mb-3" to={naoEncontrado ? '/' : enderecoDoLocal}>
        <span aria-hidden="true">← </span>
        {naoEncontrado ? 'Voltar ao mapa' : 'Voltar ao local'}
      </Link>

      <h1 className="h3">{idDoComentario ? 'Denunciar comentário' : 'Denunciar local'}</h1>

      {!resultado && <p role="status">Carregando…</p>}

      {naoEncontrado && (
        <div className="alert alert-warning" role="alert">
          O conteúdo que você quer denunciar não foi encontrado ou já não está publicado.
        </div>
      )}

      {local && !naoEncontrado && (
        <>
          <section aria-labelledby="titulo-alvo" className="mb-3">
            <h2 id="titulo-alvo" className="h5">
              O que você está denunciando
            </h2>
            <dl className="mb-0">
              <dt>Local</dt>
              <dd>{local.nome}</dd>
              {comentario && (
                <>
                  <dt>Comentário</dt>
                  <dd>
                    <blockquote className="border-start ps-3 mb-0">
                      {comentario.texto}
                      <footer className="small text-body-secondary">{comentario.autor}</footer>
                    </blockquote>
                  </dd>
                </>
              )}
            </dl>
          </section>

          <FormularioDeDenuncia
            id="denuncia"
            tipoDoAlvo={comentario ? 'comentario' : 'pin'}
            descricaoDoAlvo={comentario ? `o comentário de ${comentario.autor}` : 'este local'}
            onEnviar={enviar}
            onCancelar={() => navegar(enderecoDoLocal)}
          />
        </>
      )}
    </main>
  )
}
