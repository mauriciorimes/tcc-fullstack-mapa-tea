import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import Mapa from '../components/Mapa'
import FormularioLocal from '../components/FormularioLocal'
import ListaLocais from '../components/ListaLocais'
import PertoDeMim from '../components/PertoDeMim'
import SelecaoDoLocal from '../components/SelecaoDoLocal'
import FiltroDeCategorias from '../components/FiltroDeCategorias'
import PinExistente from '../components/PinExistente'
import { listarLocais, cadastrarLocal, pinPublicadoProximo } from '../services/locaisService'
import { confirmarInformacoes, salvarAvaliacao } from '../services/interacoesService'
import {
  acompanharMinhaPosicao,
  deveTrocarPosicao,
  lerUltimaPosicao,
  salvarUltimaPosicao,
  verificarPresenca,
  PRECISAO_ACEITAVEL_METROS,
} from '../services/localizacaoService'
import { distanciaEmKm } from '../utils/distancia'
import { lerVisaoDoMapa } from '../utils/visaoDoMapa'
import { apagarRascunhoDePin, lerRascunhoDePin, salvarRascunhoDePin } from '../utils/rascunhoDePin'
import { useAuth } from '../contexts/authContext'

// Ao abrir o site, retoma a última posição confiável deste navegador.
function posicaoInicial() {
  const salva = lerUltimaPosicao()
  return salva ? { ...salva, restaurada: true } : null
}

// Texto sobre o selo de localidade, para a mensagem de envio (RF51).
function textoDoSelo(selo) {
  if (!selo) return ''
  if (selo.concedido) {
    return ` Selo de localidade concedido: você estava a ${Math.round(selo.distanciaMetros)} metros do local.`
  }
  if (selo.distanciaMetros === null) {
    return ' Selo de localidade não concedido: não foi possível obter a sua localização.'
  }
  return ` Selo de localidade não concedido: você estava a ${Math.round(selo.distanciaMetros)} metros do local, e o limite é de 150 metros.`
}

// Tela inicial: o mapa com os pins, o filtro, a lista de locais e o cadastro de local.
export default function PaginaMapa() {
  const navegar = useNavigate()
  const { usuario } = useAuth()
  const [locais, setLocais] = useState([])
  // Cadastro em andamento que o usuário deixou sem concluir (RNF38).
  const [rascunho] = useState(() => (usuario ? lerRascunhoDePin(usuario.id) : null))
  const [pontoNovo, setPontoNovo] = useState(rascunho?.ponto ?? null)
  const [selecionandoLocal, setSelecionandoLocal] = useState(false)
  const [categoriasDoPontoNovo, setCategoriasDoPontoNovo] = useState(rascunho?.categorias ?? [])
  const [categoriasFiltradas, setCategoriasFiltradas] = useState([])
  const centroDoMapa = useRef(null)
  const [minhaPosicao, setMinhaPosicao] = useState(posicaoInicial)
  // Ao voltar de outra tela, o mapa retoma o trecho que estava sendo visto,
  // em vez de ir para a posição do usuário.
  const [retomouVisao] = useState(() => Boolean(lerVisaoDoMapa()))
  const [foco, setFoco] = useState(() => {
    if (rascunho?.ponto) return { ...rascunho.ponto, zoom: 17 }
    return minhaPosicao && !retomouVisao ? { ...minhaPosicao, zoom: 13 } : null
  })
  const [mensagem, setMensagem] = useState(
    rascunho ? 'Retomamos o cadastro que você deixou em andamento.' : '',
  )
  const [erroAoSalvar, setErroAoSalvar] = useState('')
  const [acabouDeEnviar, setAcabouDeEnviar] = useState(false)

  const [buscandoPosicao, setBuscandoPosicao] = useState(false)
  const [erroPosicao, setErroPosicao] = useState('')
  const [raioKm, setRaioKm] = useState(null)
  const [ajustandoPosicao, setAjustandoPosicao] = useState(false)
  const pararAcompanhamento = useRef(null)
  const posicaoAtual = useRef(minhaPosicao)
  posicaoAtual.current = minhaPosicao
  const raioAtual = useRef(raioKm)
  raioAtual.current = raioKm
  const dadosDoRascunho = useRef(rascunho)

  useEffect(() => {
    document.title = 'Mapa TEA'
    listarLocais().then(setLocais)

    // Se o usuário já deu permissão antes, busca a melhor posição sozinho ao abrir.
    // Sem permissão, não pergunta: o pedido só aparece quando ele clica no botão.
    navigator.permissions
      ?.query({ name: 'geolocation' })
      .then((permissao) => {
        if (permissao.state === 'granted') localizar({ automatico: true })
      })
      .catch(() => {})

    return () => pararAcompanhamento.current?.()
    // Roda só uma vez, ao abrir a página.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // O que aparece no mapa e na lista: pins publicados, filtrados por categoria
  // e, com a posição do usuário, também por raio e ordenados do mais perto.
  const locaisVisiveis = useMemo(() => {
    // RF44: o mapa mostra apenas os pins aprovados pela moderação. As
    // solicitações pendentes ficam na tela "Minhas solicitações" de quem enviou.
    // RF02: com o filtro, ficam os locais que têm todas as categorias marcadas.
    const noMapa = locais.filter(
      (local) =>
        local.status === 'aprovado' &&
        categoriasFiltradas.every((categoria) => local.categorias.includes(categoria)),
    )
    if (!minhaPosicao) return noMapa
    const aproximada = (minhaPosicao.precisaoMetros ?? 0) > PRECISAO_ACEITAVEL_METROS
    return noMapa
      .map((local) => ({
        ...local,
        distanciaKm: distanciaEmKm(minhaPosicao, local),
        distanciaAproximada: aproximada,
      }))
      .filter((local) => raioKm == null || local.distanciaKm <= raioKm)
      .sort((a, b) => a.distanciaKm - b.distanciaKm)
  }, [locais, minhaPosicao, raioKm, categoriasFiltradas])

  // RF48: pin já publicado a até 30 metros do ponto que está sendo cadastrado.
  const existente = useMemo(
    () => (pontoNovo ? pinPublicadoProximo(locais, pontoNovo) : null),
    [locais, pontoNovo],
  )

  // A posição chega em etapas: primeiro aproximada, depois mais precisa.
  // No clique do usuário, qualquer posição recebida é usada; na busca
  // automática, só as que não piorarem a posição atual.
  function localizar({ automatico = false } = {}) {
    pararAcompanhamento.current?.()
    setBuscandoPosicao(true)
    setErroPosicao('')
    pararAcompanhamento.current = acompanharMinhaPosicao({
      onPosicao(dados) {
        const posicao = { ...dados, origem: 'navegador' }
        if (automatico && !deveTrocarPosicao(posicao, posicaoAtual.current)) return
        setMinhaPosicao(posicao)
        if (posicao.precisaoMetros <= PRECISAO_ACEITAVEL_METROS) salvarUltimaPosicao(posicao)
        if (!(automatico && (retomouVisao || rascunho))) enquadrar(posicao, raioAtual.current)
      },
      onErro(erro) {
        setErroPosicao(erro.message)
      },
      onFim() {
        setBuscandoPosicao(false)
      },
    })
  }

  function alternarAjuste() {
    pararAcompanhamento.current?.()
    setAjustandoPosicao((atual) => !atual)
  }

  function moverMinhaPosicao(ponto) {
    const posicao = { ...ponto, precisaoMetros: null, origem: 'ajuste' }
    setMinhaPosicao(posicao)
    salvarUltimaPosicao(posicao)
  }

  function escolherEndereco(endereco) {
    pararAcompanhamento.current?.()
    setErroPosicao('')
    const posicao = {
      latitude: endereco.latitude,
      longitude: endereco.longitude,
      precisaoMetros: null,
      origem: 'endereco',
      descricao: endereco.nome,
    }
    setMinhaPosicao(posicao)
    salvarUltimaPosicao(posicao)
    enquadrar(posicao, raioKm)
  }

  // Mostra no mapa o maior entre o raio de busca e a margem de erro da posição.
  function enquadrar(posicao, raio) {
    const margemKm = (posicao.precisaoMetros ?? 0) / 1000
    const enquadrarKm = Math.max(raio ?? 0, margemKm > 1 ? margemKm : 0)
    setFoco({ ...posicao, zoom: 15, raioKm: enquadrarKm || null })
  }

  function mudarRaio(km) {
    setRaioKm(km)
    enquadrar(minhaPosicao, km)
  }

  // Encerra o cadastro em andamento e apaga o rascunho.
  function limparCadastro() {
    setPontoNovo(null)
    setCategoriasDoPontoNovo([])
    setSelecionandoLocal(false)
    dadosDoRascunho.current = null
    if (usuario) apagarRascunhoDePin(usuario.id)
  }

  async function salvarLocal({ nota, solicitouSelo, ...dados }) {
    let novoLocal
    let selo = null
    try {
      // RF51: o selo é decidido comparando a posição do usuário com a do pin.
      // A posição do usuário não é guardada: só o resultado (RNF12).
      if (solicitouSelo) selo = await verificarPresenca(dados)
      novoLocal = await cadastrarLocal({
        ...dados,
        idDoAutor: usuario.id,
        seloSolicitado: Boolean(solicitouSelo),
        seloLocalidade: selo?.concedido ?? false,
      })
      // RF16: avaliação opcional feita junto com a solicitação.
      if (nota) await salvarAvaliacao({ idDoPin: novoLocal.id, idDoAutor: usuario.id, nota })
    } catch (falha) {
      setErroAoSalvar(falha.message)
      return
    }
    setErroAoSalvar('')
    setLocais((atuais) => [...atuais, novoLocal])
    limparCadastro()
    setMensagem(
      `"${novoLocal.nome}" foi enviado para moderação. Ele aparece no mapa depois de aprovado.${textoDoSelo(selo)}`,
    )
    setAcabouDeEnviar(true)
  }

  // Abre a tela de detalhes do pin (RF03).
  function verDetalhes(local) {
    if (ajustandoPosicao || selecionandoLocal || pontoNovo) return
    navegar(`/local/${local.id}`)
  }

  // Cadastro de local: primeiro o usuário escolhe o ponto, depois preenche as etapas.
  // RF12: só o usuário autenticado cria solicitação de pin. O visitante é
  // levado à tela de login e volta para o mapa depois de entrar.
  function pedirLogin() {
    navegar('/entrar', { state: { de: '/', aviso: 'Entre na sua conta para adicionar um local.' } })
  }

  function iniciarAdicao() {
    if (!usuario) return pedirLogin()
    setAcabouDeEnviar(false)
    pararAcompanhamento.current?.()
    setAjustandoPosicao(false)
    setPontoNovo(null)
    setSelecionandoLocal(true)
    setMensagem('')
  }

  function guardarRascunho(ponto, dados) {
    dadosDoRascunho.current = { ...dados, ponto }
    salvarRascunhoDePin(usuario.id, dadosDoRascunho.current)
  }

  function selecionarPonto(ponto) {
    if (!usuario) return pedirLogin()
    const novo = { latitude: ponto.latitude, longitude: ponto.longitude }
    setAcabouDeEnviar(false)
    setPontoNovo(novo)
    setSelecionandoLocal(false)
    setMensagem('')
    if (dadosDoRascunho.current) guardarRascunho(novo, dadosDoRascunho.current)
  }

  function selecionarPontoPorEndereco(endereco) {
    selecionarPonto(endereco)
    setFoco({ latitude: endereco.latitude, longitude: endereco.longitude, zoom: 17 })
  }

  function cancelarAdicao() {
    setErroAoSalvar('')
    setMensagem('')
    limparCadastro()
  }

  // Move o pin novo alguns metros para o norte e para o leste (valores negativos: sul e oeste).
  function moverPontoNovo(metrosNorte, metrosLeste) {
    const METROS_POR_GRAU = 111320
    const latitude = pontoNovo.latitude + metrosNorte / METROS_POR_GRAU
    const longitude =
      pontoNovo.longitude +
      metrosLeste / (METROS_POR_GRAU * Math.cos((pontoNovo.latitude * Math.PI) / 180))
    selecionarPonto({ latitude, longitude })
    setFoco({ latitude, longitude, manterZoom: true })
  }

  // RF49: no lugar de um cadastro repetido, confirma as informações do pin que já existe.
  async function confirmarExistente() {
    await confirmarInformacoes(existente.pin.id, usuario.id)
    const nome = existente.pin.nome
    limparCadastro()
    setMensagem(`Obrigado. Sua confirmação das informações de "${nome}" foi registrada.`)
  }

  let painel
  if (pontoNovo && existente) {
    painel = (
      <PinExistente
        pin={existente.pin}
        distanciaMetros={existente.distanciaMetros}
        onConfirmar={confirmarExistente}
        onEscolherOutroPonto={iniciarAdicao}
        onCancelar={cancelarAdicao}
      />
    )
  } else if (pontoNovo) {
    painel = (
      <FormularioLocal
        ponto={pontoNovo}
        // O rascunho atual: preserva o que foi preenchido se o formulário for remontado.
        rascunho={dadosDoRascunho.current}
        comAvaliacao
        onSalvar={salvarLocal}
        onCancelar={cancelarAdicao}
        onMoverPonto={moverPontoNovo}
        onMudarCategorias={setCategoriasDoPontoNovo}
        onRascunho={(dados) => guardarRascunho(pontoNovo, dados)}
      />
    )
  } else if (selecionandoLocal) {
    painel = (
      <SelecaoDoLocal
        temMinhaPosicao={Boolean(minhaPosicao)}
        onUsarCentroDoMapa={() => selecionarPonto(centroDoMapa.current())}
        onUsarMinhaPosicao={() => selecionarPonto(minhaPosicao)}
        onEscolherEndereco={selecionarPontoPorEndereco}
        onCancelar={cancelarAdicao}
      />
    )
  } else {
    painel = (
      <>
        <button
          type="button"
          className="btn btn-primary w-100 mb-3"
          onClick={iniciarAdicao}
          disabled={ajustandoPosicao}
        >
          Adicionar local
        </button>
        <FiltroDeCategorias selecionadas={categoriasFiltradas} onMudar={setCategoriasFiltradas} />
        <PertoDeMim
          minhaPosicao={minhaPosicao}
          buscando={buscandoPosicao}
          erro={erroPosicao}
          raioKm={raioKm}
          ajustando={ajustandoPosicao}
          onLocalizar={() => localizar()}
          onMudarRaio={mudarRaio}
          onAlternarAjuste={alternarAjuste}
          onEscolherEndereco={escolherEndereco}
        />
        <h2 className="h5">
          {minhaPosicao ? 'Locais mais próximos' : 'Locais'} ({locaisVisiveis.length})
        </h2>
        <ListaLocais
          locais={locaisVisiveis}
          mensagemVazia={
            categoriasFiltradas.length > 0
              ? 'Nenhum local com todas as categorias marcadas no filtro.'
              : raioKm
                ? `Nenhum local em um raio de ${raioKm} km.`
                : 'Nenhum local cadastrado.'
          }
          onVerDetalhes={verDetalhes}
          onVerNoMapa={(local) => setFoco({ ...local, zoom: 15 })}
        />
      </>
    )
  }

  return (
    <main className="container-fluid py-3">
      <h1 className="visually-hidden">Mapa de locais</h1>
      <div className="row g-3">
        <div className="col-lg-8">
          <Mapa
            locais={locaisVisiveis}
            pontoNovo={pontoNovo}
            categoriasDoPontoNovo={categoriasDoPontoNovo}
            onSelecionarPonto={selecionarPonto}
            foco={foco}
            minhaPosicao={minhaPosicao}
            raioKm={raioKm}
            ajustando={ajustandoPosicao}
            onMoverMinhaPosicao={moverMinhaPosicao}
            selecionando={selecionandoLocal}
            centroRef={centroDoMapa}
            onSelecionarLocal={verDetalhes}
          />
        </div>

        <aside className="col-lg-4">
          <div role="status" aria-live="polite">
            {mensagem && (
              <div className="alert alert-success py-2">
                {mensagem}
                {acabouDeEnviar && (
                  <>
                    {' '}
                    <Link to="/minhas-solicitacoes">Acompanhar em Minhas solicitações</Link>
                  </>
                )}
              </div>
            )}
          </div>
          {erroAoSalvar && (
            <div className="alert alert-danger py-2" role="alert">
              {erroAoSalvar}
            </div>
          )}

          {painel}
        </aside>
      </div>
    </main>
  )
}
