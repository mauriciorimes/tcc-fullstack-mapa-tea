// Telas de toque (celular/tablet) costumam ter GPS; computadores, não.
export const TELA_DE_TOQUE = window.matchMedia('(pointer: coarse)').matches
