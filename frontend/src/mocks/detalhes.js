// Detalhes de exemplo (fictícios) dos locais, usados enquanto não existe back-end.
// Seguem os dados que o RF03 manda exibir: fotos, avaliações, comentários
// aprovados, data da última confirmação e o selo de localidade.

// Imagem de exemplo desenhada em SVG, para não depender de arquivos externos.
export function fotoDeExemplo(texto, cor) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="240" viewBox="0 0 320 240">
    <rect width="320" height="240" fill="${cor}"/>
    <text x="160" y="126" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" fill="#212529">${texto}</text>
  </svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

export const detalhesDosLocais = {
  'exemplo-1': {
    fotos: [
      { url: fotoDeExemplo('Sala de leitura', '#e2d5ea'), descricao: 'Sala de leitura reservada' },
      { url: fotoDeExemplo('Entrada', '#dfe6ec'), descricao: 'Entrada da biblioteca' },
    ],
    notaMedia: 4.5,
    totalAvaliacoes: 12,
    dataUltimaConfirmacao: '2026-08-02T09:14:00Z',
    seloLocalidade: true,
    comentarios: [
      {
        id: 'c1',
        autor: 'Ana',
        data: '2026-07-28T15:20:00Z',
        texto: 'A sala do segundo andar fica vazia durante a manhã.',
      },
      {
        id: 'c2',
        autor: 'Carlos',
        data: '2026-06-11T10:05:00Z',
        texto: 'Não há música ambiente e os avisos são feitos por placas.',
      },
    ],
  },
  'exemplo-2': {
    fotos: [{ url: fotoDeExemplo('Estacionamento', '#c9d8ea'), descricao: 'Vagas prioritárias sinalizadas' }],
    notaMedia: 5,
    totalAvaliacoes: 3,
    dataUltimaConfirmacao: null,
    seloLocalidade: false,
    comentarios: [],
  },
  'exemplo-3': {
    fotos: [
      { url: fotoDeExemplo('Bilheteria', '#cfe3cf'), descricao: 'Bilheteria com aviso do desconto' },
      { url: fotoDeExemplo('Sala 2', '#dfe6ec'), descricao: 'Sala de exibição' },
      { url: fotoDeExemplo('Estacionamento', '#c9d8ea'), descricao: 'Estacionamento do cinema' },
    ],
    notaMedia: 4,
    totalAvaliacoes: 8,
    dataUltimaConfirmacao: '2026-09-15T18:40:00Z',
    seloLocalidade: true,
    comentarios: [
      {
        id: 'c3',
        autor: 'Marina',
        data: '2026-09-15T18:45:00Z',
        texto: 'O desconto vale para a pessoa com TEA e um acompanhante.',
      },
    ],
  },
}

// Local sem contribuições ainda (por exemplo, recém-cadastrado).
export const detalhesVazios = {
  fotos: [],
  notaMedia: null,
  totalAvaliacoes: 0,
  dataUltimaConfirmacao: null,
  seloLocalidade: false,
  comentarios: [],
}
