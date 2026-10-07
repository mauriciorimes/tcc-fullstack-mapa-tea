const RAIO_DA_TERRA_KM = 6371

function paraRadianos(graus) {
  return (graus * Math.PI) / 180
}

// Distância em linha reta entre dois pontos (fórmula de Haversine), em km.
export function distanciaEmKm(origem, destino) {
  const dLat = paraRadianos(destino.latitude - origem.latitude)
  const dLon = paraRadianos(destino.longitude - origem.longitude)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(paraRadianos(origem.latitude)) *
      Math.cos(paraRadianos(destino.latitude)) *
      Math.sin(dLon / 2) ** 2
  return 2 * RAIO_DA_TERRA_KM * Math.asin(Math.sqrt(a))
}

export function formatarDistancia(km) {
  if (km < 1) return `${Math.round(km * 1000)} m`
  if (km < 10) return `${km.toFixed(1).replace('.', ',')} km`
  return `${Math.round(km).toLocaleString('pt-BR')} km`
}

// Quando a posição do usuário é aproximada, a distância também é.
export function textoDaDistancia(local) {
  const distancia = formatarDistancia(local.distanciaKm)
  return local.distanciaAproximada ? `A cerca de ${distancia} de você` : `A ${distancia} de você`
}
