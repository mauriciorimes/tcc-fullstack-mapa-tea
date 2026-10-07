// Corrige os ícones padrão do Leaflet, que aparecem quebrados em projetos Vite,
// e cria o pin do local em cadastro e o ponto da posição do usuário.
import L from 'leaflet'
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl })

// Pin cinza do local que está sendo cadastrado (ainda sem categorias).
export const iconeNovo = new L.Icon.Default({ className: 'pin-novo' })

// Ponto azul da posição do usuário (maior enquanto ele está ajustando).
export const iconeMinhaPosicao = L.divIcon({ className: 'ponto-usuario', iconSize: [20, 20] })
export const iconeMinhaPosicaoAjustando = L.divIcon({
  className: 'ponto-usuario ajustando',
  iconSize: [30, 30],
})
