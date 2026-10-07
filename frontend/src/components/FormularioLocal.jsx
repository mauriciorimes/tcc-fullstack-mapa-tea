import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { categorias, MAXIMO_DE_CATEGORIAS } from '../mocks/categorias'
import { NOTA_MAXIMA } from '../services/interacoesService'
import SimboloDaCategoria from './SimboloDaCategoria'
import CampoDeFotos from './CampoDeFotos'

// Distância que o pin anda a cada acionamento dos botões de ajuste.
const PASSOS_EM_METROS = [10, 100, 1000]

const DIRECOES = [
  { nome: 'Norte', simbolo: '↑', norte: 1, leste: 0 },
  { nome: 'Sul', simbolo: '↓', norte: -1, leste: 0 },
  { nome: 'Oeste', simbolo: '←', norte: 0, leste: -1 },
  { nome: 'Leste', simbolo: '→', norte: 0, leste: 1 },
]

const NOTAS = Array.from({ length: NOTA_MAXIMA }, (_, indice) => indice + 1)

const NOME_DA_ETAPA = {
  local: 'Local',
  fotos: 'Fotos',
  categorias: 'Categorias',
  descricao: 'Descrição',
  avaliacao: 'Avaliação',
}

// Formulário em etapas da solicitação de pin (RNF35): local, fotos,
// categorias, descrição e avaliação. Não há limite de tempo por etapa, e o que
// já foi preenchido é preservado ao ir e voltar (RNF38).
//
// É usado em três situações:
// - cadastro: recebe "ponto" (posição marcada no mapa) e "comAvaliacao";
// - edição de solicitação pendente ou de pin publicado: recebe "inicial".
export default function FormularioLocal({
  ponto,
  inicial,
  rascunho,
  titulo = 'Cadastrar novo local',
  rotuloDoBotao = 'Enviar para moderação',
  comAvaliacao = false,
  onSalvar,
  onCancelar,
  onMoverPonto,
  onMudarCategorias,
  onRascunho,
}) {
  const origem = rascunho ?? inicial ?? {}
  const [passo, setPasso] = useState(PASSOS_EM_METROS[0])
  const [nome, setNome] = useState(origem.nome ?? '')
  const [descricao, setDescricao] = useState(origem.descricao ?? '')
  const [fotos, setFotos] = useState(origem.fotos ?? [])
  const [selecionadas, setSelecionadas] = useState(origem.categorias ?? [])
  const [nota, setNota] = useState(rascunho?.nota ?? null)
  const [solicitouSelo, setSolicitouSelo] = useState(rascunho?.solicitouSelo ?? false)
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  const etapas = [
    ...(ponto && onMoverPonto ? ['local'] : []),
    'fotos',
    'categorias',
    'descricao',
    ...(comAvaliacao ? ['avaliacao'] : []),
  ]
  const [indice, setIndice] = useState(Math.min(rascunho?.etapa ?? 0, etapas.length - 1))
  const etapa = etapas[indice]
  const ultima = indice === etapas.length - 1
  const tituloDaEtapa = useRef(null)

  // Ao trocar de etapa, o foco vai para o título dela, para leitores de tela.
  const primeiraVez = useRef(true)
  useEffect(() => {
    if (primeiraVez.current) primeiraVez.current = false
    else tituloDaEtapa.current?.focus()
  }, [indice])

  // Guarda o que já foi preenchido, para retomar depois (RNF38).
  useEffect(() => {
    onRascunho?.({ etapa: indice, nome, descricao, fotos, categorias: selecionadas, nota, solicitouSelo })
    // onRascunho fica de fora: só os dados preenchidos disparam a gravação.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indice, nome, descricao, fotos, selecionadas, nota, solicitouSelo])

  function alternarCategoria(id) {
    const novas = selecionadas.includes(id)
      ? selecionadas.filter((item) => item !== id)
      : [...selecionadas, id]
    setSelecionadas(novas)
    // Avisa o mapa, para o pin em cadastro já mostrar o ícone das categorias.
    onMudarCategorias?.(novas)
  }

  // Mensagens objetivas e literais, conferidas a cada etapa (RNF36).
  function problemaDaEtapa(qual) {
    if (qual === 'categorias' && (selecionadas.length < 1 || selecionadas.length > MAXIMO_DE_CATEGORIAS)) {
      return 'A solicitação deve conter de uma a três categorias.'
    }
    if (qual === 'descricao' && !nome.trim()) return 'Informe o nome do local.'
    return null
  }

  function avancar() {
    const problema = problemaDaEtapa(etapa)
    setErro(problema ?? '')
    if (!problema) setIndice(indice + 1)
  }

  function voltar() {
    setErro('')
    setIndice(indice - 1)
  }

  async function enviar(evento) {
    evento.preventDefault()
    if (!ultima) {
      avancar()
      return
    }
    // Confere todas as etapas e volta para a primeira que tiver problema.
    const comProblema = etapas.find((qual) => problemaDaEtapa(qual))
    if (comProblema) {
      setIndice(etapas.indexOf(comProblema))
      setErro(problemaDaEtapa(comProblema))
      return
    }
    setErro('')
    setEnviando(true)
    await onSalvar({
      nome: nome.trim(),
      descricao: descricao.trim(),
      fotos,
      categorias: selecionadas,
      // Na edição a posição só muda se a tela oferecer o ajuste do ponto.
      ...(ponto && { latitude: ponto.latitude, longitude: ponto.longitude }),
      ...(comAvaliacao && { nota, solicitouSelo }),
    })
    setEnviando(false)
  }

  return (
    <form onSubmit={enviar} noValidate>
      {titulo && <h2 className="h5">{titulo}</h2>}
      <h3 className="h6 text-body-secondary" tabIndex={-1} ref={tituloDaEtapa}>
        Etapa {indice + 1} de {etapas.length}: {NOME_DA_ETAPA[etapa]}
      </h3>

      {erro && (
        <div className="alert alert-danger py-2" role="alert">
          {erro}
        </div>
      )}

      {etapa === 'local' && (
        <>
          <p>
            Posição marcada: {ponto.latitude.toFixed(5)}, {ponto.longitude.toFixed(5)}
            <br />
            Para ajustar, arraste o pin no mapa ou use os botões abaixo.
          </p>

          {/* Ajuste da posição sem mouse (RNF20) */}
          <fieldset className="mb-3">
            <legend className="form-label fs-6">Mover o pin</legend>
            <div className="d-flex flex-wrap align-items-center gap-2">
              {DIRECOES.map((direcao) => (
                <button
                  key={direcao.nome}
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => onMoverPonto(direcao.norte * passo, direcao.leste * passo)}
                >
                  <span aria-hidden="true">{direcao.simbolo}</span> {direcao.nome}
                </button>
              ))}
              <label htmlFor="passo-do-pin" className="visually-hidden">
                Distância de cada movimento
              </label>
              <select
                id="passo-do-pin"
                className="form-select form-select-sm w-auto"
                value={passo}
                onChange={(evento) => setPasso(Number(evento.target.value))}
              >
                {PASSOS_EM_METROS.map((metros) => (
                  <option key={metros} value={metros}>
                    {metros >= 1000 ? `${metros / 1000} km` : `${metros} m`} por vez
                  </option>
                ))}
              </select>
            </div>
          </fieldset>
        </>
      )}

      {etapa === 'fotos' && (
        <div className="mb-3">
          <CampoDeFotos id="fotos-local" fotos={fotos} onMudar={setFotos} />
        </div>
      )}

      {etapa === 'categorias' && (
        <fieldset className="mb-3">
          <legend className="form-label fs-6">Categorias (de uma a três)</legend>
          {ponto && (
            <p className="small text-body-secondary mb-2">
              O desenho do pin no mapa muda conforme as categorias marcadas.
            </p>
          )}
          {categorias.map((categoria) => {
            const marcada = selecionadas.includes(categoria.id)
            return (
              <div className="form-check" key={categoria.id}>
                <input
                  id={`categoria-${categoria.id}`}
                  type="checkbox"
                  className="form-check-input"
                  checked={marcada}
                  // RF13: no máximo três categorias por solicitação.
                  disabled={!marcada && selecionadas.length >= MAXIMO_DE_CATEGORIAS}
                  onChange={() => alternarCategoria(categoria.id)}
                />
                <label htmlFor={`categoria-${categoria.id}`} className="form-check-label">
                  <SimboloDaCategoria categoria={categoria} /> {categoria.nome}
                </label>
              </div>
            )
          })}
          {/* RF11: sugerir uma categoria que ainda não existe. */}
          <p className="small mt-2 mb-0">
            Não encontrou a categoria? <Link to="/sugerir-categoria">Sugerir nova categoria</Link>
          </p>
        </fieldset>
      )}

      {etapa === 'descricao' && (
        <>
          <div className="mb-3">
            <label htmlFor="nome-local" className="form-label">
              Nome do local
            </label>
            <input
              id="nome-local"
              className="form-control"
              value={nome}
              onChange={(evento) => setNome(evento.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label htmlFor="descricao-local" className="form-label">
              Descrição
            </label>
            <textarea
              id="descricao-local"
              className="form-control"
              rows="3"
              value={descricao}
              onChange={(evento) => setDescricao(evento.target.value)}
            />
          </div>
        </>
      )}

      {etapa === 'avaliacao' && (
        <>
          {/* RF16: a avaliação na solicitação é opcional. */}
          <fieldset className="mb-3">
            <legend className="form-label fs-6">Sua avaliação do local (opcional)</legend>
            <div className="form-check">
              <input
                id="nota-nenhuma"
                type="radio"
                name="nota"
                className="form-check-input"
                checked={nota === null}
                onChange={() => setNota(null)}
              />
              <label htmlFor="nota-nenhuma" className="form-check-label">
                Não avaliar agora
              </label>
            </div>
            {NOTAS.map((valor) => (
              <div className="form-check" key={valor}>
                <input
                  id={`nota-${valor}`}
                  type="radio"
                  name="nota"
                  className="form-check-input"
                  checked={nota === valor}
                  onChange={() => setNota(valor)}
                />
                <label htmlFor={`nota-${valor}`} className="form-check-label">
                  Nota {valor} de {NOTA_MAXIMA}
                </label>
              </div>
            ))}
          </fieldset>

          {/* RF17: o usuário indica que está no local que está cadastrando. */}
          <div className="form-check mb-3">
            <input
              id="solicitar-selo"
              type="checkbox"
              className="form-check-input"
              checked={solicitouSelo}
              onChange={(evento) => setSolicitouSelo(evento.target.checked)}
              aria-describedby="solicitar-selo-ajuda"
            />
            <label htmlFor="solicitar-selo" className="form-check-label">
              Estou neste local agora e quero solicitar o selo de localidade
            </label>
            <div id="solicitar-selo-ajuda" className="form-text">
              Ao enviar, o sistema compara a sua posição com a do pin. O selo é concedido se você
              estiver a menos de 150 metros. Sua posição é usada só nessa comparação e não é
              guardada. Sem permissão de localização, o local é enviado sem o selo.
            </div>
          </div>
        </>
      )}

      <div className="d-flex flex-wrap gap-2">
        {indice > 0 && (
          <button type="button" className="btn btn-outline-secondary" onClick={voltar}>
            <span aria-hidden="true">← </span>Voltar
          </button>
        )}
        <button type="submit" className="btn btn-primary" disabled={enviando}>
          {!ultima ? 'Avançar' : enviando ? 'Enviando…' : rotuloDoBotao}
          {!ultima && <span aria-hidden="true"> →</span>}
        </button>
        <button type="button" className="btn btn-outline-secondary" onClick={onCancelar}>
          Cancelar
        </button>
      </div>
    </form>
  )
}
