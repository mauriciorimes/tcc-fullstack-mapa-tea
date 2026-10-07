import { createContext, useContext } from 'react'

// Guarda o usuário autenticado e as ações de conta, para qualquer tela consultar.
export const AuthContext = createContext(null)

// Uso: const { usuario, entrar, sair } = useAuth()
// "usuario" é null para o visitante (acesso não autenticado).
export function useAuth() {
  return useContext(AuthContext)
}
