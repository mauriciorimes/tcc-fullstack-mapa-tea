import { useState } from 'react'
import { motivosPara } from '../mocks/motivosDeDenuncia'

// Formulário de denúncia de um pin ou de um comentário (RF26).
// O motivo é escolhido em uma lista pré-definida, que depende do tipo de alvo
// ('pin' ou 'comentario').
export default function FormularioDeDenuncia({
  id,
  tipoDoAlvo,
  descricaoDoAlvo,
  onEnviar,
  onCancelar,
}) {
  const [motivo, setMotivo] = useState('')
  const [erro, setErro] = useState('')

  async function enviar(evento) {
    evento.preventDefault()
    if (!motivo) {
      setErro('Selecione o motivo da denúncia.')
      return
    }
    try {
      await onEnviar(motivo)
    } catch (falha) {
      setErro(falha.message)
    }
  }

  return (
    <form onSubmit={enviar} noValidate>
      <fieldset>
        <legend className="h5">Motivo da denúncia</legend>
        <p className="mb-2">
          Escolha por que você está denunciando {descricaoDoAlvo}. A denúncia é analisada por um
          moderador.
        </p>
        {motivosPara(tipoDoAlvo).map((opcao) => (
          <div className="form-check" key={opcao.id}>
            <input
              id={`${id}-${opcao.id}`}
              type="radio"
              name={`${id}-motivo`}
              className="form-check-input"
              checked={motivo === opcao.id}
              onChange={() => setMotivo(opcao.id)}
            />
            <label htmlFor={`${id}-${opcao.id}`} className="form-check-label">
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
        <button type="submit" className="btn btn-primary">
          Enviar denúncia
        </button>
        <button type="button" className="btn btn-outline-secondary" onClick={onCancelar}>
          Cancelar
        </button>
      </div>
    </form>
  )
}
