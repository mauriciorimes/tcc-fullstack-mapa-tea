// Sugestões de novas categorias (RF11) e a análise delas pelo moderador.
// É diferente do pedido de inclusão de categoria em um pin: aqui o usuário
// propõe uma categoria que ainda não existe no sistema.
// Por enquanto fica no navegador; na API corresponde a /api/categorias e /api/moderacao.
import { adicionarCategoria, categorias } from '../mocks/categorias'
import { nomeDoUsuario } from './authService'
import { sugestoesIniciais } from '../mocks/contribuicoes'

const CHAVE = 'mapatea:sugestoesDeCategoria'
export const TAMANHO_MAXIMO_DO_NOME = 40

function ler() {
  try {
    // Sem nada guardado, começa pelos dados de exemplo.
    return JSON.parse(localStorage.getItem(CHAVE)) ?? sugestoesIniciais
  } catch {
    return sugestoesIniciais
  }
}

function gravar(sugestoes) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(sugestoes))
  } catch {
    throw new Error('Não foi possível salvar neste navegador.')
  }
}

function mesmoNome(a, b) {
  return a.trim().toLowerCase() === b.trim().toLowerCase()
}

export async function sugerirCategoria({ nome, justificativa, idDoAutor }) {
  const limpo = nome.trim()
  if (!limpo) throw new Error('Informe o nome da categoria.')
  if (limpo.length > TAMANHO_MAXIMO_DO_NOME) {
    throw new Error(`O nome pode ter no máximo ${TAMANHO_MAXIMO_DO_NOME} caracteres.`)
  }
  if (categorias.some((categoria) => mesmoNome(categoria.nome, limpo))) {
    throw new Error('Esta categoria já existe.')
  }
  const sugestoes = ler()
  const repetida = sugestoes.some(
    (sugestao) =>
      sugestao.status === 'pendente' && sugestao.idDoAutor === idDoAutor && mesmoNome(sugestao.nome, limpo),
  )
  if (repetida) throw new Error('Você já sugeriu esta categoria. Ela está em análise.')

  gravar([
    ...sugestoes,
    {
      id: `sugestao-${Date.now()}`,
      nome: limpo,
      justificativa: justificativa.trim(),
      idDoAutor,
      status: 'pendente',
      criadaEm: new Date().toISOString(),
    },
  ])
}

export async function listarMinhasSugestoes(idDoAutor) {
  return ler()
    .filter((sugestao) => sugestao.idDoAutor === idDoAutor)
    .sort((a, b) => b.criadaEm.localeCompare(a.criadaEm))
}

export async function listarSugestoesPendentes() {
  return ler()
    .filter((sugestao) => sugestao.status === 'pendente')
    .sort((a, b) => a.criadaEm.localeCompare(b.criadaEm))
    .map((sugestao) => ({ ...sugestao, nomeDoAutor: nomeDoUsuario(sugestao.idDoAutor) }))
}

function analisar(id, mudancas) {
  gravar(
    ler().map((sugestao) =>
      sugestao.id === id ? { ...sugestao, ...mudancas, dataAnalise: new Date().toISOString() } : sugestao,
    ),
  )
}

// A sugestão aprovada vira uma categoria nova, disponível no cadastro, no
// filtro e na legenda do mapa (RNF41).
export async function aprovarSugestao(id) {
  const sugestao = ler().find((item) => item.id === id)
  if (!sugestao) throw new Error('Sugestão não encontrada.')
  adicionarCategoria(sugestao.nome)
  analisar(id, { status: 'aprovado' })
}

export async function rejeitarSugestao(id, motivo) {
  if (!motivo.trim()) throw new Error('Informe o motivo da rejeição.')
  analisar(id, { status: 'rejeitado', motivoRejeicao: motivo.trim() })
}
