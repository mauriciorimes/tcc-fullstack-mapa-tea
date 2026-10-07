// Lista pré-definida de motivos para o moderador rejeitar um comentário (RF41).
export const motivosDeRejeicaoDeComentario = [
  { id: 'conteudo-inapropriado', nome: 'Conteúdo inapropriado' },
  { id: 'fora-do-escopo', nome: 'Conteúdo fora do escopo' },
  { id: 'texto-curto', nome: 'Texto curto' },
]

export function nomeDoMotivoDeRejeicao(id) {
  return motivosDeRejeicaoDeComentario.find((motivo) => motivo.id === id)?.nome ?? id
}
