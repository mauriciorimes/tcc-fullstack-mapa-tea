import { useEffect } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../contexts/authContext'

// Política de privacidade (módulo PrivacyPage, RNF11): informa quais dados são
// coletados e com qual finalidade. O texto segue o que a documentação técnica
// define (RNF09 a RNF15) e usa linguagem literal, sem expressões figuradas.
export default function PaginaPrivacidade() {
  const { usuario } = useAuth()

  useEffect(() => {
    document.title = 'Política de privacidade – Mapa TEA'
  }, [])

  return (
    <main className="container py-4 pagina-media">
      <h1 className="h3">Política de privacidade</h1>
      <p>
        Esta página explica quais dados o Mapa TEA coleta, para que cada um é usado e como você
        pode apagar os seus dados.
      </p>

      <section aria-labelledby="privacidade-consulta">
        <h2 id="privacidade-consulta" className="h5">
          1. Consultar o mapa não exige cadastro
        </h2>
        <p>
          Você pode ver o mapa, filtrar os locais e abrir os detalhes de cada local sem criar conta
          e sem informar nenhum dado pessoal.
        </p>
      </section>

      <section aria-labelledby="privacidade-dados">
        <h2 id="privacidade-dados" className="h5">
          2. Dados coletados quando você cria uma conta
        </h2>
        <div className="table-responsive">
          <table className="table table-bordered align-middle">
            <thead>
              <tr>
                <th scope="col">Dado</th>
                <th scope="col">Para que é usado</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">Nome</th>
                <td>
                  Identificar você no sistema. O nome aparece junto aos seus comentários e é o único
                  dado seu que os moderadores veem.
                </td>
              </tr>
              <tr>
                <th scope="row">E-mail</th>
                <td>
                  Somente para entrar na conta e para recuperar a senha. O e-mail não é exibido a
                  outros usuários nem aos moderadores.
                </td>
              </tr>
              <tr>
                <th scope="row">Senha</th>
                <td>
                  Confirmar que é você quem está entrando. A senha é guardada de forma
                  embaralhada (hash), e não é possível recuperar a senha original a partir do que
                  fica armazenado.
                </td>
              </tr>
              <tr>
                <th scope="row">Data de cadastro e data de aceite dos termos</th>
                <td>Registrar quando a conta foi criada e quando os termos foram aceitos.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>O cadastro é restrito a pessoas com 18 anos ou mais.</p>
      </section>

      <section aria-labelledby="privacidade-contribuicoes">
        <h2 id="privacidade-contribuicoes" className="h5">
          3. O que você envia ao contribuir
        </h2>
        <p>
          Quando você cadastra um local, o sistema guarda a posição do local no mapa, as
          categorias, a descrição e as fotos que você enviou. Também são guardados os seus
          comentários, avaliações, confirmações e denúncias.
        </p>
        <p>
          Depois de aprovados pela moderação, os locais e os comentários ficam visíveis a qualquer
          pessoa que consulte o mapa. Por isso, não inclua dados pessoais na descrição, nos
          comentários ou nas fotos.
        </p>
      </section>

      <section aria-labelledby="privacidade-localizacao">
        <h2 id="privacidade-localizacao" className="h5">
          4. Sua localização
        </h2>
        <p>
          O sistema só acessa a sua localização se você permitir no navegador. Ela é usada para
          duas coisas:
        </p>
        <ul>
          <li>mostrar o mapa na região onde você está e calcular a distância até os locais;</li>
          <li>
            verificar, no momento em que você cadastra um local, se você está nesse local (selo de
            localidade).
          </li>
        </ul>
        <p>
          A sua posição não é guardada no banco de dados. Na verificação do selo, ela é usada
          apenas para a comparação e descartada em seguida. Para não pedir a localização a cada
          visita, a última posição fica guardada somente no seu próprio aparelho.
        </p>
        <p>
          Se você não permitir o acesso à localização, o mapa e o cadastro de locais continuam
          funcionando. Nesse caso, o local é cadastrado sem o selo de localidade.
        </p>
      </section>

      <section aria-labelledby="privacidade-terceiros">
        <h2 id="privacidade-terceiros" className="h5">
          5. Compartilhamento com terceiros
        </h2>
        <p>O Mapa TEA não vende e não compartilha os seus dados pessoais com terceiros.</p>
        <p>Dois serviços externos são usados para o mapa funcionar:</p>
        <ul>
          <li>
            as imagens do mapa vêm do OpenStreetMap, e o seu navegador as busca diretamente nesse
            serviço;
          </li>
          <li>
            quando você digita um endereço, o texto digitado é enviado a um serviço de busca de
            endereços para ser convertido em uma posição no mapa.
          </li>
        </ul>
        <p>Nenhum desses serviços recebe o seu nome, o seu e-mail ou a sua senha.</p>
      </section>

      <section aria-labelledby="privacidade-prazo">
        <h2 id="privacidade-prazo" className="h5">
          6. Por quanto tempo os dados ficam guardados
        </h2>
        <p>
          Os seus dados ficam guardados enquanto a sua conta existir. Não há prazo de expiração
          automática.
        </p>
      </section>

      <section aria-labelledby="privacidade-direitos">
        <h2 id="privacidade-direitos" className="h5">
          7. Como alterar ou apagar os seus dados
        </h2>
        <ul>
          <li>
            Você pode corrigir o seu nome e o seu e-mail e trocar a sua senha na tela{' '}
            {usuario ? <Link to="/conta">Minha conta</Link> : 'Minha conta'}.
          </li>
          <li>
            Você pode excluir a sua conta nessa mesma tela, a qualquer momento, sem precisar pedir
            a um moderador.
          </li>
        </ul>
        <p>
          Esses são direitos previstos na Lei Geral de Proteção de Dados Pessoais (Lei nº
          13.709/2018).
        </p>
      </section>

      <section aria-labelledby="privacidade-sessao">
        <h2 id="privacidade-sessao" className="h5">
          8. Sessão
        </h2>
        <p>
          Depois que você entra, o sistema mantém a sua sessão aberta neste navegador até você
          clicar em Sair. Em aparelhos compartilhados, clique em Sair ao terminar.
        </p>
      </section>

      <p className="small text-body-secondary mt-4 mb-0">Última atualização: outubro de 2026.</p>
    </main>
  )
}
