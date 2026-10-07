// Situação de um pin no fluxo de moderação. A tabela pin do banco usa os
// status pendente, publicado e rejeitado; no código, "aprovado" é o publicado.
// Cada situação tem texto, cor e símbolo, nunca só a cor (RNF24).
const SITUACOES = {
  aprovado: { texto: 'Publicado', cor: 'success', simbolo: '✓' },
  rejeitado: { texto: 'Rejeitado', cor: 'danger', simbolo: '✕' },
  despublicado: { texto: 'Despublicado', cor: 'secondary', simbolo: '–' },
  pendente: { texto: 'Aguardando moderação', cor: 'warning', simbolo: '…' },
}

export default function StatusBadge({ status }) {
  const situacao = SITUACOES[status] ?? SITUACOES.pendente
  return (
    <span className={`badge text-bg-${situacao.cor}`}>
      <span aria-hidden="true">{situacao.simbolo} </span>
      {situacao.texto}
    </span>
  )
}
