import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import DetalheDoPin from '../components/DetalheDoPin'
import MapaDoLocal from '../components/MapaDoLocal'
import { lerUltimaPosicao } from '../services/localizacaoService'
import { distanciaEmKm, textoDaDistancia } from '../utils/distancia'

// Tela de detalhes de um pin (RF03), com endereço próprio: /local/:id.
// A consulta é pública, então o link pode ser compartilhado.
export default function PaginaDoLocal() {
  const { id } = useParams()
  const [carregado, setCarregado] = useState(null)
  const local = carregado?.id === id ? carregado : null

  useEffect(() => {
    document.title = local ? `${local.nome} – Mapa TEA` : 'Detalhes do local – Mapa TEA'
  }, [local])

  // A distância usa a última posição conhecida do usuário, quando existe.
  const minhaPosicao = lerUltimaPosicao()
  const distancia =
    local && minhaPosicao
      ? textoDaDistancia({ distanciaKm: distanciaEmKm(minhaPosicao, local) })
      : null

  return (
    <main className="container py-3">
      <Link className="btn btn-outline-secondary btn-sm mb-3" to="/">
        <span aria-hidden="true">← </span>Voltar ao mapa
      </Link>

      <div className="row g-4">
        <div className="col-lg-7">
          <DetalheDoPin idDoLocal={id} textoDaDistancia={distancia} onCarregar={setCarregado} />
        </div>

        {local && (
          <section className="col-lg-5" aria-labelledby="titulo-localizacao">
            <h2 id="titulo-localizacao" className="h5">
              Localização
            </h2>
            <MapaDoLocal local={local} />
            <p className="small text-body-secondary mt-2 mb-0">
              Coordenadas: {local.latitude.toFixed(5)}, {local.longitude.toFixed(5)}
            </p>
          </section>
        )}
      </div>
    </main>
  )
}
