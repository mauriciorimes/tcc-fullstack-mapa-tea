import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // "npm run dev:celular": abre o servidor na rede local com HTTPS.
  // O navegador só libera a localização em localhost ou HTTPS, então sem isso
  // o celular não consegue usar o GPS ao acessar pelo IP do computador.
  const celular = mode === 'celular'

  return {
    plugins: [react(), celular && basicSsl()],
    server: celular ? { host: true } : {},
  }
})
