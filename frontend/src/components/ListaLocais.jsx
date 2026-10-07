import StatusBadge from './StatusBadge'
import { textoDaDistancia } from '../utils/distancia'

export default function ListaLocais({
  locais,
  mensagemVazia,
  onVerDetalhes,
  onVerNoMapa,
}) {
  if (locais.length === 0) {
    return <p className="text-body-secondary">{mensagemVazia}</p>
  }

  return (
    <ul className="list-group">
      {locais.map((local) => (
        <li key={local.id} className="list-group-item">
          <div className="d-flex justify-content-between align-items-start gap-2">
            <strong>{local.nome}</strong>
            <StatusBadge status={local.status} />
          </div>
          {local.distanciaKm != null && (
            <div className="small text-body-secondary">{textoDaDistancia(local)}</div>
          )}
          <div className="d-flex flex-wrap gap-2 mt-2">
            <button
              type="button"
              className="btn btn-sm btn-primary"
              onClick={() => onVerDetalhes(local)}
              aria-label={`Ver detalhes de ${local.nome}`}
            >
              Ver detalhes
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline-primary"
              onClick={() => onVerNoMapa(local)}
            >
              Ver no mapa
            </button>
          </div>
        </li>
      ))}
    </ul>
  )
}
