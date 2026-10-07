import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { useAuth } from '../contexts/authContext'
import { buscarDetalhesDoLocal } from '../services/locaisService'
import { categoriasJaSolicitadas, solicitarInclusao } from '../services/inclusaoDeCategoriaService'
import { categorias, categoriasDoLocal } from '../mocks/categorias'
import SimboloDaCategoria from '../components/SimboloDaCategoria'

// Solicitação de inclusão de categoria em pin já publicado (módulo
// CategoryRequestForm, RF18). Endereço: /local/:id/incluir-categoria.
// É um formulário reduzido: o usuário só marca as categorias que faltam no local.
export default function PaginaIncluirCategoria() {
  const { id } = useParams()
  const { usuario } = useAuth()
  const navegar = useNavigate()
  const [resultado, setResultado] = useState(null)
  const [selecionadas, setSelecionadas] = useState([])
  const [erro, setErro] = useState('')
  const enderecoDoLocal = `/local/${id}`

  useEffect(() => {
    document.title = 'Incluir categoria – Mapa TEA'
    Promise.all([buscarDetalhesDoLocal(id), categoriasJaSolicitadas(id, usuario.id)])
      .then(([local, jaSolicitadas]) => setResultado({ local, jaSolicitadas }))
      .catch(() => setResultado({ erro: true }))
  }, [id, usuario.id])

  const local = resultado?.local
  const naoEncontrado = resultado && (resultado.erro || local.status !== 'aprovado')
  const faltantes = local ? categorias.filter((categoria) => !local.categorias.includes(categoria.id)) : []
  const disponiveis = faltantes.filter((categoria) => !resultado.jaSolicitadas.includes(categoria.id))

  function alternar(idDaCategoria) {
    setSelecionadas((atuais) =>
      atuais.includes(idDaCategoria)
        ? atuais.filter((item) => item !== idDaCategoria)
        : [...atuais, idDaCategoria],
    )
  }

  async function enviar(evento) {
    evento.preventDefault()
    try {
      await solicitarInclusao({ idDoPin: id, idsDasCategorias: selecionadas, idDoAutor: usuario.id })
      navegar(enderecoDoLocal, {
        state: {
          mensagem:
            'Seu pedido de inclusão de categoria foi enviado para moderação. Acompanhe em Minhas solicitações.',
        },
      })
    } catch (falha) {
      setErro(falha.message)
    }
  }

  return (
    <main className="container py-4 pagina-media">
      <Link className="btn btn-outline-secondary btn-sm mb-3" to={naoEncontrado ? '/' : enderecoDoLocal}>
        <span aria-hidden="true">← </span>
        {naoEncontrado ? 'Voltar ao mapa' : 'Voltar ao local'}
      </Link>

      <h1 className="h3">Incluir categoria</h1>

      {!resultado && <p role="status">Carregando…</p>}

      {naoEncontrado && (
        <div className="alert alert-warning" role="alert">
          Este local não foi encontrado ou não está publicado.
        </div>
      )}

      {local && !naoEncontrado && (
        <>
          <section aria-labelledby="titulo-local-atual" className="mb-3">
            <h2 id="titulo-local-atual" className="h5">
              {local.nome}
            </h2>
            <p className="mb-1">Categorias que este local já tem:</p>
            <ul className="list-unstyled mb-0">
              {categoriasDoLocal(local.categorias).map((categoria) => (
                <li key={categoria.id}>
                  <SimboloDaCategoria categoria={categoria} /> {categoria.nome}
                </li>
              ))}
            </ul>
          </section>

          {faltantes.length === 0 && <p>Este local já tem todas as categorias.</p>}

          <p className="small">
            A categoria que você procura não existe?{' '}
            <Link to="/sugerir-categoria">Sugerir nova categoria</Link>
          </p>

          {faltantes.length > 0 && disponiveis.length === 0 && (
            <p>
              Você já pediu a inclusão das categorias que faltam neste local. Os pedidos estão em
              análise.
            </p>
          )}

          {disponiveis.length > 0 && (
            <form onSubmit={enviar} noValidate>
              <fieldset>
                <legend className="h5">Categorias a incluir</legend>
                <p className="mb-2">
                  Marque as categorias que este local também oferece. O pedido é analisado por um
                  moderador antes de aparecer no mapa.
                </p>
                {faltantes.map((categoria) => {
                  const jaPedida = resultado.jaSolicitadas.includes(categoria.id)
                  return (
                    <div className="form-check" key={categoria.id}>
                      <input
                        id={`incluir-${categoria.id}`}
                        type="checkbox"
                        className="form-check-input"
                        checked={selecionadas.includes(categoria.id)}
                        onChange={() => alternar(categoria.id)}
                        disabled={jaPedida}
                      />
                      <label htmlFor={`incluir-${categoria.id}`} className="form-check-label">
                        <SimboloDaCategoria categoria={categoria} /> {categoria.nome}
                        {jaPedida && ' (você já pediu; em análise)'}
                      </label>
                    </div>
                  )
                })}
              </fieldset>

              {erro && (
                <div className="alert alert-danger py-2 mt-2 mb-0" role="alert">
                  {erro}
                </div>
              )}

              <div className="d-flex flex-wrap gap-2 mt-3">
                <button type="submit" className="btn btn-primary">
                  Enviar pedido
                </button>
                <button type="button" className="btn btn-outline-secondary" onClick={() => navegar(enderecoDoLocal)}>
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </>
      )}
    </main>
  )
}
