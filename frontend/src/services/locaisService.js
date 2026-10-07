// Camada de acesso aos dados dos locais.
// Por enquanto os dados ficam no localStorage do navegador. Quando a API REST
// existir, basta trocar o conteúdo destas funções por chamadas fetch: as telas
// já usam await e não precisam mudar.
import { locaisIniciais } from '../mocks/locais'
import { categorias } from '../mocks/categorias'
import { detalhesDosLocais, detalhesVazios } from '../mocks/detalhes'
import { nomeDoUsuario } from './authService'
import { lerComentariosDespublicados } from './comentariosDespublicados'
import { interacoesPublicasDoLocal } from './interacoesService'
import { distanciaEmKm } from '../utils/distancia'

const CHAVE = 'mapatea:locais'

// Constante de negócio: raio em que dois pontos são tratados como o mesmo local.
export const RAIO_DE_DUPLICIDADE_METROS = 30

// RF48: procura um pin publicado a até 30 metros do ponto escolhido. Só os
// publicados contam, para que solicitações pendentes não bloqueiem novos cadastros.
// Devolve o mais próximo, com a distância, ou null.
export function pinPublicadoProximo(locais, ponto) {
  let maisProximo = null
  for (const local of locais) {
    if (local.status !== 'aprovado') continue
    const distanciaMetros = distanciaEmKm(ponto, local) * 1000
    if (distanciaMetros <= RAIO_DE_DUPLICIDADE_METROS && (!maisProximo || distanciaMetros < maisProximo.distanciaMetros)) {
      maisProximo = { pin: local, distanciaMetros }
    }
  }
  return maisProximo
}

// Locais salvos antes podem citar categorias que deixaram de existir.
// Na leitura, ficam só as categorias válidas hoje.
function manterCategoriasValidas(local) {
  const idsValidos = categorias.map((categoria) => categoria.id)
  return { ...local, categorias: local.categorias.filter((id) => idsValidos.includes(id)) }
}

function lerDoCache() {
  try {
    const salvo = localStorage.getItem(CHAVE)
    if (salvo) return JSON.parse(salvo).map(manterCategoriasValidas)
  } catch {
    // Cache indisponível ou corrompido: volta para os dados iniciais.
  }
  return null
}

// Lança erro quando o navegador não consegue guardar (por exemplo, sem espaço
// para as fotos), para a tela poder avisar o usuário.
function salvarNoCache(locais) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(locais))
  } catch {
    throw new Error('Não foi possível salvar neste navegador. Tente com menos fotos ou fotos menores.')
  }
}

export async function listarLocais() {
  const locais = lerDoCache()
  if (locais) return locais
  try {
    salvarNoCache(locaisIniciais)
  } catch {
    // Sem localStorage (ex.: aba anônima bloqueada) os exemplos ficam só em memória.
  }
  return locaisIniciais
}

// Detalhes de um local: os dados do pin mais fotos, avaliações, comentários
// aprovados e data da última confirmação. Na API será uma consulta própria,
// separada da listagem do mapa.
export async function buscarDetalhesDoLocal(id) {
  const locais = await listarLocais()
  const local = locais.find((item) => item.id === id)
  if (!local) throw new Error('Local não encontrado.')
  // As fotos gravadas no próprio local têm prioridade sobre as de exemplo.
  const detalhes = { ...(detalhesDosLocais[id] ?? detalhesVazios), ...local }

  // Junta aos dados de exemplo o que os usuários contribuíram: comentários
  // aprovados, avaliações (publicadas na hora, RF45) e confirmações (RF57).
  const contribuicoes = interacoesPublicasDoLocal(id)
  const totalAvaliacoes = detalhes.totalAvaliacoes + contribuicoes.notas.length
  const somaDasNotas =
    (detalhes.notaMedia ?? 0) * detalhes.totalAvaliacoes +
    contribuicoes.notas.reduce((soma, nota) => soma + nota, 0)
  const datasDeConfirmacao = [detalhes.dataUltimaConfirmacao, contribuicoes.ultimaConfirmacao]
    .filter(Boolean)
    .sort()

  // Comentários despublicados pelo moderador não aparecem (RF43).
  const despublicados = lerComentariosDespublicados()
  return {
    ...detalhes,
    totalAvaliacoes,
    notaMedia: totalAvaliacoes > 0 ? somaDasNotas / totalAvaliacoes : null,
    dataUltimaConfirmacao: datasDeConfirmacao.at(-1) ?? null,
    comentarios: [...detalhes.comentarios, ...contribuicoes.comentarios]
      .filter((comentario) => !despublicados.includes(comentario.id))
      .sort((a, b) => b.data.localeCompare(a.data)),
  }
}

export async function cadastrarLocal(dados) {
  const novoLocal = {
    ...dados,
    id: `local-${Date.now()}`,
    status: 'pendente', // aguardando moderação
    criadoEm: new Date().toISOString(),
  }
  const locais = await listarLocais()
  salvarNoCache([...locais, novoLocal])
  return novoLocal
}

// Troca as fotos de uma solicitação ainda pendente (RF19). Depois de publicado,
// o pin só pode ser alterado pelo moderador (RF56).
export async function atualizarFotosDoLocal(id, fotos) {
  const locais = await listarLocais()
  const local = locais.find((item) => item.id === id)
  if (!local) throw new Error('Local não encontrado.')
  if (local.status === 'aprovado') {
    throw new Error('Este local já foi publicado. Só o moderador pode alterar as fotos.')
  }
  salvarNoCache(locais.map((item) => (item.id === id ? { ...item, fotos } : item)))
  return buscarDetalhesDoLocal(id)
}

// ---- Solicitações do próprio usuário (RF19, RF20, RF21) ----

// Tudo o que o usuário enviou, da solicitação mais nova para a mais antiga.
export async function listarMinhasSolicitacoes(idDoUsuario) {
  const locais = await listarLocais()
  return locais
    .filter((local) => local.idDoAutor === idDoUsuario)
    .sort((a, b) => (b.criadoEm ?? '').localeCompare(a.criadoEm ?? ''))
}

async function buscarSolicitacaoDoAutor(id, idDoUsuario) {
  const locais = await listarLocais()
  const local = locais.find((item) => item.id === id && item.idDoAutor === idDoUsuario)
  if (!local) throw new Error('Solicitação não encontrada.')
  return { local, locais }
}

// RF19: edição enquanto a solicitação está pendente de moderação.
export async function atualizarSolicitacao(id, idDoUsuario, dados) {
  const { local, locais } = await buscarSolicitacaoDoAutor(id, idDoUsuario)
  if (local.status !== 'pendente') {
    throw new Error('Esta solicitação já foi analisada e não pode mais ser editada.')
  }
  const { nome, descricao, categorias: novasCategorias, fotos, latitude, longitude } = dados
  salvarNoCache(
    locais.map((item) =>
      item.id === id
        ? {
            ...item,
            nome,
            descricao,
            categorias: novasCategorias,
            fotos,
            latitude: latitude ?? item.latitude,
            longitude: longitude ?? item.longitude,
          }
        : item,
    ),
  )
}

// RF20: exclusão da própria solicitação. Depois de publicado, o pin só pode
// ser excluído pelo moderador (RF38).
export async function excluirSolicitacao(id, idDoUsuario) {
  const { local, locais } = await buscarSolicitacaoDoAutor(id, idDoUsuario)
  if (local.status !== 'pendente' && local.status !== 'rejeitado') {
    throw new Error('Este local já foi publicado. Só o moderador pode excluí-lo.')
  }
  salvarNoCache(locais.filter((item) => item.id !== id))
}

// ---- Moderação (RF31, RF33, RF34) ----
// Na API, estas operações ficam em /api/moderacao e só o moderador as acessa.

// Fila das solicitações de pin pendentes, da mais antiga para a mais nova.
export async function listarSolicitacoesPendentes() {
  const locais = await listarLocais()
  return locais
    .filter((local) => local.status === 'pendente')
    .sort((a, b) => (a.criadoEm ?? '').localeCompare(b.criadoEm ?? ''))
    .map((local) => ({ ...local, nomeDoAutor: nomeDoUsuario(local.idDoAutor) }))
}

async function analisarSolicitacao(id, mudancas) {
  const locais = await listarLocais()
  salvarNoCache(
    locais.map((local) =>
      local.id === id ? { ...local, ...mudancas, dataAnalise: new Date().toISOString() } : local,
    ),
  )
}

// RF33: a solicitação aprovada passa a ser um pin publicado no mapa.
export async function aprovarSolicitacao(id) {
  await analisarSolicitacao(id, { status: 'aprovado', motivoRejeicao: null })
}

// RF34 e RF55: a rejeição registra o motivo, que fica disponível ao autor.
export async function rejeitarSolicitacao(id, motivo) {
  if (!motivo.trim()) throw new Error('Informe o motivo da rejeição.')
  await analisarSolicitacao(id, { status: 'rejeitado', motivoRejeicao: motivo.trim() })
}

// RF35 e RF50: associa mais uma categoria a um pin publicado.
export async function incluirCategoriaNoLocal(id, idDaCategoria) {
  const locais = await listarLocais()
  salvarNoCache(
    locais.map((local) =>
      local.id === id && !local.categorias.includes(idDaCategoria)
        ? { ...local, categorias: [...local.categorias, idDaCategoria] }
        : local,
    ),
  )
}

// RF37: o moderador edita um pin já publicado.
export async function editarPinPublicado(id, dados) {
  const locais = await listarLocais()
  const { nome, descricao, categorias: novasCategorias, fotos, latitude, longitude } = dados
  salvarNoCache(
    locais.map((local) =>
      local.id === id
        ? {
            ...local,
            nome,
            descricao,
            categorias: novasCategorias,
            fotos,
            latitude: latitude ?? local.latitude,
            longitude: longitude ?? local.longitude,
          }
        : local,
    ),
  )
}

// RF39: o moderador despublica uma categoria e mantém as demais.
// RF54: o pin continua no mapa enquanto restar ao menos uma categoria ativa;
// sem nenhuma, ele é despublicado.
export async function despublicarCategoriaDoLocal(id, idDaCategoria) {
  const locais = await listarLocais()
  salvarNoCache(
    locais.map((local) => {
      if (local.id !== id) return local
      const restantes = local.categorias.filter((item) => item !== idDaCategoria)
      return {
        ...local,
        categorias: restantes,
        status: restantes.length > 0 ? local.status : 'despublicado',
      }
    }),
  )
}

// RF43: pin retirado do mapa pelo moderador depois de uma denúncia.
export async function despublicarLocal(id) {
  await analisarSolicitacao(id, { status: 'despublicado' })
}

export async function excluirLocal(id) {
  const locais = await listarLocais()
  salvarNoCache(locais.filter((local) => local.id !== id))
}
