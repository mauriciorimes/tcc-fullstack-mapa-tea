// Contribuições dos usuários sobre pins publicados: comentários (RF22),
// avaliações (RF23), edição e exclusão das próprias (RF24) e confirmações (RF25).
//
// Regra central (RF45): a avaliação é publicada na hora; o comentário passa
// pela moderação antes de aparecer.
//
// Por enquanto fica no navegador; na API corresponde a /api/comentarios,
// /api/avaliacoes, /api/confirmacoes e /api/moderacao.
import { nomeDoUsuario } from './authService'
import {
  avaliacoesIniciais,
  comentariosIniciais,
  confirmacoesIniciais,
} from '../mocks/contribuicoes'

const CHAVE_COMENTARIOS = 'mapatea:comentarios'
const CHAVE_AVALIACOES = 'mapatea:avaliacoes'
const CHAVE_CONFIRMACOES = 'mapatea:confirmacoes'

// Dados de exemplo usados enquanto o navegador ainda não guardou nada.
const DADOS_INICIAIS = {
  [CHAVE_COMENTARIOS]: comentariosIniciais,
  [CHAVE_AVALIACOES]: avaliacoesIniciais,
  [CHAVE_CONFIRMACOES]: confirmacoesIniciais,
}

export const NOTA_MAXIMA = 5
export const TAMANHO_MAXIMO_DO_COMENTARIO = 500

function ler(chave) {
  try {
    return JSON.parse(localStorage.getItem(chave)) ?? DADOS_INICIAIS[chave]
  } catch {
    return DADOS_INICIAIS[chave]
  }
}

function gravar(chave, valor) {
  try {
    localStorage.setItem(chave, JSON.stringify(valor))
  } catch {
    throw new Error('Não foi possível salvar neste navegador.')
  }
}

// ---- O que qualquer pessoa vê na tela de detalhes ----

// Comentários aprovados, notas e confirmações gravados para um pin. O serviço
// de locais junta isto aos dados de exemplo.
export function interacoesPublicasDoLocal(idDoPin) {
  const comentarios = ler(CHAVE_COMENTARIOS)
    .filter((comentario) => comentario.idDoPin === idDoPin && comentario.status === 'aprovado')
    .map((comentario) => ({
      id: comentario.id,
      idDoAutor: comentario.idDoAutor,
      autor: nomeDoUsuario(comentario.idDoAutor),
      data: comentario.criadoEm,
      texto: comentario.texto,
    }))
  const notas = ler(CHAVE_AVALIACOES)
    .filter((avaliacao) => avaliacao.idDoPin === idDoPin)
    .map((avaliacao) => avaliacao.nota)
  const confirmacoes = ler(CHAVE_CONFIRMACOES)
    .filter((confirmacao) => confirmacao.idDoPin === idDoPin)
    .map((confirmacao) => confirmacao.criadaEm)
    .sort()
  return { comentarios, notas, ultimaConfirmacao: confirmacoes.at(-1) ?? null }
}

// ---- O que o próprio usuário fez neste pin ----

export async function minhasInteracoes(idDoPin, idDoUsuario) {
  const doUsuario = (item) => item.idDoPin === idDoPin && item.idDoAutor === idDoUsuario
  return {
    avaliacao: ler(CHAVE_AVALIACOES).find(doUsuario) ?? null,
    // Inclui os comentários ainda em análise e os rejeitados, que só o autor vê.
    comentarios: ler(CHAVE_COMENTARIOS)
      .filter(doUsuario)
      .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm)),
    confirmou: ler(CHAVE_CONFIRMACOES).some(doUsuario),
  }
}

// ---- Avaliações (RF23, RF24) ----

// Um usuário tem no máximo uma avaliação por pin: salvar de novo altera a nota.
export async function salvarAvaliacao({ idDoPin, idDoAutor, nota }) {
  if (!Number.isInteger(nota) || nota < 1 || nota > NOTA_MAXIMA) {
    throw new Error(`Escolha uma nota de 1 a ${NOTA_MAXIMA}.`)
  }
  const outras = ler(CHAVE_AVALIACOES).filter(
    (avaliacao) => !(avaliacao.idDoPin === idDoPin && avaliacao.idDoAutor === idDoAutor),
  )
  gravar(CHAVE_AVALIACOES, [
    ...outras,
    { id: `avaliacao-${Date.now()}`, idDoPin, idDoAutor, nota, criadaEm: new Date().toISOString() },
  ])
}

export async function excluirAvaliacao(idDoPin, idDoAutor) {
  gravar(
    CHAVE_AVALIACOES,
    ler(CHAVE_AVALIACOES).filter(
      (avaliacao) => !(avaliacao.idDoPin === idDoPin && avaliacao.idDoAutor === idDoAutor),
    ),
  )
}

// ---- Comentários (RF22, RF24) ----

function validarTexto(texto) {
  const limpo = texto.trim()
  if (!limpo) throw new Error('Escreva o comentário.')
  if (limpo.length > TAMANHO_MAXIMO_DO_COMENTARIO) {
    throw new Error(`O comentário pode ter no máximo ${TAMANHO_MAXIMO_DO_COMENTARIO} caracteres.`)
  }
  return limpo
}

export async function buscarMeuComentario(id, idDoAutor) {
  const comentario = ler(CHAVE_COMENTARIOS).find(
    (item) => item.id === id && item.idDoAutor === idDoAutor,
  )
  if (!comentario) throw new Error('Comentário não encontrado.')
  return comentario
}

// O comentário novo entra como pendente e só aparece depois de aprovado (RF45).
export async function publicarComentario({ idDoPin, idDoAutor, texto }) {
  gravar(CHAVE_COMENTARIOS, [
    ...ler(CHAVE_COMENTARIOS),
    {
      id: `comentario-${Date.now()}`,
      idDoPin,
      idDoAutor,
      texto: validarTexto(texto),
      status: 'pendente',
      criadoEm: new Date().toISOString(),
    },
  ])
}

// O comentário editado volta para a moderação.
export async function editarComentario(id, idDoAutor, texto) {
  await buscarMeuComentario(id, idDoAutor)
  const limpo = validarTexto(texto)
  gravar(
    CHAVE_COMENTARIOS,
    ler(CHAVE_COMENTARIOS).map((comentario) =>
      comentario.id === id
        ? { ...comentario, texto: limpo, status: 'pendente', motivoRejeicao: null, dataAnalise: null }
        : comentario,
    ),
  )
}

export async function excluirComentario(id, idDoAutor) {
  await buscarMeuComentario(id, idDoAutor)
  gravar(
    CHAVE_COMENTARIOS,
    ler(CHAVE_COMENTARIOS).filter((comentario) => comentario.id !== id),
  )
}

// ---- Confirmações (RF25, RF57) ----

// Registra que as informações do pin continuam corretas. Cada usuário conta
// uma vez; confirmar de novo só atualiza a data.
export async function confirmarInformacoes(idDoPin, idDoAutor) {
  const outras = ler(CHAVE_CONFIRMACOES).filter(
    (confirmacao) => !(confirmacao.idDoPin === idDoPin && confirmacao.idDoAutor === idDoAutor),
  )
  gravar(CHAVE_CONFIRMACOES, [
    ...outras,
    { id: `confirmacao-${Date.now()}`, idDoPin, idDoAutor, criadaEm: new Date().toISOString() },
  ])
}

// ---- Moderação de comentários (RF40, RF41) ----

export async function listarComentariosPendentes() {
  return ler(CHAVE_COMENTARIOS)
    .filter((comentario) => comentario.status === 'pendente')
    .sort((a, b) => a.criadoEm.localeCompare(b.criadoEm))
    .map((comentario) => ({ ...comentario, nomeDoAutor: nomeDoUsuario(comentario.idDoAutor) }))
}

function analisarComentario(id, mudancas) {
  gravar(
    CHAVE_COMENTARIOS,
    ler(CHAVE_COMENTARIOS).map((comentario) =>
      comentario.id === id
        ? { ...comentario, ...mudancas, dataAnalise: new Date().toISOString() }
        : comentario,
    ),
  )
}

export async function aprovarComentario(id) {
  analisarComentario(id, { status: 'aprovado', motivoRejeicao: null })
}

// O motivo vem de uma lista pré-definida (RF41).
export async function rejeitarComentario(id, motivo) {
  if (!motivo) throw new Error('Selecione o motivo da rejeição.')
  analisarComentario(id, { status: 'rejeitado', motivoRejeicao: motivo })
}
