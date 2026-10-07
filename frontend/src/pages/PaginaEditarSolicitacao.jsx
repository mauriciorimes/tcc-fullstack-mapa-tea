import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { useAuth } from '../contexts/authContext'
import {
  atualizarSolicitacao,
  buscarDetalhesDoLocal,
  editarPinPublicado,
} from '../services/locaisService'
import FormularioLocal from '../components/FormularioLocal'
import MapaDoLocal from '../components/MapaDoLocal'

const METROS_POR_GRAU = 111320

// Tela de edição de um local, usada em duas situações:
// - o autor edita a própria solicitação enquanto ela está pendente (RF19);
// - o moderador edita um pin já publicado (RF37), com "comoModerador".
// Depois de publicado, o autor não edita mais o pin (RF56).
export default function PaginaEditarSolicitacao({ comoModerador = false }) {
  const { id } = useParams()
  const { usuario } = useAuth()
  const navegar = useNavigate()
  const [resultado, setResultado] = useState(null)
  const [ponto, setPonto] = useState(null)
  const [erroAoSalvar, setErroAoSalvar] = useState('')
  const titulo = comoModerador ? 'Editar pin' : 'Editar solicitação'
  const enderecoDeVolta = comoModerador ? `/local/${id}` : '/minhas-solicitacoes'

  useEffect(() => {
    document.title = `${comoModerador ? 'Editar pin' : 'Editar solicitação'} – Mapa TEA`
    buscarDetalhesDoLocal(id)
      .then((local) => {
        setResultado({ local })
        setPonto({ latitude: local.latitude, longitude: local.longitude })
      })
      .catch((falha) => setResultado({ erro: falha.message }))
  }, [id, comoModerador])

  async function salvar(dados) {
    try {
      if (comoModerador) {
        await editarPinPublicado(id, dados)
        navegar(enderecoDeVolta, { state: { mensagem: 'As alterações no pin foram salvas.' } })
      } else {
        await atualizarSolicitacao(id, usuario.id, dados)
        navegar(enderecoDeVolta, {
          state: { mensagem: `A solicitação "${dados.nome}" foi atualizada.` },
        })
      }
    } catch (falha) {
      setErroAoSalvar(falha.message)
    }
  }

  // Move o ponto alguns metros para o norte e para o leste (valores negativos: sul e oeste).
  function moverPonto(metrosNorte, metrosLeste) {
    setPonto((atual) => ({
      latitude: atual.latitude + metrosNorte / METROS_POR_GRAU,
      longitude:
        atual.longitude +
        metrosLeste / (METROS_POR_GRAU * Math.cos((atual.latitude * Math.PI) / 180)),
    }))
  }

  const local = resultado?.local
  let impedimento = resultado?.erro
  if (local && comoModerador && local.status !== 'aprovado') {
    impedimento = 'Este local não está publicado.'
  } else if (local && !comoModerador && local.idDoAutor !== usuario.id) {
    impedimento = 'Local não encontrado.'
  } else if (local && !comoModerador && local.status !== 'pendente') {
    impedimento = 'Esta solicitação já foi analisada e não pode mais ser editada.'
  }

  return (
    <main className="container py-4">
      <Link className="btn btn-outline-secondary btn-sm mb-3" to={enderecoDeVolta}>
        <span aria-hidden="true">← </span>
        {comoModerador ? 'Voltar ao local' : 'Voltar às minhas solicitações'}
      </Link>

      <h1 className="h3">{titulo}</h1>

      {!resultado && <p role="status">Carregando…</p>}

      {impedimento && (
        <div className="alert alert-warning" role="alert">
          {impedimento}
        </div>
      )}

      {local && ponto && !impedimento && (
        <div className="row g-4">
          <div className="col-lg-7">
            {erroAoSalvar && (
              <div className="alert alert-danger py-2" role="alert">
                {erroAoSalvar}
              </div>
            )}
            <FormularioLocal
              titulo=""
              rotuloDoBotao="Salvar alterações"
              inicial={local}
              ponto={ponto}
              onMoverPonto={moverPonto}
              onSalvar={salvar}
              onCancelar={() => navegar(enderecoDeVolta)}
            />
          </div>

          <section className="col-lg-5" aria-labelledby="titulo-posicao">
            <h2 id="titulo-posicao" className="h5">
              Localização
            </h2>
            {/* A chave faz o mapa pequeno acompanhar o ponto quando ele é movido. */}
            <MapaDoLocal
              key={`${ponto.latitude},${ponto.longitude}`}
              local={{ ...local, ...ponto }}
            />
            <p className="small text-body-secondary mt-2 mb-0">
              Coordenadas: {ponto.latitude.toFixed(5)}, {ponto.longitude.toFixed(5)}. Para mudar o
              ponto, use os botões da etapa Local.
            </p>
          </section>
        </div>
      )}
    </main>
  )
}
