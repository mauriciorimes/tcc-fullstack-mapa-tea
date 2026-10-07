import { useEffect } from 'react'
import { Link } from 'react-router'

export default function PaginaNaoEncontrada() {
  useEffect(() => {
    document.title = 'Página não encontrada – Mapa TEA'
  }, [])

  return (
    <main className="container py-4">
      <h1 className="h3">Página não encontrada</h1>
      <p>O endereço digitado não existe no Mapa TEA.</p>
      <Link className="btn btn-primary" to="/">
        Ir para o mapa
      </Link>
    </main>
  )
}
