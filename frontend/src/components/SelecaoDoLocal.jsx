import BuscaEndereco from './BuscaEndereco'
import { TELA_DE_TOQUE } from '../utils/dispositivo'

// Primeira etapa do cadastro: escolher onde fica o local.
// RF12: por clique no mapa ou pela digitação do endereço.
// RNF20: também precisa funcionar só com o teclado.
export default function SelecaoDoLocal({
  temMinhaPosicao,
  onUsarCentroDoMapa,
  onUsarMinhaPosicao,
  onEscolherEndereco,
  onCancelar,
}) {
  return (
    <section aria-labelledby="titulo-selecao-local">
      <h2 id="titulo-selecao-local" className="h5">
        Adicionar local
      </h2>
      <p>Indique onde fica o local. Escolha uma das formas:</p>

      <ol className="ps-3">
        <li className="mb-3">
          <strong>No mapa:</strong> {TELA_DE_TOQUE ? 'toque' : 'clique'} no ponto onde fica o local.
        </li>
        <li className="mb-3">
          <strong>Pelo teclado:</strong> mova o mapa com as setas até o local ficar na cruz do
          centro e use o botão abaixo.
          <button
            type="button"
            className="btn btn-outline-primary btn-sm d-block mt-2"
            onClick={onUsarCentroDoMapa}
          >
            Marcar no centro do mapa
          </button>
        </li>
        <li className="mb-3">
          <strong>Pelo endereço:</strong>
          <BuscaEndereco
            id="busca-endereco-local"
            rotulo="Digite o endereço do local"
            onEscolher={onEscolherEndereco}
          />
        </li>
        {temMinhaPosicao && (
          <li className="mb-3">
            <strong>Onde você está agora:</strong>
            <button
              type="button"
              className="btn btn-outline-primary btn-sm d-block mt-2"
              onClick={onUsarMinhaPosicao}
            >
              Marcar na minha posição
            </button>
          </li>
        )}
      </ol>

      <button type="button" className="btn btn-outline-secondary" onClick={onCancelar}>
        Cancelar
      </button>
    </section>
  )
}
