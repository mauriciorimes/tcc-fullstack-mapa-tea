import { useMemo, useState } from 'react'
import { AuthContext } from './authContext'
import * as authService from '../services/authService'

// Mantém em memória o usuário da sessão e repassa as ações de conta às telas.
export default function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(authService.usuarioDaSessao)
  // Fica verdadeiro logo depois de sair ou excluir a conta, para as telas
  // protegidas levarem ao mapa, e não ao login.
  const [acabouDeSair, setAcabouDeSair] = useState(false)

  const valor = useMemo(
    () => ({
      usuario,
      eModerador: usuario?.papel === 'moderador',
      acabouDeSair,
      esquecerSaida: () => setAcabouDeSair(false),
      // Relê a conta da sessão, depois de uma mudança feita em outra tela (RF60).
      recarregarUsuario: () => setUsuario(authService.usuarioDaSessao()),
      async entrar(email, senha) {
        setUsuario(await authService.entrar(email, senha))
      },
      async cadastrar(dados) {
        setUsuario(await authService.cadastrarConta(dados))
      },
      async sair() {
        await authService.sair()
        setAcabouDeSair(true)
        setUsuario(null)
      },
      async atualizarPerfil(dados) {
        setUsuario(await authService.atualizarPerfil(usuario.id, dados))
      },
      async trocarSenha(senhaAtual, senhaNova) {
        await authService.trocarSenha(usuario.id, senhaAtual, senhaNova)
      },
      async excluirConta() {
        await authService.excluirConta(usuario.id)
        setAcabouDeSair(true)
        setUsuario(null)
      },
    }),
    [usuario, acabouDeSair],
  )

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}
