# Mapa TEA

Mapa colaborativo de locais com recursos de acessibilidade e benefícios para pessoas com Transtorno do Espectro Autista (TEA).

Esta versão é só o front-end. Todos os dados são de exemplo e ficam salvos no próprio navegador.

## Como acessar

1. Abra o endereço do site no navegador. A primeira tela é o mapa.
2. Para consultar, não é preciso entrar: o mapa e os detalhes dos locais são públicos.
3. Para usar as outras funções, clique em **Entrar**, no menu do topo, e use uma das contas abaixo.
4. Para trocar de perfil, clique em **Sair** e entre com outra conta.

## Contas de teste

| Perfil | Nome | E-mail | Senha |
|---|---|---|---|
| Moderador | Helena Duarte | `moderador@mapatea.test` | `moderador-teste` |
| Usuário | Rafael Nogueira | `usuario@mapatea.test` | `usuario-teste` |
| Usuário | Bianca Lima | `bianca@mapatea.test` | `bianca-teste` |

Também é possível criar uma conta nova em **Criar conta**. Contas novas são sempre de usuário comum.

## O que cada perfil acessa

As permissões se acumulam: o usuário faz tudo o que o visitante faz, e o moderador faz tudo o que o usuário faz.

### Visitante (sem entrar)

| Tela | Endereço | O que faz |
|---|---|---|
| Mapa | `/` | Vê os locais publicados, filtra por categoria e busca locais próximos |
| Detalhes do local | `/local/exemplo-1` | Vê categorias, descrição, fotos, avaliações, comentários e a última confirmação |
| Privacidade | `/privacidade` | Lê a política de privacidade |
| Entrar | `/entrar` | Entra com uma conta |
| Criar conta | `/cadastro` | Cria uma conta de usuário |
| Recuperar senha | `/recuperar-senha` | Pede um link para criar uma senha nova |

Para abrir os detalhes, clique em um pin no mapa ou em **Ver detalhes** na lista ao lado.

### Usuário (Rafael Nogueira ou Bianca Lima)

| Tela | Como chegar | O que faz |
|---|---|---|
| Adicionar local | Botão **Adicionar local**, no mapa | Cadastra um local em cinco etapas: local, fotos, categorias, descrição e avaliação |
| Minhas solicitações | Menu, `/minhas-solicitacoes` | Acompanha o que enviou, com a situação e o motivo em caso de rejeição. Edita ou exclui o que está pendente |
| Avaliar | Botão **Avaliar**, nos detalhes do local | Dá uma nota de 1 a 5. A nota aparece na hora |
| Comentar | Botão **Comentar**, nos detalhes do local | Escreve um comentário. Ele aparece depois de aprovado pelo moderador |
| Confirmar informações | Botão nos detalhes do local | Registra que as informações do local continuam corretas |
| Incluir categoria | Botão **Solicitar inclusão de categoria**, nos detalhes do local | Pede uma categoria que o local ainda não tem |
| Sugerir categoria | `/sugerir-categoria`, ou pelo botão em Minhas solicitações | Sugere uma categoria que ainda não existe |
| Denunciar | Link **Denunciar**, nos detalhes do local e em cada comentário | Denuncia um local ou um comentário, escolhendo o motivo |
| Minha conta | Menu, `/conta` | Altera nome, e-mail e senha, ou exclui a conta |

### Moderador (Helena Duarte)

| Tela | Como chegar | O que faz |
|---|---|---|
| Painel do moderador | Menu **Moderador**, `/moderador` | Mostra o que está aguardando análise e leva às três telas abaixo |
| Moderação | `/moderacao` | Aprova ou rejeita solicitações de local, inclusões de categoria, comentários e sugestões de categoria |
| Denúncias | `/denuncias` | Analisa cada denúncia e decide manter ou despublicar o conteúdo |
| Usuários | `/usuarios` | Lista as contas, edita o nome, promove a moderador, rebaixa a usuário comum ou exclui |
| Ações no local | Quadro **Ações do moderador**, nos detalhes de um local publicado | Edita o local, exclui o local ou despublica uma categoria |

## O que já vem cadastrado

- **Locais:** três publicados (Biblioteca, Parque e Cinema Exemplo), dois aguardando moderação (Padaria e Museu Exemplo), um rejeitado (Mercado Exemplo) e um despublicado (Lanchonete Exemplo).
- **Para o moderador analisar:** duas solicitações de local, uma inclusão de categoria pedida por dois usuários, um comentário, uma sugestão de categoria e duas denúncias.
- **Para o usuário acompanhar:** a conta de Rafael Nogueira tem um local pendente, um rejeitado e um publicado, além de pedidos e de uma sugestão em análise.

## Roteiro sugerido

1. Sem entrar, abra o mapa, use o filtro por categoria e abra os detalhes de um local.
2. Entre como **Rafael Nogueira**. Abra **Minhas solicitações** e veja o motivo da rejeição do Mercado Exemplo.
3. Ainda como Rafael, clique em **Adicionar local** no mapa e envie um local novo.
4. Saia e entre como **Helena Duarte**. No menu **Moderador**, abra **Moderação** e aprove o local enviado.
5. Volte ao mapa: o local aprovado agora aparece para todos.

## Sobre os dados

- Tudo o que for feito fica salvo no navegador em que foi feito. Outro navegador ou outro computador começa pelos dados de exemplo.
- Para voltar aos dados de exemplo, apague os dados do site nas configurações do navegador.
- As senhas acima servem só para esta demonstração.
- A recuperação de senha não envia e-mail: o link aparece na própria tela.
- A localização só é usada se o navegador tiver permissão, e não sai do aparelho.
