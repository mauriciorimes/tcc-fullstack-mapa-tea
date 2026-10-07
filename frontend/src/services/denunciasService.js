// Denúncias de pins e de comentários (RF26, RF42, RF43).
// Por enquanto ficam no navegador; na API correspondem a /api/denuncias
// (registro pelo usuário) e /api/moderacao (listagem e análise pelo moderador).
import { buscarDetalhesDoLocal, despublicarLocal } from './locaisService'
import { despublicarComentario } from './comentariosDespublicados'
import { nomeDoUsuario } from './authService'
import { motivosPara } from '../mocks/motivosDeDenuncia'
import { denunciasIniciais } from '../mocks/contribuicoes'

const CHAVE = 'mapatea:denuncias'

function ler() {
  try {
    // Sem nada guardado, começa pelos dados de exemplo.
    return JSON.parse(localStorage.getItem(CHAVE)) ?? denunciasIniciais
  } catch {
    return denunciasIniciais
  }
}

function gravar(denuncias) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(denuncias))
  } catch {
    throw new Error('Não foi possível salvar neste navegador.')
  }
}

// A denúncia tem dois alvos possíveis, o pin ou um comentário dele.
function mesmoAlvo(a, b) {
  return a.idDoPin === b.idDoPin && (a.idDoComentario ?? null) === (b.idDoComentario ?? null)
}

// RF26: o usuário denuncia um pin ou um comentário, escolhendo o motivo em lista.
export async function registrarDenuncia({ idDoPin, idDoComentario = null, motivo, idDoAutor }) {
  const tipoDoAlvo = idDoComentario ? 'comentario' : 'pin'
  if (!motivosPara(tipoDoAlvo).some((opcao) => opcao.id === motivo)) {
    throw new Error('Selecione o motivo da denúncia.')
  }
  const denuncias = ler()
  const alvo = { idDoPin, idDoComentario }
  const repetida = denuncias.some(
    (denuncia) =>
      denuncia.status === 'pendente' && denuncia.idDoAutor === idDoAutor && mesmoAlvo(denuncia, alvo),
  )
  if (repetida) throw new Error('Você já enviou uma denúncia sobre este conteúdo. Ela está em análise.')

  gravar([
    ...denuncias,
    {
      id: `denuncia-${Date.now()}`,
      tipoDoAlvo,
      idDoPin,
      idDoComentario,
      motivo,
      idDoAutor,
      status: 'pendente',
      criadaEm: new Date().toISOString(),
    },
  ])
}

// RF42: lista das denúncias aguardando análise, da mais antiga para a mais nova,
// já com os dados do conteúdo denunciado para o moderador avaliar.
export async function listarDenunciasPendentes() {
  const pendentes = ler()
    .filter((denuncia) => denuncia.status === 'pendente')
    .sort((a, b) => a.criadaEm.localeCompare(b.criadaEm))

  return Promise.all(
    pendentes.map(async (denuncia) => {
      const pin = await buscarDetalhesDoLocal(denuncia.idDoPin).catch(() => null)
      const comentario = denuncia.idDoComentario
        ? pin?.comentarios.find((item) => item.id === denuncia.idDoComentario)
        : null
      const conteudoExiste =
        Boolean(pin) && pin.status === 'aprovado' && (denuncia.tipoDoAlvo === 'pin' || Boolean(comentario))
      return {
        ...denuncia,
        nomeDoPin: pin?.nome ?? null,
        comentario: comentario ?? null,
        conteudoExiste,
        nomeDoDenunciante: nomeDoUsuario(denuncia.idDoAutor),
      }
    }),
  )
}

// RF43: o moderador analisa a denúncia, mantendo ou despublicando o conteúdo.
export async function analisarDenuncia(id, decisao) {
  const denuncias = ler()
  const analisada = denuncias.find((denuncia) => denuncia.id === id)
  if (!analisada) throw new Error('Denúncia não encontrada.')
  const dataAnalise = new Date().toISOString()

  if (decisao === 'despublicar') {
    if (analisada.tipoDoAlvo === 'comentario') despublicarComentario(analisada.idDoComentario)
    else await despublicarLocal(analisada.idDoPin)
  }

  gravar(
    denuncias.map((denuncia) => {
      if (denuncia.id === id) {
        return { ...denuncia, status: decisao === 'despublicar' ? 'despublicado' : 'mantido', dataAnalise }
      }
      // Ao despublicar, as outras denúncias pendentes sobre o mesmo conteúdo são encerradas juntas.
      if (decisao === 'despublicar' && denuncia.status === 'pendente' && mesmoAlvo(denuncia, analisada)) {
        return { ...denuncia, status: 'despublicado', dataAnalise }
      }
      return denuncia
    }),
  )
}
