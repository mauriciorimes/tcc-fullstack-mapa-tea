// Cadastro de conta, login, sessão e recuperação de senha (RF04 a RF06, RF08).
//
// Por enquanto tudo é simulado no navegador. Quando a API existir, estas
// funções passam a chamar /api/auth, e a sessão passa a ser um cookie criado
// pelo servidor; as telas não precisam mudar.
import { usuariosIniciais } from '../mocks/usuarios'

const CHAVE_USUARIOS = 'mapatea:usuarios'
const CHAVE_SESSAO = 'mapatea:sessao'
const CHAVE_RECUPERACAO = 'mapatea:recuperacao'

// RNF02: senha com no mínimo oito caracteres no cadastro e na troca de senha.
export const TAMANHO_MINIMO_DA_SENHA = 8
const VALIDADE_DO_LINK_MS = 60 * 60 * 1000 // uma hora

function ler(chave, padrao) {
  try {
    const salvo = localStorage.getItem(chave)
    return salvo ? JSON.parse(salvo) : padrao
  } catch {
    return padrao
  }
}

function gravar(chave, valor) {
  try {
    localStorage.setItem(chave, JSON.stringify(valor))
  } catch {
    throw new Error('Não foi possível salvar neste navegador.')
  }
}

function lerUsuarios() {
  return ler(CHAVE_USUARIOS, usuariosIniciais)
}

function normalizarEmail(email) {
  return email.trim().toLowerCase()
}

// O que as telas recebem sobre o usuário: nunca a senha.
function dadosPublicos(usuario) {
  return { id: usuario.id, nome: usuario.nome, email: usuario.email, papel: usuario.papel }
}

export function validarSenha(senha) {
  return senha.length >= TAMANHO_MINIMO_DA_SENHA
    ? null
    : `A senha deve ter no mínimo ${TAMANHO_MINIMO_DA_SENHA} caracteres.`
}

// Sessão sem expiração por inatividade (RNF08): vale até o usuário sair.
export function usuarioDaSessao() {
  const id = ler(CHAVE_SESSAO, null)
  const usuario = lerUsuarios().find((item) => item.id === id)
  return usuario ? dadosPublicos(usuario) : null
}

export async function cadastrarConta({ nome, email, senha, aceitouTermos }) {
  if (!nome.trim()) throw new Error('Informe o seu nome.')
  if (!email.includes('@')) throw new Error('Informe um e-mail válido.')
  const problemaDaSenha = validarSenha(senha)
  if (problemaDaSenha) throw new Error(problemaDaSenha)
  // RNF15: cadastro restrito a maiores de 18 anos, declarado no aceite dos termos.
  if (!aceitouTermos) {
    throw new Error('Para criar a conta é preciso declarar a idade e aceitar os termos.')
  }

  const usuarios = lerUsuarios()
  if (usuarios.some((usuario) => usuario.email === normalizarEmail(email))) {
    throw new Error('Já existe uma conta com este e-mail.')
  }

  const agora = new Date().toISOString()
  const novo = {
    id: `usuario-${Date.now()}`,
    nome: nome.trim(),
    email: normalizarEmail(email),
    senha,
    papel: 'usuario', // contas novas são sempre de usuário comum (RF58)
    dataCadastro: agora,
    dataAceiteTermos: agora,
  }
  gravar(CHAVE_USUARIOS, [...usuarios, novo])
  gravar(CHAVE_SESSAO, novo.id)
  return dadosPublicos(novo)
}

export async function entrar(email, senha) {
  const usuario = lerUsuarios().find((item) => item.email === normalizarEmail(email))
  // A mesma mensagem para e-mail ou senha errados, para não revelar quais e-mails têm conta.
  if (!usuario || usuario.senha !== senha) throw new Error('E-mail ou senha incorretos.')
  gravar(CHAVE_SESSAO, usuario.id)
  return dadosPublicos(usuario)
}

export async function sair() {
  try {
    localStorage.removeItem(CHAVE_SESSAO)
  } catch {
    // Nada a fazer.
  }
}

// Recuperação de senha (RF06). No sistema real o servidor envia por e-mail um
// link com um código temporário. Aqui o código é devolvido para a tela, que
// mostra o link apenas para demonstração.
export async function solicitarRecuperacao(email) {
  const usuario = lerUsuarios().find((item) => item.email === normalizarEmail(email))
  if (!usuario) return null
  const codigo = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`
  gravar(CHAVE_RECUPERACAO, {
    codigo,
    idDoUsuario: usuario.id,
    expiraEm: Date.now() + VALIDADE_DO_LINK_MS,
  })
  return codigo
}

export async function redefinirSenha(codigo, novaSenha) {
  const pedido = ler(CHAVE_RECUPERACAO, null)
  if (!pedido || pedido.codigo !== codigo || pedido.expiraEm < Date.now()) {
    throw new Error('Este link de recuperação é inválido ou já expirou. Peça um novo.')
  }
  const problemaDaSenha = validarSenha(novaSenha)
  if (problemaDaSenha) throw new Error(problemaDaSenha)

  gravar(
    CHAVE_USUARIOS,
    lerUsuarios().map((usuario) =>
      usuario.id === pedido.idDoUsuario ? { ...usuario, senha: novaSenha } : usuario,
    ),
  )
  localStorage.removeItem(CHAVE_RECUPERACAO)
}

// RF09: edição dos dados do próprio perfil.
export async function atualizarPerfil(id, { nome, email }) {
  if (!nome.trim()) throw new Error('Informe o seu nome.')
  if (!email.includes('@')) throw new Error('Informe um e-mail válido.')
  const usuarios = lerUsuarios()
  const emailNovo = normalizarEmail(email)
  if (usuarios.some((usuario) => usuario.id !== id && usuario.email === emailNovo)) {
    throw new Error('Já existe uma conta com este e-mail.')
  }
  gravar(
    CHAVE_USUARIOS,
    usuarios.map((usuario) =>
      usuario.id === id ? { ...usuario, nome: nome.trim(), email: emailNovo } : usuario,
    ),
  )
  return usuarioDaSessao()
}

// RF07: troca da própria senha, conferindo a senha atual.
export async function trocarSenha(id, senhaAtual, senhaNova) {
  const usuarios = lerUsuarios()
  const usuario = usuarios.find((item) => item.id === id)
  if (!usuario || usuario.senha !== senhaAtual) throw new Error('A senha atual está incorreta.')
  const problemaDaSenha = validarSenha(senhaNova)
  if (problemaDaSenha) throw new Error(problemaDaSenha)
  gravar(
    CHAVE_USUARIOS,
    usuarios.map((item) => (item.id === id ? { ...item, senha: senhaNova } : item)),
  )
}

// RF10: exclusão da própria conta. RF59: o último moderador ativo não pode ser excluído.
export async function excluirConta(id) {
  const usuarios = lerUsuarios()
  const usuario = usuarios.find((item) => item.id === id)
  const moderadores = usuarios.filter((item) => item.papel === 'moderador')
  if (usuario?.papel === 'moderador' && moderadores.length === 1) {
    throw new Error(
      'Você é o único moderador. Promova outro usuário a moderador antes de excluir a conta.',
    )
  }
  gravar(
    CHAVE_USUARIOS,
    usuarios.filter((item) => item.id !== id),
  )
  await sair()
}

// Nome de exibição de um usuário. O e-mail nunca é mostrado a outras pessoas,
// nem ao moderador (RNF10).
export function nomeDoUsuario(id) {
  return lerUsuarios().find((usuario) => usuario.id === id)?.nome ?? 'Usuário não identificado'
}

// ---- Gerenciamento de usuários pelo moderador (RF27 a RF30) ----
// Na API, estas operações ficam em /api/usuarios e exigem o papel de moderador.

// RF27: lista das contas. O e-mail fica de fora: o moderador vê só o nome (RNF10).
export async function listarUsuarios() {
  return lerUsuarios()
    .map(({ id, nome, papel, dataCadastro }) => ({ id, nome, papel, dataCadastro }))
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
}

// RF28: edição dos dados de um usuário. O único dado visível ao moderador é o nome.
export async function editarUsuario(id, { nome }) {
  if (!nome.trim()) throw new Error('Informe o nome do usuário.')
  gravar(
    CHAVE_USUARIOS,
    lerUsuarios().map((usuario) => (usuario.id === id ? { ...usuario, nome: nome.trim() } : usuario)),
  )
}

function quantidadeDeModeradores(usuarios) {
  return usuarios.filter((usuario) => usuario.papel === 'moderador').length
}

// RF29: promoção a moderador ou rebaixamento a usuário comum.
// RF59: o moderador não altera o próprio papel, e o último moderador não é rebaixado.
export async function alterarPapel(id, novoPapel, idDoModerador) {
  if (id === idDoModerador) throw new Error('Você não pode alterar o próprio papel.')
  const usuarios = lerUsuarios()
  const alvo = usuarios.find((usuario) => usuario.id === id)
  if (!alvo) throw new Error('Usuário não encontrado.')
  if (alvo.papel === 'moderador' && novoPapel !== 'moderador' && quantidadeDeModeradores(usuarios) === 1) {
    throw new Error('O último moderador não pode ser rebaixado.')
  }
  gravar(
    CHAVE_USUARIOS,
    usuarios.map((usuario) => (usuario.id === id ? { ...usuario, papel: novoPapel } : usuario)),
  )
}

// RF30: exclusão de um usuário pelo moderador.
// RF59: o último moderador não pode ser excluído.
export async function excluirUsuario(id, idDoModerador) {
  if (id === idDoModerador) throw new Error('Para excluir a sua conta, use a tela Minha conta.')
  const usuarios = lerUsuarios()
  const alvo = usuarios.find((usuario) => usuario.id === id)
  if (!alvo) throw new Error('Usuário não encontrado.')
  if (alvo.papel === 'moderador' && quantidadeDeModeradores(usuarios) === 1) {
    throw new Error('O último moderador não pode ser excluído.')
  }
  gravar(
    CHAVE_USUARIOS,
    usuarios.filter((usuario) => usuario.id !== id),
  )
}
