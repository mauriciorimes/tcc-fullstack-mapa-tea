// Obtém a posição do usuário pela Geolocation API do navegador, a única forma
// que um site tem de saber onde o usuário está. Ela só funciona em localhost
// ou HTTPS e depende da permissão do usuário.
//
// Para chegar à melhor posição que o aparelho consegue dar:
// 1. Pedimos duas leituras ao mesmo tempo: uma precisa (GPS, quando existe) e
//    uma rápida (redes Wi-Fi, antenas de celular, IP). Se uma falhar ou
//    demorar, a outra continua valendo.
// 2. Ficamos sempre com a leitura de menor margem de erro e repassamos cada
//    melhora, em vez de ficar só com a primeira resposta.
// 3. Depois da primeira posição, continuamos tentando melhorar por alguns
//    segundos, e paramos antes se a margem de erro já for de poucos metros.
import { distanciaEmKm } from '../utils/distancia'
import { TELA_DE_TOQUE } from '../utils/dispositivo'
import { classificarPrecisao } from '../utils/precisao'

const ESPERA_PELA_PRIMEIRA_POSICAO_MS = 15000
const TEMPO_DE_REFINO_MS = 20000
const PRECISAO_SUFICIENTE_METROS = 20

// Acima disso a posição é considerada aproximada e o usuário é avisado.
export const PRECISAO_ACEITAVEL_METROS = 1000

const LEITURAS = [
  { enableHighAccuracy: true, timeout: ESPERA_PELA_PRIMEIRA_POSICAO_MS, maximumAge: 0 },
  { enableHighAccuracy: false, timeout: ESPERA_PELA_PRIMEIRA_POSICAO_MS, maximumAge: 0 },
]

const PERMISSAO_NEGADA = 1

const MENSAGENS_DE_ERRO = {
  1: 'A permissão de localização foi negada no navegador ou no sistema. Você ainda pode buscar seu endereço abaixo.',
  2: 'Seu dispositivo não conseguiu descobrir a localização agora. Você pode buscar seu endereço abaixo.',
  3: 'A localização demorou demais para responder. Tente de novo ou busque seu endereço abaixo.',
}

// Chama onPosicao a cada posição mais precisa que a anterior.
// Retorna uma função para parar o acompanhamento.
export function acompanharMinhaPosicao({ onPosicao, onErro, onFim }) {
  function recusar(mensagem) {
    onErro(new Error(mensagem))
    onFim?.()
    return () => {}
  }

  if (!('geolocation' in navigator)) {
    return recusar('Seu navegador não permite obter a localização. Você pode buscar seu endereço abaixo.')
  }
  if (!window.isSecureContext) {
    return recusar(
      'O navegador só libera a localização em endereços seguros (HTTPS). Você pode buscar seu endereço abaixo.',
    )
  }

  const ids = []
  const leiturasComFalha = new Set()
  let melhorPrecisao = Infinity
  let temporizador = null
  let encerrado = false

  function receber(posicao) {
    if (encerrado) return
    const { latitude, longitude } = posicao.coords
    const precisaoMetros = Math.max(posicao.coords.accuracy, 1)

    // O tempo de refino só começa a contar na primeira posição recebida, para
    // não incluir o tempo que o usuário leva respondendo ao pedido de permissão.
    if (temporizador === null) temporizador = setTimeout(parar, TEMPO_DE_REFINO_MS)

    if (precisaoMetros >= melhorPrecisao) return
    melhorPrecisao = precisaoMetros
    onPosicao({ latitude, longitude, precisaoMetros })
    if (precisaoMetros <= PRECISAO_SUFICIENTE_METROS) parar()
  }

  function falhar(indice, erro) {
    // Se já temos uma posição, um erro posterior não precisa ser exibido.
    if (encerrado || melhorPrecisao !== Infinity) return
    leiturasComFalha.add(indice)
    // Permissão negada vale para as duas leituras. Nos outros erros, só
    // desistimos quando as duas tiverem falhado.
    if (erro.code !== PERMISSAO_NEGADA && leiturasComFalha.size < LEITURAS.length) return
    onErro(new Error(MENSAGENS_DE_ERRO[erro.code] ?? 'Erro ao obter a localização.'))
    parar()
  }

  function parar() {
    if (encerrado) return
    encerrado = true
    ids.forEach((id) => navigator.geolocation.clearWatch(id))
    clearTimeout(temporizador)
    onFim?.()
  }

  LEITURAS.forEach((opcoes, indice) => {
    ids.push(navigator.geolocation.watchPosition(receber, (erro) => falhar(indice, erro), opcoes))
  })

  return parar
}

// Decide se uma leitura automática do aparelho deve substituir a posição que
// já está na tela. A ideia é nunca trocar uma posição boa por uma pior.
//
// Em celulares, uma leitura aproximada (antenas) ainda é confiável dentro do
// seu círculo de erro. Já a leitura pelo IP pode apontar até para outra
// cidade, por isso ela não serve para dizer que o usuário mudou de lugar.
export function deveTrocarPosicao(nova, atual, telaDeToque = TELA_DE_TOQUE) {
  if (!atual) return true

  // Leitura boa (GPS ou Wi-Fi) sempre vale.
  if (nova.precisaoMetros <= PRECISAO_ACEITAVEL_METROS) return true

  // Leitura aproximada, mas melhor que a anterior do próprio aparelho.
  if (atual.origem === 'navegador' && nova.precisaoMetros < atual.precisaoMetros) return true

  // A posição atual ficou fora do círculo de erro da nova leitura: o usuário
  // mudou de lugar desde que ela foi salva ou definida.
  const leituraConfiavel = !classificarPrecisao(nova.precisaoMetros, telaDeToque).porIp
  const distanciaMetros = distanciaEmKm(nova, atual) * 1000
  return leituraConfiavel && distanciaMetros > nova.precisaoMetros
}

// Última posição confiável, guardada só neste navegador, para não ser
// preciso buscar ou ajustar de novo a cada visita.
const CHAVE_ULTIMA_POSICAO = 'mapatea:ultimaPosicao'

export function salvarUltimaPosicao(posicao) {
  try {
    localStorage.setItem(
      CHAVE_ULTIMA_POSICAO,
      JSON.stringify({ ...posicao, salvaEm: new Date().toISOString() }),
    )
  } catch {
    // Sem localStorage: apenas não lembra a posição.
  }
}

export function lerUltimaPosicao() {
  try {
    const salva = localStorage.getItem(CHAVE_ULTIMA_POSICAO)
    return salva ? JSON.parse(salva) : null
  } catch {
    return null
  }
}

// ---- Selo de localidade (RF17, RF51) ----

// Constante de negócio (RNF31): distância máxima entre o usuário e o local
// marcado para o selo ser concedido. Considera a margem de erro típica do GPS
// em ambiente urbano.
export const DISTANCIA_MAXIMA_DO_SELO_METROS = 150

const ESPERA_PELO_SELO_MS = 10000

function lerPosicaoUmaVez() {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator) || !window.isSecureContext) {
      reject(new Error('indisponivel'))
      return
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: ESPERA_PELO_SELO_MS,
      maximumAge: 0,
    })
  })
}

// Compara a posição do usuário com a do local marcado e diz se o selo é
// concedido. A posição é usada só nesta comparação: não é guardada (RNF12).
// Sem permissão ou sem leitura de localização, o selo não é concedido e a
// solicitação segue normalmente (RNF33).
export async function verificarPresenca(ponto) {
  try {
    const posicao = await lerPosicaoUmaVez()
    const distanciaMetros = distanciaEmKm(posicao.coords, ponto) * 1000
    return {
      concedido: distanciaMetros < DISTANCIA_MAXIMA_DO_SELO_METROS,
      distanciaMetros,
    }
  } catch {
    return { concedido: false, distanciaMetros: null }
  }
}
