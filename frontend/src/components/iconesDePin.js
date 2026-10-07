// Ícone do pin conforme as categorias vigentes do local (RF53).
// Com três categorias existem sete combinações: três isoladas, três pares e
// uma com as três. O ícone é montado a partir da combinação, então é
// recalculado sempre que as categorias do local mudam (RF54).
import L from 'leaflet'
import { categoriasDoLocal } from '../mocks/categorias'

const LADO = 24 // tamanho de cada símbolo
const ESPACO = 2
const MARGEM = 3
const ALTURA_DO_CORPO = LADO + MARGEM * 2
const ALTURA_DA_PONTA = 9
const COR_DA_BORDA = '#212529'

// Desenho do símbolo dentro de um quadrado de 24 x 24 com origem em (x, y).
export function desenhoDoSimbolo(categoria, x, y) {
  const fundo = `<rect x="${x}" y="${y}" width="${LADO}" height="${LADO}" rx="3" fill="${categoria.corDeFundo}"/>`

  if (categoria.simbolo === 'sem-som') {
    // Alto-falante com um X: ambiente sem barulho.
    return `${fundo}
      <path d="M${x + 4} ${y + 10}h3l4-4v12l-4-4h-3z" fill="${categoria.corDoSimbolo}"/>
      <path d="M${x + 14} ${y + 9}l6 6m0-6l-6 6" stroke="${categoria.corDoSimbolo}" stroke-width="2" stroke-linecap="round"/>`
  }

  // Categorias novas podem ter símbolo de duas letras, que usa letra menor.
  const tamanho = categoria.simbolo.length > 1 ? 13 : 17
  return `${fundo}
    <text x="${x + LADO / 2}" y="${y + (tamanho === 17 ? 18 : 17)}" text-anchor="middle" font-family="Arial, sans-serif"
      font-size="${tamanho}" font-weight="700" fill="${categoria.corDoSimbolo}">${categoria.simbolo}</text>`
}

// Nome da combinação, no padrão do exemplo da API: "estacionamento", "desconto-silencio"...
export function chaveDoIcone(idsDasCategorias) {
  return categoriasDoLocal(idsDasCategorias)
    .map((categoria) => categoria.chave)
    .join('-')
}

function criarIcone(doLocal, pendente) {
  const quantidade = Math.max(doLocal.length, 1)
  const largura = quantidade * LADO + (quantidade - 1) * ESPACO + MARGEM * 2
  const altura = ALTURA_DO_CORPO + ALTURA_DA_PONTA
  const meio = largura / 2
  // Solicitação ainda não aprovada: borda tracejada.
  const tracejado = pendente ? ' stroke-dasharray="4 3"' : ''

  const simbolos = doLocal
    .map((categoria, indice) => desenhoDoSimbolo(categoria, MARGEM + indice * (LADO + ESPACO), MARGEM))
    .join('')

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${largura}" height="${altura}" viewBox="0 0 ${largura} ${altura}" aria-hidden="true">
    <path d="M${meio - 7} ${ALTURA_DO_CORPO - 1}L${meio} ${altura - 1}L${meio + 7} ${ALTURA_DO_CORPO - 1}" fill="#fff" stroke="${COR_DA_BORDA}" stroke-width="2" stroke-linejoin="round"/>
    <rect x="1" y="1" width="${largura - 2}" height="${ALTURA_DO_CORPO - 2}" rx="5" fill="#fff" stroke="${COR_DA_BORDA}" stroke-width="2"${tracejado}/>
    <path d="M${meio - 5} ${ALTURA_DO_CORPO - 1}h10" stroke="#fff" stroke-width="2.5"/>
    ${simbolos}
  </svg>`

  return L.divIcon({
    className: 'pin-categoria',
    html: svg,
    iconSize: [largura, altura],
    iconAnchor: [meio, altura],
    popupAnchor: [0, -altura],
  })
}

// Os ícones são criados uma vez por combinação e reaproveitados.
const iconesCriados = new Map()

export function iconeDoPin(local) {
  const pendente = local.status !== 'aprovado'
  const chave = `${chaveDoIcone(local.categorias)}|${pendente}`
  if (!iconesCriados.has(chave)) {
    iconesCriados.set(chave, criarIcone(categoriasDoLocal(local.categorias), pendente))
  }
  return iconesCriados.get(chave)
}
