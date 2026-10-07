// Rascunho do cadastro de pin em andamento. Não há limite de tempo para
// concluir as etapas, e o que foi preenchido é preservado (RNF38): se a pessoa
// sair do cadastro, encontra tudo como deixou ao voltar.
// Fica guardado só neste navegador, separado por usuário.
function chave(idDoUsuario) {
  return `mapatea:rascunhoDePin:${idDoUsuario}`
}

export function lerRascunhoDePin(idDoUsuario) {
  try {
    return JSON.parse(localStorage.getItem(chave(idDoUsuario)))
  } catch {
    return null
  }
}

export function salvarRascunhoDePin(idDoUsuario, rascunho) {
  try {
    localStorage.setItem(chave(idDoUsuario), JSON.stringify(rascunho))
  } catch {
    // Sem espaço (por exemplo, por causa das fotos): o cadastro segue sem rascunho.
  }
}

export function apagarRascunhoDePin(idDoUsuario) {
  try {
    localStorage.removeItem(chave(idDoUsuario))
  } catch {
    // Nada a fazer.
  }
}
