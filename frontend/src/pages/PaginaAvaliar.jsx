import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { useAuth } from '../contexts/authContext'
import { buscarDetalhesDoLocal } from '../services/locaisService'
import {
  NOTA_MAXIMA,
  excluirAvaliacao,
  minhasInteracoes,
  salvarAvaliacao,
} from '../services/interacoesService'

const NOTAS = Array.from({ length: NOTA_MAXIMA }, (_, indice) => indice + 1)
const DESCRICAO_DA_NOTA = { 1: 'muito ruim', 2: 'ruim', 3: 'regular', 4: 'bom', 5: 'muito bom' }

// Tela de avaliação de um pin publicado (RF23). Serve também para alterar ou
// excluir a própria avaliação (RF24). A avaliação é publicada na hora (RF45).
// Endereço: /local/:id/avaliar.
export default function PaginaAvaliar() {
  const { id } = useParams()
  const { usuario } = useAuth()
  const navegar = useNavigate()
  const [resultado, setResultado] = useState(null)
  const [nota, setNota] = useState(null)
  const [erro, setErro] = useState('')
  const enderecoDoLocal = `/local/${id}`

  useEffect(() => {
    document.title = 'Avaliar – Mapa TEA'
    Promise.all([buscarDetalhesDoLocal(id), minhasInteracoes(id, usuario.id)])
      .then(([local, minhas]) => {
        setResultado({ local, avaliacaoAtual: minhas.avaliacao })
        setNota(minhas.avaliacao?.nota ?? null)
      })
      .catch(() => setResultado({ erro: true }))
  }, [id, usuario.id])

  const local = resultado?.local
  const naoEncontrado = resultado && (resultado.erro || local.status !== 'aprovado')

  function voltarComMensagem(mensagem) {
    navegar(enderecoDoLocal, { state: { mensagem } })
  }

  async function enviar(evento) {
    evento.preventDefault()
    try {
      await salvarAvaliacao({ idDoPin: id, idDoAutor: usuario.id, nota })
      voltarComMensagem('Sua avaliação foi registrada.')
    } catch (falha) {
      setErro(falha.message)
    }
  }

  async function excluir() {
    await excluirAvaliacao(id, usuario.id)
    voltarComMensagem('Sua avaliação foi excluída.')
  }

  return (
    <main className="container py-4 pagina-media">
      <Link className="btn btn-outline-secondary btn-sm mb-3" to={naoEncontrado ? '/' : enderecoDoLocal}>
        <span aria-hidden="true">← </span>
        {naoEncontrado ? 'Voltar ao mapa' : 'Voltar ao local'}
      </Link>

      <h1 className="h3">Avaliar local</h1>

      {!resultado && <p role="status">Carregando…</p>}

      {naoEncontrado && (
        <div className="alert alert-warning" role="alert">
          Este local não foi encontrado ou não está publicado.
        </div>
      )}

      {local && !naoEncontrado && (
        <form onSubmit={enviar} noValidate>
          <fieldset>
            <legend className="h5">Sua nota para {local.nome}</legend>
            <p className="mb-2">
              Escolha uma nota de 1 a {NOTA_MAXIMA}. A avaliação aparece na hora, sem passar pela
              moderação.
            </p>
            {NOTAS.map((valor) => (
              <div className="form-check" key={valor}>
                <input
                  id={`nota-${valor}`}
                  type="radio"
                  name="nota"
                  className="form-check-input"
                  checked={nota === valor}
                  onChange={() => setNota(valor)}
                />
                <label htmlFor={`nota-${valor}`} className="form-check-label">
                  {valor} – {DESCRICAO_DA_NOTA[valor]}
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
            <button type="submit" className="btn btn-primary">
              {resultado.avaliacaoAtual ? 'Salvar nova nota' : 'Enviar avaliação'}
            </button>
            <button type="button" className="btn btn-outline-secondary" onClick={() => navegar(enderecoDoLocal)}>
              Cancelar
            </button>
            {resultado.avaliacaoAtual && (
              <button type="button" className="btn btn-outline-danger" onClick={excluir}>
                Excluir minha avaliação
              </button>
            )}
          </div>
        </form>
      )}
    </main>
  )
}
