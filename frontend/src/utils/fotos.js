// Regras das fotos de um pin (RF15 e RF52): no máximo três arquivos, nos
// formatos JPG, JPEG ou PNG, com limite de tamanho.
// Esta validação no navegador serve para avisar o usuário cedo; a validação
// definitiva (pela assinatura do arquivo) é do servidor (RNF05).
export const MAXIMO_DE_FOTOS = 3
export const TAMANHO_MAXIMO_MB = 5
const TIPOS_ACEITOS = ['image/jpeg', 'image/png']
export const TIPOS_ACEITOS_NO_CAMPO = TIPOS_ACEITOS.join(',')

// Enquanto não há back-end, as fotos ficam guardadas no navegador. Para caber,
// cada uma é reduzida para no máximo este lado, em JPEG.
const LADO_MAXIMO_PX = 1024
const QUALIDADE_JPEG = 0.75

export function validarFoto(arquivo) {
  if (!TIPOS_ACEITOS.includes(arquivo.type)) {
    return `"${arquivo.name}" não é uma imagem JPG, JPEG ou PNG.`
  }
  if (arquivo.size > TAMANHO_MAXIMO_MB * 1024 * 1024) {
    return `"${arquivo.name}" tem mais de ${TAMANHO_MAXIMO_MB} MB.`
  }
  return null
}

function carregarImagem(arquivo) {
  return new Promise((resolve, reject) => {
    const endereco = URL.createObjectURL(arquivo)
    const imagem = new Image()
    imagem.onload = () => {
      URL.revokeObjectURL(endereco)
      resolve(imagem)
    }
    imagem.onerror = () => {
      URL.revokeObjectURL(endereco)
      reject(new Error(`Não foi possível ler a imagem "${arquivo.name}".`))
    }
    imagem.src = endereco
  })
}

// Lê o arquivo escolhido e devolve a foto pronta para exibir e guardar.
export async function prepararFoto(arquivo) {
  const imagem = await carregarImagem(arquivo)
  const escala = Math.min(1, LADO_MAXIMO_PX / Math.max(imagem.width, imagem.height))
  const tela = document.createElement('canvas')
  tela.width = Math.round(imagem.width * escala)
  tela.height = Math.round(imagem.height * escala)
  tela.getContext('2d').drawImage(imagem, 0, 0, tela.width, tela.height)

  // Nome do arquivo sem a extensão, usado na descrição em texto da foto.
  const ponto = arquivo.name.lastIndexOf('.')
  const descricao = ponto > 0 ? arquivo.name.slice(0, ponto) : arquivo.name

  return { url: tela.toDataURL('image/jpeg', QUALIDADE_JPEG), descricao }
}
