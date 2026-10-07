import { Link } from 'react-router'
import { categorias, categoriasDoLocal } from '../mocks/categorias'
import { RAIO_DE_DUPLICIDADE_METROS } from '../services/locaisService'
import SimboloDaCategoria from './SimboloDaCategoria'

// Mostrado no cadastro quando já existe um pin publicado a até 30 metros do
// ponto escolhido (RF48, RNF39). Em vez de criar outro registro do mesmo
// local (RF50), o usuário pode confirmar as informações ou pedir a inclusão
// das categorias que faltam (RF49).
export default function PinExistente({ pin, distanciaMetros, onConfirmar, onEscolherOutroPonto, onCancelar }) {
  const faltamCategorias = pin.categorias.length < categorias.length

  return (
    <section aria-labelledby="titulo-pin-existente">
      <h2 id="titulo-pin-existente" className="h5">
        Já existe um local cadastrado aqui
      </h2>
      <p>
        O ponto que você marcou fica a {Math.round(distanciaMetros)} metros de um local já
        publicado. O sistema mantém um único pin para cada local, quando a distância é de até{' '}
        {RAIO_DE_DUPLICIDADE_METROS} metros.
      </p>

      <div className="card mb-3">
        <div className="card-body">
          <h3 className="h6 card-title">{pin.nome}</h3>
          <p className="mb-1">Categorias que ele já tem:</p>
          <ul className="list-unstyled mb-0">
            {categoriasDoLocal(pin.categorias).map((categoria) => (
              <li key={categoria.id}>
                <SimboloDaCategoria categoria={categoria} /> {categoria.nome}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p>O que você quer fazer?</p>
      <div className="d-grid gap-2">
        <button type="button" className="btn btn-primary" onClick={onConfirmar}>
          Confirmar que as informações estão corretas
        </button>
        {faltamCategorias && (
          <Link className="btn btn-outline-primary" to={`/local/${pin.id}/incluir-categoria`}>
            Solicitar inclusão de categoria neste local
          </Link>
        )}
        <Link className="btn btn-outline-primary" to={`/local/${pin.id}`}>
          Ver os detalhes deste local
        </Link>
        <button type="button" className="btn btn-outline-secondary" onClick={onEscolherOutroPonto}>
          Marcar outro ponto no mapa
        </button>
        <button type="button" className="btn btn-outline-secondary" onClick={onCancelar}>
          Cancelar
        </button>
      </div>
    </section>
  )
}
