import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { listarSolicitacoesPendentes } from '../services/locaisService'
import { listarInclusoesPendentes } from '../services/inclusaoDeCategoriaService'
import { listarComentariosPendentes } from '../services/interacoesService'
import { listarSugestoesPendentes } from '../services/sugestoesService'
import { listarDenunciasPendentes } from '../services/denunciasService'
import { listarUsuarios } from '../services/authService'

function texto(quantidade, singular, plural) {
  return `${quantidade} ${quantidade === 1 ? singular : plural}`
}

// Entrada única das telas do moderador, com o que está aguardando em cada
// uma. Reúne Moderação, Denúncias e Usuários em um só item do menu.
export default function PaginaPainelDoModerador() {
  const [contagens, setContagens] = useState(null)

  useEffect(() => {
    document.title = 'Painel do moderador – Mapa TEA'
    Promise.all([
      listarSolicitacoesPendentes(),
      listarInclusoesPendentes(),
      listarComentariosPendentes(),
      listarSugestoesPendentes(),
      listarDenunciasPendentes(),
      listarUsuarios(),
    ]).then(([pins, inclusoes, comentarios, sugestoes, denuncias, usuarios]) =>
      setContagens({
        pins: pins.length,
        inclusoes: inclusoes.length,
        comentarios: comentarios.length,
        sugestoes: sugestoes.length,
        denuncias: denuncias.length,
        usuarios: usuarios.length,
      }),
    )
  }, [])

  const areas = contagens && [
    {
      titulo: 'Moderação',
      endereco: '/moderacao',
      itens: [
        texto(contagens.pins, 'solicitação de pin', 'solicitações de pin'),
        texto(contagens.inclusoes, 'inclusão de categoria', 'inclusões de categoria'),
        texto(contagens.comentarios, 'comentário', 'comentários'),
        texto(contagens.sugestoes, 'sugestão de categoria', 'sugestões de categoria'),
      ],
      rodape: 'aguardando análise',
    },
    {
      titulo: 'Denúncias',
      endereco: '/denuncias',
      itens: [texto(contagens.denuncias, 'denúncia', 'denúncias')],
      rodape: 'aguardando análise',
    },
    {
      titulo: 'Usuários',
      endereco: '/usuarios',
      itens: [texto(contagens.usuarios, 'conta cadastrada', 'contas cadastradas')],
      rodape: '',
    },
  ]

  return (
    <main className="container py-4 pagina-media">
      <h1 className="h3">Painel do moderador</h1>

      {!contagens && <p role="status">Carregando…</p>}

      {areas && (
        <ul className="list-unstyled">
          {areas.map((area) => (
            <li className="card mb-3" key={area.endereco}>
              <div className="card-body">
                <h2 className="h5 card-title">{area.titulo}</h2>
                <ul>
                  {area.itens.map((item) => (
                    <li key={item}>
                      {item} {area.rodape}
                    </li>
                  ))}
                </ul>
                <Link className="btn btn-primary" to={area.endereco}>
                  Abrir {area.titulo}
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
