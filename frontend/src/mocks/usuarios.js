// Contas de exemplo usadas enquanto não existe back-end. Os nomes são fictícios.
//
// ATENÇÃO: isto é uma simulação. No sistema real a senha vai para o servidor e
// é guardada apenas como hash bcrypt (RNF01); ela nunca fica no navegador.
//
// O sistema não tem autocadastro de moderador (RF58): o primeiro moderador é
// criado na carga inicial do banco, representada aqui pela conta abaixo.
export const usuariosIniciais = [
  {
    id: 'usuario-moderador',
    nome: 'Helena Duarte',
    email: 'moderador@mapatea.test',
    senha: 'moderador-teste',
    papel: 'moderador',
    dataCadastro: '2026-08-01T12:00:00Z',
    dataAceiteTermos: '2026-08-01T12:00:00Z',
  },
  {
    id: 'usuario-comum',
    nome: 'Rafael Nogueira',
    email: 'usuario@mapatea.test',
    senha: 'usuario-teste',
    papel: 'usuario',
    dataCadastro: '2026-08-10T09:30:00Z',
    dataAceiteTermos: '2026-08-10T09:30:00Z',
  },
  {
    id: 'usuario-bianca',
    nome: 'Bianca Lima',
    email: 'bianca@mapatea.test',
    senha: 'bianca-teste',
    papel: 'usuario',
    dataCadastro: '2026-08-03T17:20:00Z',
    dataAceiteTermos: '2026-08-03T17:20:00Z',
  },
]
