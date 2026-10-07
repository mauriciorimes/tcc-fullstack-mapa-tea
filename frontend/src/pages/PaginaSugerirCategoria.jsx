import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '../contexts/authContext'
import { TAMANHO_MAXIMO_DO_NOME, sugerirCategoria } from '../services/sugestoesService'
import { categorias } from '../mocks/categorias'
import SimboloDaCategoria from '../components/SimboloDaCategoria'

// Tela para o usuário sugerir uma categoria que ainda não existe (RF11).
// A sugestão é analisada por um moderador. Endereço: /sugerir-categoria.
export default function PaginaSugerirCategoria() {
  const { usuario } = useAuth()
  const navegar = useNavigate()
  const [nome, setNome] = useState('')
  const [justificativa, setJustificativa] = useState('')
  const [erro, setErro] = useState('')

  useEffect(() => {
    document.title = 'Sugerir categoria – Mapa TEA'
  }, [])

  async function enviar(evento) {
    evento.preventDefault()
    try {
      await sugerirCategoria({ nome, justificativa, idDoAutor: usuario.id })
      navegar('/minhas-solicitacoes', {
        state: { mensagem: `Sua sugestão da categoria "${nome.trim()}" foi enviada para moderação.` },
      })
    } catch (falha) {
      setErro(falha.message)
    }
  }

  return (
    <main className="container py-4 pagina-media">
      <Link className="btn btn-outline-secondary btn-sm mb-3" to="/minhas-solicitacoes">
        <span aria-hidden="true">← </span>Voltar às minhas solicitações
      </Link>

      <h1 className="h3">Sugerir nova categoria</h1>
      <p>
        As categorias descrevem um recurso ou um benefício do próprio local para pessoas com TEA.
        Elas não indicam o tipo de estabelecimento.
      </p>

      <section aria-labelledby="titulo-existentes" className="mb-3">
        <h2 id="titulo-existentes" className="h5">
          Categorias que já existem
        </h2>
        <ul className="list-unstyled mb-0">
          {categorias.map((categoria) => (
            <li key={categoria.id}>
              <SimboloDaCategoria categoria={categoria} /> {categoria.nome}
            </li>
          ))}
        </ul>
      </section>

      {erro && (
        <div className="alert alert-danger py-2" role="alert">
          {erro}
        </div>
      )}

      <form onSubmit={enviar} noValidate>
        <div className="mb-3">
          <label htmlFor="sugestao-nome" className="form-label">
            Nome da categoria sugerida
          </label>
          <input
            id="sugestao-nome"
            className="form-control"
            maxLength={TAMANHO_MAXIMO_DO_NOME}
            value={nome}
            onChange={(evento) => setNome(evento.target.value)}
            required
          />
        </div>

        <div className="mb-3">
          <label htmlFor="sugestao-justificativa" className="form-label">
            Por que esta categoria ajuda pessoas com TEA?
          </label>
          <textarea
            id="sugestao-justificativa"
            className="form-control"
            rows="3"
            value={justificativa}
            onChange={(evento) => setJustificativa(evento.target.value)}
          />
        </div>

        <div className="d-flex flex-wrap gap-2">
          <button type="submit" className="btn btn-primary">
            Enviar sugestão
          </button>
          <button type="button" className="btn btn-outline-secondary" onClick={() => navegar(-1)}>
            Cancelar
          </button>
        </div>
      </form>
    </main>
  )
}
