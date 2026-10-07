import { categorias } from '../mocks/categorias'
import SimboloDaCategoria from './SimboloDaCategoria'

// Filtro dos pins do mapa por categoria (RF02). Com mais de uma categoria
// marcada, aparecem os locais que têm todas elas.
export default function FiltroDeCategorias({ selecionadas, onMudar }) {
  function alternar(id) {
    onMudar(
      selecionadas.includes(id) ? selecionadas.filter((item) => item !== id) : [...selecionadas, id],
    )
  }

  return (
    <fieldset className="card mb-3">
      <div className="card-body">
        <legend className="h6 card-title">Filtrar por categoria</legend>
        {categorias.map((categoria) => (
          <div className="form-check" key={categoria.id}>
            <input
              id={`filtro-${categoria.id}`}
              type="checkbox"
              className="form-check-input"
              checked={selecionadas.includes(categoria.id)}
              onChange={() => alternar(categoria.id)}
            />
            <label htmlFor={`filtro-${categoria.id}`} className="form-check-label">
              <SimboloDaCategoria categoria={categoria} /> {categoria.nome}
            </label>
          </div>
        ))}
        <p className="small text-body-secondary mt-2 mb-0">
          {selecionadas.length === 0
            ? 'Sem filtro: todos os locais aparecem.'
            : 'Aparecem os locais que têm todas as categorias marcadas.'}
        </p>
        {selecionadas.length > 0 && (
          <button type="button" className="btn btn-link btn-sm px-0" onClick={() => onMudar([])}>
            Limpar filtro
          </button>
        )}
      </div>
    </fieldset>
  )
}
