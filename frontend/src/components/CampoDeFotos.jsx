import { useState } from 'react'
import {
  MAXIMO_DE_FOTOS,
  TAMANHO_MAXIMO_MB,
  TIPOS_ACEITOS_NO_CAMPO,
  prepararFoto,
  validarFoto,
} from '../utils/fotos'

// Campo para anexar até três fotos a um pin (RF15), com a lista das fotos já
// escolhidas e um botão para remover cada uma.
export default function CampoDeFotos({ id, fotos, onMudar }) {
  const [erro, setErro] = useState('')
  const [lendo, setLendo] = useState(false)
  const vagas = MAXIMO_DE_FOTOS - fotos.length

  async function adicionar(evento) {
    const arquivos = [...evento.target.files]
    // Limpa o campo para permitir escolher o mesmo arquivo de novo.
    evento.target.value = null
    if (arquivos.length === 0) return

    if (arquivos.length > vagas) {
      setErro(`Você pode enviar no máximo ${MAXIMO_DE_FOTOS} fotos. Escolha até ${vagas}.`)
      return
    }
    const problema = arquivos.map(validarFoto).find(Boolean)
    if (problema) {
      setErro(problema)
      return
    }

    setErro('')
    setLendo(true)
    try {
      const novas = await Promise.all(arquivos.map(prepararFoto))
      onMudar([...fotos, ...novas])
    } catch (falha) {
      setErro(falha.message)
    } finally {
      setLendo(false)
    }
  }

  function remover(indice) {
    setErro('')
    onMudar(fotos.filter((_, posicao) => posicao !== indice))
  }

  return (
    <div>
      <label htmlFor={id} className="form-label">
        Fotos ({fotos.length} de {MAXIMO_DE_FOTOS})
      </label>
      <input
        id={id}
        type="file"
        className="form-control"
        accept={TIPOS_ACEITOS_NO_CAMPO}
        multiple
        disabled={vagas === 0 || lendo}
        onChange={adicionar}
        aria-describedby={`${id}-ajuda`}
      />
      <div id={`${id}-ajuda`} className="form-text">
        Até {MAXIMO_DE_FOTOS} fotos, em JPG, JPEG ou PNG, com no máximo {TAMANHO_MAXIMO_MB} MB cada.
      </div>

      <div aria-live="polite">
        {lendo && <p className="small mt-2 mb-0">Carregando as fotos…</p>}
        {erro && <div className="alert alert-danger py-2 mt-2 mb-0">{erro}</div>}
      </div>

      {fotos.length > 0 && (
        <ul className="list-unstyled row g-2 mt-1 mb-0">
          {fotos.map((foto, indice) => (
            <li className="col-4" key={foto.url}>
              <img
                src={foto.url}
                alt={`Foto ${indice + 1} de ${fotos.length}: ${foto.descricao}`}
                className="foto-do-pin rounded border"
              />
              <button
                type="button"
                className="btn btn-outline-danger btn-sm w-100 mt-1"
                onClick={() => remover(indice)}
              >
                Remover<span className="visually-hidden"> a foto {indice + 1}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
