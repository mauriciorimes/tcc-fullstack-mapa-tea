import { useState } from 'react'
import { buscarEndereco } from '../services/enderecoService'

export default function BuscaEndereco({
  onEscolher,
  id = 'busca-endereco',
  rotulo = 'Ou informe onde você está',
}) {
  const [texto, setTexto] = useState('')
  const [resultados, setResultados] = useState(null)
  const [aproximados, setAproximados] = useState(false)
  const [buscando, setBuscando] = useState(false)
  const [erro, setErro] = useState('')

  async function buscar(evento) {
    evento.preventDefault()
    if (!texto.trim()) return
    setBuscando(true)
    setErro('')
    try {
      const busca = await buscarEndereco(texto.trim())
      setResultados(busca.enderecos)
      setAproximados(busca.aproximados)
    } catch (falha) {
      setErro(falha.message)
      setResultados(null)
    } finally {
      setBuscando(false)
    }
  }

  function escolher(resultado) {
    onEscolher(resultado)
    setResultados(null)
    setTexto('')
  }

  return (
    <div className="mt-3">
      <form onSubmit={buscar} role="search">
        <label htmlFor={id} className="form-label">
          {rotulo}
        </label>
        <div className="input-group">
          <input
            id={id}
            type="search"
            className="form-control"
            placeholder="Cidade, bairro ou endereço"
            value={texto}
            onChange={(evento) => setTexto(evento.target.value)}
          />
          <button type="submit" className="btn btn-outline-primary" disabled={buscando || !texto.trim()}>
            {buscando ? 'Buscando…' : 'Buscar'}
          </button>
        </div>
      </form>

      <div aria-live="polite">
        {erro && <div className="alert alert-warning py-2 mt-2 mb-0 small">{erro}</div>}

        {buscando && <p className="small mt-2 mb-0">Buscando o endereço…</p>}

        {/* RNF34: endereço não localizado pede nova digitação e oferece sugestões. */}
        {resultados?.length > 0 && aproximados && (
          <p className="small mt-2 mb-0">
            Não encontramos esse endereço. Digite de novo ou escolha um endereço próximo:
          </p>
        )}

        {resultados?.length === 0 && (
          <p className="small mt-2 mb-0">
            Não encontramos esse endereço. Confira o que foi digitado e tente de novo, por exemplo
            com o nome da cidade.
          </p>
        )}

        {resultados?.length > 0 && (
          <ul className="list-group mt-2">
            {resultados.map((resultado) => (
              <li key={resultado.id} className="list-group-item p-0">
                <button
                  type="button"
                  className="btn btn-link text-start text-decoration-none w-100 small"
                  onClick={() => escolher(resultado)}
                >
                  {resultado.nome}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
