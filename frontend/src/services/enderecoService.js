// Busca de endereços pelo Nominatim, o serviço gratuito do OpenStreetMap.
// Política de uso: no máximo 1 busca por segundo e nada de autocompletar a
// cada tecla, por isso a busca só acontece quando o usuário envia o formulário.
// https://operations.osmfoundation.org/policies/nominatim/

const URL_NOMINATIM = 'https://nominatim.openstreetmap.org/search'

async function consultar(texto) {
  const parametros = new URLSearchParams({
    q: texto,
    format: 'jsonv2',
    countrycodes: 'br',
    'accept-language': 'pt-BR',
    limit: '5',
  })

  const resposta = await fetch(`${URL_NOMINATIM}?${parametros}`)
  if (!resposta.ok) throw new Error('Não foi possível buscar o endereço agora. Tente novamente.')

  const resultados = await resposta.json()

  // O mesmo lugar pode vir mais de uma vez (ex.: a cidade como ponto e como área).
  const nomesVistos = new Set()
  return resultados
    .filter((resultado) => {
      if (nomesVistos.has(resultado.display_name)) return false
      nomesVistos.add(resultado.display_name)
      return true
    })
    .map((resultado) => ({
      id: resultado.place_id,
      nome: resultado.display_name,
      latitude: Number(resultado.lat),
      longitude: Number(resultado.lon),
    }))
}

function esperar(ms) {
  return new Promise((resolver) => setTimeout(resolver, ms))
}

// Versões mais amplas do texto digitado, usadas quando ele não é encontrado:
// primeiro sem o trecho inicial (a rua ou o número), depois só o final (a cidade).
function buscasMaisAmplas(texto) {
  const partes = texto.split(',').map((parte) => parte.trim()).filter(Boolean)
  if (partes.length > 1) return [partes.slice(1).join(', '), partes.at(-1)]
  const palavras = texto.split(/\s+/).filter(Boolean)
  if (palavras.length > 2) return [palavras.slice(-2).join(' '), palavras.at(-1)]
  if (palavras.length === 2) return [palavras[1]]
  return []
}

// RF47: converte o endereço digitado em posições no mapa.
// RNF34: quando o endereço não é localizado, devolve sugestões de endereços
// próximos (a busca é repetida de forma mais ampla), marcadas com "aproximados".
export async function buscarEndereco(texto) {
  const enderecos = await consultar(texto)
  if (enderecos.length > 0) return { enderecos, aproximados: false }

  for (const maisAmpla of [...new Set(buscasMaisAmplas(texto))]) {
    await esperar(1100) // respeita o limite de uma busca por segundo do Nominatim
    const sugestoes = await consultar(maisAmpla)
    if (sugestoes.length > 0) return { enderecos: sugestoes, aproximados: true }
  }
  return { enderecos: [], aproximados: false }
}
