// Enquanto não há back-end, os dados do Mapa TEA ficam no navegador. Na
// primeira vez, cada serviço começa pelos dados de exemplo da pasta mocks.
//
// Quando os dados de exemplo mudam de formato, a versão abaixo é aumentada.
// O navegador que ainda guarda dados de uma versão anterior é limpo uma única
// vez, para recomeçar pelos exemplos novos. A posição do usuário é mantida.
//
// Este arquivo é o primeiro a ser carregado (veja main.jsx), antes de qualquer
// serviço ler os dados.
const VERSAO_DOS_DADOS = '2'
const CHAVE_DA_VERSAO = 'mapatea:versaoDosDados'
const CHAVES_MANTIDAS = ['mapatea:ultimaPosicao']

try {
  if (localStorage.getItem(CHAVE_DA_VERSAO) !== VERSAO_DOS_DADOS) {
    Object.keys(localStorage)
      .filter((chave) => chave.startsWith('mapatea:') && !CHAVES_MANTIDAS.includes(chave))
      .forEach((chave) => localStorage.removeItem(chave))
    localStorage.setItem(CHAVE_DA_VERSAO, VERSAO_DOS_DADOS)
  }
} catch {
  // Sem localStorage: os dados de exemplo ficam só em memória.
}
