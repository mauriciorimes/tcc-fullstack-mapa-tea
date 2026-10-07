import { Navigate, useLocation } from 'react-router'
import { useAuth } from '../contexts/authContext'

// Protege as telas que exigem conta. O visitante é levado à tela de login e
// volta para cá depois de entrar. Com apenasModerador, o usuário comum vê um
// aviso de acesso restrito.
// A verificação de verdade é feita no servidor (RNF03); isto só organiza a interface.
export default function RequerLogin({ children, apenasModerador = false }) {
  const { usuario, eModerador, acabouDeSair } = useAuth()
  const { pathname } = useLocation()

  // Quem acabou de sair (ou de excluir a conta) nesta tela volta para o mapa.
  if (!usuario && acabouDeSair) return <Navigate to="/" replace />

  if (!usuario) {
    return (
      <Navigate
        to="/entrar"
        replace
        state={{ de: pathname, aviso: 'Entre na sua conta para acessar esta tela.' }}
      />
    )
  }

  if (apenasModerador && !eModerador) {
    return (
      <main className="container py-4">
        <h1 className="h3">Acesso restrito</h1>
        <p className="mb-0">Esta tela é exclusiva para moderadores.</p>
      </main>
    )
  }

  return children
}
