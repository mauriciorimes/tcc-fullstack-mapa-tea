import { TELA_DE_TOQUE } from './dispositivo'

// Classifica a margem de erro (em metros) informada pelo navegador.
//
// A Geolocation API não diz de onde veio a posição, mas a margem de erro e o
// tipo de aparelho indicam a fonte provável:
// - celular: GPS (metros), Wi-Fi (centenas de metros) ou antenas (quilômetros);
// - computador: não tem GPS, então é Wi-Fi (até ~1 km) ou o IP da internet.
//
// Quando a fonte provável é o IP, a posição pode estar errada além da própria
// margem informada, porque o IP costuma apontar para a cidade do provedor.
export function classificarPrecisao(metros, telaDeToque = TELA_DE_TOQUE) {
  if (metros <= 100) {
    return {
      titulo: 'Alta precisão',
      cor: 'success',
      fonte: telaDeToque ? 'provavelmente pelo GPS do aparelho' : 'provavelmente pelas redes Wi-Fi próximas',
      porIp: false,
    }
  }
  if (metros <= 1000) {
    return {
      titulo: 'Boa precisão',
      cor: 'primary',
      fonte: telaDeToque
        ? 'provavelmente por redes Wi-Fi ou antenas de celular próximas'
        : 'provavelmente pelas redes Wi-Fi próximas',
      porIp: false,
    }
  }
  if (metros <= 10000 && telaDeToque) {
    return {
      titulo: 'Precisão baixa',
      cor: 'warning',
      fonte: 'provavelmente pelas antenas de celular ou com a localização precisa desativada',
      porIp: false,
    }
  }
  // Laranja, e não vermelho: é um aviso sobre a precisão, não um erro do usuário.
  return {
    titulo: metros <= 10000 ? 'Precisão baixa' : 'Posição muito aproximada',
    cor: metros <= 10000 ? 'warning' : 'laranja',
    fonte: 'provavelmente pela rede de internet (IP), que costuma indicar a cidade do provedor',
    porIp: true,
  }
}
