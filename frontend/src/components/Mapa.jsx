import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet.markercluster'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, useMapEvents } from 'react-leaflet'
import { iconeNovo, iconeMinhaPosicao, iconeMinhaPosicaoAjustando } from './icones'
import { iconeDoPin } from './iconesDePin'
import SimboloDaCategoria from './SimboloDaCategoria'
import { categorias, categoriasDoLocal } from '../mocks/categorias'
import { formatarDistancia } from '../utils/distancia'
import { TELA_DE_TOQUE } from '../utils/dispositivo'
import { lerVisaoDoMapa, salvarVisaoDoMapa } from '../utils/visaoDoMapa'

const CENTRO_DO_BRASIL = [-14.235, -51.925]

function paraPonto(latlng) {
  return { latitude: latlng.lat, longitude: latlng.lng }
}

// O clique simples só marca um local depois que o usuário aciona "Adicionar
// local" (modo de seleção); fora dele, fica livre para navegar no mapa.
// Duplo clique/toque duplo e botão direito/toque longo marcam direto, como atalho.
// No modo de ajuste, o clique simples move a posição do usuário.
function EventosDoMapa({ ajustando, selecionando, onMarcar, onMoverMinhaPosicao }) {
  function marcar(evento) {
    if (!ajustando) onMarcar(paraPonto(evento.latlng))
  }
  useMapEvents({
    dblclick: marcar,
    contextmenu: marcar,
    click(evento) {
      if (ajustando) onMoverMinhaPosicao(paraPonto(evento.latlng))
      else if (selecionando) onMarcar(paraPonto(evento.latlng))
    },
  })
  return null
}

// Guarda centro e zoom a cada movimento, para retomar o mapa ao voltar de outra tela.
function LembrarVisao() {
  useMapEvents({
    moveend(evento) {
      const centro = evento.target.getCenter()
      salvarVisaoDoMapa({ latitude: centro.lat, longitude: centro.lng, zoom: evento.target.getZoom() })
    },
  })
  return null
}

// Disponibiliza para fora do mapa a coordenada do centro da área visível,
// usada para marcar um local sem mouse.
function CentroDoMapa({ centroRef }) {
  const mapa = useMap()
  useEffect(() => {
    centroRef.current = () => paraPonto(mapa.getCenter())
  }, [centroRef, mapa])
  return null
}

// Move o mapa até o ponto em foco. Com raioKm, enquadra o círculo inteiro;
// com manterZoom, só desloca o mapa.
function FocarNoMapa({ foco }) {
  const mapa = useMap()
  useEffect(() => {
    if (!foco) return
    const centro = L.latLng(foco.latitude, foco.longitude)
    // Os movimentos do mapa são diretos, sem animação (RNF21).
    if (foco.manterZoom) {
      mapa.panTo(centro, { animate: false })
    } else if (foco.raioKm) {
      mapa.fitBounds(centro.toBounds(foco.raioKm * 2000), { animate: false })
    } else {
      mapa.setView(centro, foco.zoom ?? 15, { animate: false })
    }
  }, [foco, mapa])
  return null
}

// Texto lido por leitores de tela no lugar do desenho do pin.
function textoDoPin(local) {
  const nomes = categoriasDoLocal(local.categorias).map((categoria) => categoria.nome)
  return `${local.nome}: ${nomes.join(', ')}`
}

// Marcador que representa vários pins próximos, com a quantidade (RF46).
function iconeDoGrupo(grupo) {
  const quantidade = grupo.getChildCount()
  return L.divIcon({
    className: 'grupo-de-pins',
    html: `<span aria-hidden="true">${quantidade}</span><span class="visually-hidden">${quantidade} locais nesta área. Ative para aproximar o mapa.</span>`,
    iconSize: [40, 40],
  })
}

// Pins dos locais publicados. Os que ficam próximos na tela são reunidos em um
// único marcador, conforme o nível de zoom (RF46); isso mantém o mapa legível
// e rápido mesmo com muitos pins (RNF26).
function PinsDosLocais({ locais, onSelecionarLocal }) {
  const mapa = useMap()
  const aoSelecionar = useRef(onSelecionarLocal)
  aoSelecionar.current = onSelecionarLocal

  useEffect(() => {
    const grupo = L.markerClusterGroup({
      iconCreateFunction: iconeDoGrupo,
      showCoverageOnHover: false,
      animate: false,
      maxClusterRadius: 50,
    })
    locais.forEach((local) => {
      const texto = textoDoPin(local)
      L.marker([local.latitude, local.longitude], { icon: iconeDoPin(local), title: texto, alt: texto })
        .on('click', () => aoSelecionar.current(local))
        .addTo(grupo)
    })
    mapa.addLayer(grupo)
    return () => {
      mapa.removeLayer(grupo)
    }
  }, [locais, mapa])

  return null
}

function textoDaLegenda(ajustando, selecionando) {
  if (ajustando) return 'Arraste o ponto azul ou clique/toque no mapa onde você realmente está.'
  if (selecionando) {
    return TELA_DE_TOQUE
      ? 'Toque no mapa onde fica o local.'
      : 'Clique no mapa onde fica o local. Pelo teclado, deixe o local na cruz do centro.'
  }
  if (TELA_DE_TOQUE) return 'Use o botão "Adicionar local" ou toque duas vezes no mapa.'
  return 'Use o botão "Adicionar local" ou dê dois cliques no mapa.'
}

// Legenda no canto do mapa: o símbolo de cada categoria (RF01) e, quando a
// posição do usuário é conhecida, o ponto azul e os círculos, com medidas.
function LegendaDoMapa({ minhaPosicao, raioKm }) {
  return (
    <ul className="legenda-medidas small list-unstyled mb-0" aria-label="Legenda do mapa">
      {categorias.map((categoria) => (
        <li key={categoria.id}>
          <SimboloDaCategoria categoria={categoria} /> {categoria.nome}
        </li>
      ))}
      {minhaPosicao && (
        <li className="separador">
          <span className="amostra amostra-ponto" aria-hidden="true" /> Você
          {minhaPosicao.precisaoMetros ? ' (posição estimada)' : ' (definida por você)'}
        </li>
      )}
      {minhaPosicao?.precisaoMetros && (
        <li>
          <span className="amostra amostra-precisao" aria-hidden="true" /> Margem de erro: ±{' '}
          {formatarDistancia(minhaPosicao.precisaoMetros / 1000)}
        </li>
      )}
      {minhaPosicao && raioKm && (
        <li>
          <span className="amostra amostra-raio" aria-hidden="true" /> Raio de busca: {raioKm} km
        </li>
      )}
    </ul>
  )
}

export default function Mapa({
  locais,
  pontoNovo,
  categoriasDoPontoNovo,
  onSelecionarPonto,
  foco,
  minhaPosicao,
  raioKm,
  ajustando,
  onMoverMinhaPosicao,
  selecionando,
  centroRef,
  onSelecionarLocal,
}) {
  const emDestaque = ajustando || selecionando
  // Só é lida na primeira montagem: o MapContainer ignora mudanças de centro e zoom.
  const visaoSalva = lerVisaoDoMapa()

  return (
    <div className={`position-relative ${selecionando ? 'mapa-selecionando' : ''}`}>
      <MapContainer
        center={visaoSalva ? [visaoSalva.latitude, visaoSalva.longitude] : CENTRO_DO_BRASIL}
        zoom={visaoSalva?.zoom ?? 4}
        doubleClickZoom={false}
        zoomAnimation={false}
        fadeAnimation={false}
        markerZoomAnimation={false}
        className="mapa rounded border"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <EventosDoMapa
          ajustando={ajustando}
          selecionando={selecionando}
          onMarcar={onSelecionarPonto}
          onMoverMinhaPosicao={onMoverMinhaPosicao}
        />
        <CentroDoMapa centroRef={centroRef} />
        <LembrarVisao />
        <FocarNoMapa foco={foco} />

        {minhaPosicao && (
          <>
            {raioKm && (
              <Circle
                center={[minhaPosicao.latitude, minhaPosicao.longitude]}
                radius={raioKm * 1000}
                pathOptions={{ color: '#6f42c1', weight: 2, dashArray: '8 6', fillOpacity: 0 }}
                interactive={false}
              />
            )}
            {/* Margem de erro informada pelo navegador */}
            {minhaPosicao.precisaoMetros && (
              <Circle
                center={[minhaPosicao.latitude, minhaPosicao.longitude]}
                radius={minhaPosicao.precisaoMetros}
                pathOptions={{ color: '#0d6efd', weight: 1, opacity: 0.4, fillOpacity: 0.15 }}
                interactive={false}
              />
            )}
            <Marker
              position={[minhaPosicao.latitude, minhaPosicao.longitude]}
              icon={ajustando ? iconeMinhaPosicaoAjustando : iconeMinhaPosicao}
              alt="Sua posição"
              title={ajustando ? 'Arraste até a sua posição real' : 'Sua posição'}
              draggable={ajustando}
              zIndexOffset={1000}
              eventHandlers={{
                dragend(evento) {
                  onMoverMinhaPosicao(paraPonto(evento.target.getLatLng()))
                },
              }}
            >
              {!ajustando && <Popup>Você está aqui</Popup>}
            </Marker>
          </>
        )}

        <PinsDosLocais locais={locais} onSelecionarLocal={onSelecionarLocal} />

        {pontoNovo && (
          <Marker
            position={[pontoNovo.latitude, pontoNovo.longitude]}
            icon={
              categoriasDoPontoNovo.length > 0
                ? iconeDoPin({ categorias: categoriasDoPontoNovo, status: 'pendente' })
                : iconeNovo
            }
            zIndexOffset={2000}
            alt="Novo local (arraste para ajustar)"
            title="Novo local (arraste para ajustar)"
            draggable
            eventHandlers={{
              dragend(evento) {
                onSelecionarPonto(paraPonto(evento.target.getLatLng()))
              },
            }}
          />
        )}
      </MapContainer>

      {selecionando && <span className="cruz-do-centro" aria-hidden="true" />}

      <p className={`legenda-mapa small mb-0 ${emDestaque ? 'ajustando' : ''}`}>
        <span aria-hidden="true">{emDestaque ? '🎯 ' : '📍 '}</span>
        {textoDaLegenda(ajustando, selecionando)}
      </p>

      <LegendaDoMapa minhaPosicao={minhaPosicao} raioKm={raioKm} />
    </div>
  )
}
