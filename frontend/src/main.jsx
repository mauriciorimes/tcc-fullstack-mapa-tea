import './utils/prepararDados.js'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'leaflet/dist/leaflet.css'
import './index.css'
import App from './App.jsx'
import AuthProvider from './contexts/AuthProvider.jsx'

// Sem <StrictMode>: no modo de desenvolvimento ele monta os componentes duas
// vezes, o que impede os popups do react-leaflet 5 de abrirem.
createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <AuthProvider>
      <App />
    </AuthProvider>
  </BrowserRouter>,
)
