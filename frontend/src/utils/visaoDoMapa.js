// Guarda o trecho do mapa que o usuário estava vendo (centro e zoom), para
// que ele encontre o mapa no mesmo lugar ao voltar de outra tela.
// Vale só para a aba atual do navegador (sessionStorage).
const CHAVE = 'mapatea:visaoDoMapa'

export function salvarVisaoDoMapa(visao) {
  try {
    sessionStorage.setItem(CHAVE, JSON.stringify(visao))
  } catch {
    // Sem sessionStorage: o mapa apenas volta à posição inicial.
  }
}

export function lerVisaoDoMapa() {
  try {
    const salva = sessionStorage.getItem(CHAVE)
    return salva ? JSON.parse(salva) : null
  } catch {
    return null
  }
}
