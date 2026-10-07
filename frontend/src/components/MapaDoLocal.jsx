import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import { iconeDoPin } from './iconesDePin'

// Mapa pequeno da tela de detalhes, mostrando só o pin do local.
export default function MapaDoLocal({ local }) {
  const posicao = [local.latitude, local.longitude]

  return (
    <MapContainer
      key={local.id}
      center={posicao}
      zoom={16}
      scrollWheelZoom={false}
      zoomAnimation={false}
      fadeAnimation={false}
      markerZoomAnimation={false}
      className="mapa-do-local rounded border"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={posicao} icon={iconeDoPin(local)} title={local.nome} interactive={false} />
    </MapContainer>
  )
}
