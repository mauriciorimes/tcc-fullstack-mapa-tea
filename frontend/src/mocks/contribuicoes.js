// Contribuições de exemplo (fictícias) usadas enquanto não existe back-end.
// Há pelo menos um registro de cada tipo, para que todas as telas tenham o que
// mostrar logo ao abrir: filas do moderador, acompanhamento do usuário e
// detalhes dos locais. O que for feito a partir daí fica salvo no navegador.
//
// Os autores são as contas de mocks/usuarios.js: 'usuario-comum' (Rafael
// Nogueira) e 'usuario-bianca' (Bianca Lima).

// Comentários (RF22). O comentário passa pela moderação antes de aparecer (RF45).
export const comentariosIniciais = [
  {
    id: 'comentario-exemplo-1',
    idDoPin: 'exemplo-2',
    idDoAutor: 'usuario-comum',
    texto: 'As vagas prioritárias ficam logo na entrada principal.',
    status: 'aprovado',
    criadoEm: '2026-09-02T10:20:00Z',
    dataAnalise: '2026-09-02T18:00:00Z',
  },
  {
    id: 'comentario-exemplo-2',
    idDoPin: 'exemplo-3',
    idDoAutor: 'usuario-bianca',
    texto: 'Na sessão das 14h o som é mais baixo e as luzes ficam meio acesas.',
    status: 'pendente',
    criadoEm: '2026-10-06T19:12:00Z',
  },
  {
    id: 'comentario-exemplo-3',
    idDoPin: 'exemplo-1',
    idDoAutor: 'usuario-comum',
    texto: 'Bom.',
    status: 'rejeitado',
    motivoRejeicao: 'texto-curto',
    criadoEm: '2026-09-10T08:00:00Z',
    dataAnalise: '2026-09-10T15:30:00Z',
  },
]

// Avaliações (RF23): publicadas na hora, uma por usuário em cada local.
export const avaliacoesIniciais = [
  { id: 'avaliacao-exemplo-1', idDoPin: 'exemplo-3', idDoAutor: 'usuario-comum', nota: 4, criadaEm: '2026-09-16T20:00:00Z' },
  { id: 'avaliacao-exemplo-2', idDoPin: 'exemplo-1', idDoAutor: 'usuario-bianca', nota: 5, criadaEm: '2026-09-21T11:00:00Z' },
]

// Confirmações de que as informações de um local continuam corretas (RF25).
export const confirmacoesIniciais = [
  { id: 'confirmacao-exemplo-1', idDoPin: 'exemplo-2', idDoAutor: 'usuario-comum', criadaEm: '2026-10-01T09:45:00Z' },
]

// Pedidos de inclusão de categoria em local já publicado (RF18).
// Os dois primeiros pedem a mesma categoria no mesmo local, e por isso
// aparecem agrupados para o moderador, com a contagem de dois usuários.
export const inclusoesIniciais = [
  {
    id: 'inclusao-exemplo-1',
    idDoPin: 'exemplo-2',
    idDaCategoria: 'desconto',
    idDoAutor: 'usuario-comum',
    status: 'pendente',
    criadaEm: '2026-10-04T14:00:00Z',
  },
  {
    id: 'inclusao-exemplo-2',
    idDoPin: 'exemplo-2',
    idDaCategoria: 'desconto',
    idDoAutor: 'usuario-bianca',
    status: 'pendente',
    criadaEm: '2026-10-05T09:20:00Z',
  },
  {
    id: 'inclusao-exemplo-3',
    idDoPin: 'exemplo-1',
    idDaCategoria: 'vaga-prioritaria',
    idDoAutor: 'usuario-comum',
    status: 'rejeitado',
    motivoRejeicao: 'O local não tem estacionamento próprio.',
    criadaEm: '2026-09-12T10:00:00Z',
    dataAnalise: '2026-09-13T08:40:00Z',
  },
]

// Sugestões de categorias que ainda não existem (RF11).
export const sugestoesIniciais = [
  {
    id: 'sugestao-exemplo-1',
    nome: 'Fila preferencial',
    justificativa: 'Esperar em fila longa é uma das principais barreiras para pessoas com TEA.',
    idDoAutor: 'usuario-comum',
    status: 'pendente',
    criadaEm: '2026-10-03T16:30:00Z',
  },
  {
    id: 'sugestao-exemplo-2',
    nome: 'Wi-Fi gratuito',
    justificativa: 'Ajuda a passar o tempo no local.',
    idDoAutor: 'usuario-bianca',
    status: 'rejeitado',
    motivoRejeicao: 'Não é um recurso de acessibilidade nem um benefício voltado a pessoas com TEA.',
    criadaEm: '2026-09-25T12:00:00Z',
    dataAnalise: '2026-09-26T09:00:00Z',
  },
]

// Denúncias (RF26): uma de local e uma de comentário, aguardando análise.
// O comentário denunciado ('c1') é um dos comentários de exemplo da Biblioteca.
export const denunciasIniciais = [
  {
    id: 'denuncia-exemplo-1',
    tipoDoAlvo: 'pin',
    idDoPin: 'exemplo-3',
    idDoComentario: null,
    motivo: 'informacao-incorreta',
    idDoAutor: 'usuario-bianca',
    status: 'pendente',
    criadaEm: '2026-10-05T18:00:00Z',
  },
  {
    id: 'denuncia-exemplo-2',
    tipoDoAlvo: 'comentario',
    idDoPin: 'exemplo-1',
    idDoComentario: 'c1',
    motivo: 'fora-do-escopo',
    idDoAutor: 'usuario-comum',
    status: 'pendente',
    criadaEm: '2026-10-06T08:15:00Z',
  },
]
