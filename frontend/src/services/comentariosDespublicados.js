// Comentários retirados do ar pelo moderador depois de uma denúncia (RF43).
// Enquanto não há back-end, guardamos só os identificadores no navegador.
const CHAVE = 'mapatea:comentariosDespublicados'

export function lerComentariosDespublicados() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE)) ?? []
  } catch {
    return []
  }
}

export function despublicarComentario(id) {
  const ids = lerComentariosDespublicados()
  if (!ids.includes(id)) localStorage.setItem(CHAVE, JSON.stringify([...ids, id]))
}
