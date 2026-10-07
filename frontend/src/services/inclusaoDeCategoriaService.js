// Solicitações de inclusão de categoria em pin já publicado (RF18) e a análise
// delas pelo moderador (RF32, RF35, RF36).
// É assim que um mesmo pin acumula categorias enviadas por usuários diferentes (RF50).
// Por enquanto fica no navegador; na API corresponde a /api/categorias e /api/moderacao.
import { buscarDetalhesDoLocal, incluirCategoriaNoLocal } from './locaisService'
import { categorias } from '../mocks/categorias'
import { inclusoesIniciais } from '../mocks/contribuicoes'

const CHAVE = 'mapatea:inclusoesDeCategoria'

function ler() {
  try {
    // Sem nada guardado, começa pelos dados de exemplo.
    return JSON.parse(localStorage.getItem(CHAVE)) ?? inclusoesIniciais
  } catch {
    return inclusoesIniciais
  }
}

function gravar(solicitacoes) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(solicitacoes))
  } catch {
    throw new Error('Não foi possível salvar neste navegador.')
  }
}

function categoriaPorId(id) {
  return categorias.find((categoria) => categoria.id === id)
}

// Categorias que o usuário já pediu para este pin e que ainda aguardam análise.
export async function categoriasJaSolicitadas(idDoPin, idDoAutor) {
  return ler()
    .filter(
      (solicitacao) =>
        solicitacao.status === 'pendente' &&
        solicitacao.idDoPin === idDoPin &&
        solicitacao.idDoAutor === idDoAutor,
    )
    .map((solicitacao) => solicitacao.idDaCategoria)
}

// RF18: o usuário pede a inclusão de uma ou mais categorias que o pin ainda não tem.
export async function solicitarInclusao({ idDoPin, idsDasCategorias, idDoAutor }) {
  if (idsDasCategorias.length === 0) throw new Error('Selecione ao menos uma categoria.')
  const pin = await buscarDetalhesDoLocal(idDoPin)
  if (pin.status !== 'aprovado') throw new Error('Este local não está publicado.')

  const jaSolicitadas = await categoriasJaSolicitadas(idDoPin, idDoAutor)
  const agora = new Date().toISOString()
  const novas = idsDasCategorias.map((idDaCategoria, indice) => {
    if (pin.categorias.includes(idDaCategoria)) {
      throw new Error('Este local já tem uma das categorias selecionadas.')
    }
    // O mesmo usuário não repete o pedido para o mesmo pin e a mesma categoria.
    if (jaSolicitadas.includes(idDaCategoria)) {
      throw new Error('Você já pediu a inclusão de uma das categorias selecionadas.')
    }
    return {
      id: `inclusao-${Date.now()}-${indice}`,
      idDoPin,
      idDaCategoria,
      idDoAutor,
      status: 'pendente',
      criadaEm: agora,
    }
  })
  gravar([...ler(), ...novas])
}

// RF21: os pedidos do próprio usuário, do mais novo para o mais antigo.
export async function listarMinhasInclusoes(idDoAutor) {
  const minhas = ler()
    .filter((solicitacao) => solicitacao.idDoAutor === idDoAutor)
    .sort((a, b) => b.criadaEm.localeCompare(a.criadaEm))
  return Promise.all(
    minhas.map(async (solicitacao) => {
      const pin = await buscarDetalhesDoLocal(solicitacao.idDoPin).catch(() => null)
      return {
        ...solicitacao,
        nomeDoPin: pin?.nome ?? 'Local não encontrado',
        categoria: categoriaPorId(solicitacao.idDaCategoria),
      }
    }),
  )
}

// RF32: fila do moderador. Os pedidos para o mesmo pin e a mesma categoria vêm
// agrupados, com a contagem de usuários, para que a repetição apoie a decisão.
export async function listarInclusoesPendentes() {
  const grupos = new Map()
  for (const solicitacao of ler()) {
    if (solicitacao.status !== 'pendente') continue
    const chave = `${solicitacao.idDoPin}|${solicitacao.idDaCategoria}`
    const grupo = grupos.get(chave) ?? {
      chave,
      idDoPin: solicitacao.idDoPin,
      idDaCategoria: solicitacao.idDaCategoria,
      quantidade: 0,
      primeiraEm: solicitacao.criadaEm,
    }
    grupo.quantidade += 1
    if (solicitacao.criadaEm < grupo.primeiraEm) grupo.primeiraEm = solicitacao.criadaEm
    grupos.set(chave, grupo)
  }

  const lista = [...grupos.values()].sort((a, b) => a.primeiraEm.localeCompare(b.primeiraEm))
  return Promise.all(
    lista.map(async (grupo) => {
      const pin = await buscarDetalhesDoLocal(grupo.idDoPin).catch(() => null)
      return { ...grupo, pin, categoria: categoriaPorId(grupo.idDaCategoria) }
    }),
  )
}

function encerrarGrupo(idDoPin, idDaCategoria, mudancas) {
  const dataAnalise = new Date().toISOString()
  gravar(
    ler().map((solicitacao) =>
      solicitacao.status === 'pendente' &&
      solicitacao.idDoPin === idDoPin &&
      solicitacao.idDaCategoria === idDaCategoria
        ? { ...solicitacao, ...mudancas, dataAnalise }
        : solicitacao,
    ),
  )
}

// RF35: aprovada a inclusão, a categoria é associada ao pin e os pedidos
// agrupados são encerrados juntos. O ícone do pin muda sozinho (RF54).
export async function aprovarInclusao(idDoPin, idDaCategoria) {
  await incluirCategoriaNoLocal(idDoPin, idDaCategoria)
  encerrarGrupo(idDoPin, idDaCategoria, { status: 'aprovado' })
}

// RF36: a rejeição informa o motivo aos autores dos pedidos.
export async function rejeitarInclusao(idDoPin, idDaCategoria, motivo) {
  if (!motivo.trim()) throw new Error('Informe o motivo da rejeição.')
  encerrarGrupo(idDoPin, idDaCategoria, { status: 'rejeitado', motivoRejeicao: motivo.trim() })
}
