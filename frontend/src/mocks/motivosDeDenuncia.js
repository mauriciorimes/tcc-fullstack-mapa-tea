// Listas pré-definidas de motivos de denúncia (RF26), uma para cada tipo de
// alvo: o pin ou um comentário.
// A documentação técnica exige a lista, mas não enumera os motivos; estes são
// uma proposta e devem ser registrados no texto do TCC. Os motivos de
// comentário acompanham os que o moderador usa para rejeitar comentários (RF41).
export const motivosDeDenuncia = [
  { id: 'informacao-incorreta', nome: 'Informação incorreta', alvos: ['pin', 'comentario'] },
  { id: 'local-inexistente', nome: 'O local não existe ou fechou', alvos: ['pin'] },
  { id: 'conteudo-inapropriado', nome: 'Conteúdo inapropriado', alvos: ['pin', 'comentario'] },
  { id: 'fora-do-escopo', nome: 'Conteúdo fora do escopo', alvos: ['pin', 'comentario'] },
]

// Motivos que podem ser escolhidos para o tipo de alvo: 'pin' ou 'comentario'.
export function motivosPara(tipoDoAlvo) {
  return motivosDeDenuncia.filter((motivo) => motivo.alvos.includes(tipoDoAlvo))
}

export function nomeDoMotivo(id) {
  return motivosDeDenuncia.find((motivo) => motivo.id === id)?.nome ?? id
}
