import { useEffect, useRef } from 'react'
import { Link, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router'
import { useAuth } from './contexts/authContext'
import RequerLogin from './components/RequerLogin'
import PaginaMapa from './pages/PaginaMapa'
import PaginaDoLocal from './pages/PaginaDoLocal'
import PaginaIncluirCategoria from './pages/PaginaIncluirCategoria'
import PaginaAvaliar from './pages/PaginaAvaliar'
import PaginaComentar from './pages/PaginaComentar'
import PaginaDenunciar from './pages/PaginaDenunciar'
import PaginaEditarSolicitacao from './pages/PaginaEditarSolicitacao'
import PaginaSugerirCategoria from './pages/PaginaSugerirCategoria'
import PaginaPrivacidade from './pages/PaginaPrivacidade'
import PaginaEntrar from './pages/PaginaEntrar'
import PaginaCadastro from './pages/PaginaCadastro'
import PaginaRecuperarSenha from './pages/PaginaRecuperarSenha'
import PaginaRedefinirSenha from './pages/PaginaRedefinirSenha'
import PaginaMinhaConta from './pages/PaginaMinhaConta'
import PaginaMinhasSolicitacoes from './pages/PaginaMinhasSolicitacoes'
import PaginaPainelDoModerador from './pages/PaginaPainelDoModerador'
import PaginaModeracao from './pages/PaginaModeracao'
import PaginaDenuncias from './pages/PaginaDenuncias'
import PaginaUsuarios from './pages/PaginaUsuarios'
import PaginaNaoEncontrada from './pages/PaginaNaoEncontrada'

// Telas do moderador: no menu elas ficam reunidas no item "Moderador".
const TELAS_DO_MODERADOR = ['/moderador', '/moderacao', '/denuncias', '/usuarios']

// Atalhos para escrever as rotas protegidas.
const logado = (tela) => <RequerLogin>{tela}</RequerLogin>
const moderador = (tela) => <RequerLogin apenasModerador>{tela}</RequerLogin>

// Estrutura comum a todas as telas: o menu fica fixo no topo e na mesma
// posição em todas elas (RNF23), e cada rota mostra uma tela.
// Os itens do menu mudam conforme o perfil: visitante, usuário ou moderador.
export default function App() {
  const { usuario, eModerador, sair, acabouDeSair, esquecerSaida } = useAuth()
  const navegar = useNavigate()
  const { pathname } = useLocation()
  const conteudo = useRef(null)
  const primeiraTela = useRef(true)

  useEffect(() => {
    // Depois de sair, as telas protegidas levam ao mapa. Esse aviso vale só
    // até a troca de tela terminar.
    if (acabouDeSair) esquecerSaida()

    // Ao trocar de tela, o foco vai para o início do conteúdo, para que
    // leitores de tela anunciem a tela nova e o Tab comece dela (RNF19).
    if (primeiraTela.current) primeiraTela.current = false
    else conteudo.current?.focus()
    // Roda apenas quando o endereço muda.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  async function encerrarSessao() {
    await sair()
    navegar('/')
  }

  function pularParaOConteudo(evento) {
    evento.preventDefault()
    conteudo.current?.focus()
  }

  return (
    <>
      {/* Primeiro item ao usar o Tab: pula o menu e vai direto ao conteúdo. */}
      <a className="pular-para-o-conteudo" href="#conteudo" onClick={pularParaOConteudo}>
        Pular para o conteúdo
      </a>

      <header className="navbar navbar-expand cabecalho sticky-top" data-bs-theme="dark">
        <nav className="container-fluid flex-wrap" aria-label="Menu principal">
          <Link className="navbar-brand" to="/">
            Mapa TEA
          </Link>
          <ul className="navbar-nav flex-wrap align-items-center">
            <li className="nav-item">
              <NavLink className="nav-link" to="/" end>
                Mapa
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/privacidade">
                Privacidade
              </NavLink>
            </li>
            {usuario ? (
              <>
                {eModerador && (
                  <li className="nav-item">
                    <Link
                      className={`nav-link ${TELAS_DO_MODERADOR.includes(pathname) ? 'active' : ''}`}
                      aria-current={TELAS_DO_MODERADOR.includes(pathname) ? 'page' : undefined}
                      to="/moderador"
                    >
                      Moderador
                    </Link>
                  </li>
                )}
                <li className="nav-item">
                  <NavLink className="nav-link" to="/minhas-solicitacoes">
                    Minhas solicitações
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/conta">
                    Minha conta
                  </NavLink>
                </li>
                <li className="nav-item navbar-text ms-2">{usuario.nome}</li>
                <li className="nav-item ms-2">
                  <button type="button" className="btn btn-outline-light btn-sm" onClick={encerrarSessao}>
                    Sair
                  </button>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/entrar">
                    Entrar
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/cadastro">
                    Criar conta
                  </NavLink>
                </li>
              </>
            )}
          </ul>
        </nav>
      </header>

      <div id="conteudo" tabIndex={-1} ref={conteudo}>
        <Routes>
          {/* Consulta pública */}
          <Route path="/" element={<PaginaMapa />} />
          <Route path="/local/:id" element={<PaginaDoLocal />} />
          <Route path="/privacidade" element={<PaginaPrivacidade />} />

          {/* Conta */}
          <Route path="/entrar" element={<PaginaEntrar />} />
          <Route path="/cadastro" element={<PaginaCadastro />} />
          <Route path="/recuperar-senha" element={<PaginaRecuperarSenha />} />
          <Route path="/redefinir-senha/:codigo" element={<PaginaRedefinirSenha />} />
          <Route path="/conta" element={logado(<PaginaMinhaConta />)} />

          {/* Contribuições do usuário autenticado */}
          <Route path="/local/:id/incluir-categoria" element={logado(<PaginaIncluirCategoria />)} />
          <Route path="/local/:id/avaliar" element={logado(<PaginaAvaliar />)} />
          <Route path="/local/:id/comentar" element={logado(<PaginaComentar />)} />
          <Route
            path="/local/:id/comentarios/:idDoComentario/editar"
            element={logado(<PaginaComentar />)}
          />
          <Route path="/local/:id/denunciar" element={logado(<PaginaDenunciar />)} />
          <Route
            path="/local/:id/comentarios/:idDoComentario/denunciar"
            element={logado(<PaginaDenunciar />)}
          />
          <Route path="/sugerir-categoria" element={logado(<PaginaSugerirCategoria />)} />
          <Route path="/minhas-solicitacoes" element={logado(<PaginaMinhasSolicitacoes />)} />
          <Route path="/minhas-solicitacoes/:id/editar" element={logado(<PaginaEditarSolicitacao />)} />

          {/* Moderador */}
          <Route path="/moderador" element={moderador(<PaginaPainelDoModerador />)} />
          <Route path="/moderacao" element={moderador(<PaginaModeracao />)} />
          <Route path="/denuncias" element={moderador(<PaginaDenuncias />)} />
          <Route path="/usuarios" element={moderador(<PaginaUsuarios />)} />
          <Route path="/local/:id/editar" element={moderador(<PaginaEditarSolicitacao comoModerador />)} />

          <Route path="*" element={<PaginaNaoEncontrada />} />
        </Routes>
      </div>
    </>
  )
}
