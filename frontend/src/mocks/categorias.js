// Categorias do Mapa TEA. As três primeiras são as vigentes segundo o RF13 da
// documentação técnica. Elas descrevem o próprio local, e não o ramo de
// atividade do estabelecimento.
//
// Cada categoria tem um símbolo e uma cor de baixa saturação (RNF22). O símbolo
// garante que a categoria nunca dependa só da cor (RNF24).
// "chave" é o nome usado na composição do ícone do pin, como no exemplo da API
// ("estacionamento", "desconto-silencio").
//
// A estrutura aceita categorias novas (RNF41): elas nascem de sugestões dos
// usuários (RF11) aprovadas pelo moderador, e entram pela função
// adicionarCategoria, no fim deste arquivo.
export const categorias = [
  {
    id: 'vaga-prioritaria',
    chave: 'estacionamento',
    nome: 'Estacionamento',
    simbolo: 'P',
    corDeFundo: '#c9d8ea',
    corDoSimbolo: '#1f3a5f',
  },
  {
    id: 'desconto',
    chave: 'desconto',
    nome: 'Desconto',
    simbolo: '%',
    corDeFundo: '#cfe3cf',
    corDoSimbolo: '#1f4d2b',
  },
  {
    id: 'area-silenciosa',
    chave: 'silencio',
    nome: 'Ambiente sem barulho',
    simbolo: 'sem-som',
    corDeFundo: '#e2d5ea',
    corDoSimbolo: '#45285c',
  },
]

// RF13: a solicitação de pin leva de uma a três categorias.
export const MAXIMO_DE_CATEGORIAS = 3

// Devolve as categorias de um local sempre na mesma ordem (a da lista acima),
// para que a mesma combinação gere sempre o mesmo ícone.
export function categoriasDoLocal(ids) {
  return categorias.filter((categoria) => ids.includes(categoria.id))
}

// ---- Categorias criadas a partir de sugestões aprovadas ----

const CHAVE_EXTRAS = 'mapatea:categoriasExtras'

// Cores suaves usadas, em rodízio, pelas categorias novas.
const CORES_DAS_NOVAS = [
  { corDeFundo: '#ead9c9', corDoSimbolo: '#5a3a1b' },
  { corDeFundo: '#cde3e3', corDoSimbolo: '#1c4a4a' },
  { corDeFundo: '#e6e0c4', corDoSimbolo: '#4c4514' },
  { corDeFundo: '#ecd3d8', corDoSimbolo: '#5e2231' },
]

function semAcentos(texto) {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '')
}

// O símbolo da categoria nova é a inicial do nome. Se a inicial já estiver em
// uso, são usadas as duas primeiras letras.
function simboloPara(nome) {
  const letras = semAcentos(nome).replace(/[^a-zA-Z0-9]/g, '')
  const inicial = letras.slice(0, 1).toUpperCase()
  const emUso = categorias.some((categoria) => categoria.simbolo === inicial)
  return emUso ? inicial + letras.slice(1, 2).toLowerCase() : inicial
}

function montarCategoria(nome, posicao) {
  const chave = semAcentos(nome).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  return {
    id: `extra-${chave}`,
    chave,
    nome,
    simbolo: simboloPara(nome),
    ...CORES_DAS_NOVAS[posicao % CORES_DAS_NOVAS.length],
  }
}

function lerNomesDasExtras() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE_EXTRAS)) ?? []
  } catch {
    return []
  }
}

// Ao carregar o sistema, as categorias já aprovadas voltam para a lista.
lerNomesDasExtras().forEach((nome, posicao) => categorias.push(montarCategoria(nome, posicao)))

// Inclui uma categoria nova na lista. A partir daí ela aparece no cadastro, no
// filtro, na legenda e nos ícones dos pins, sem mudança no restante do código.
export function adicionarCategoria(nome) {
  const nomes = lerNomesDasExtras()
  const nova = montarCategoria(nome, nomes.length)
  if (categorias.some((categoria) => categoria.id === nova.id)) return
  categorias.push(nova)
  localStorage.setItem(CHAVE_EXTRAS, JSON.stringify([...nomes, nome]))
}
