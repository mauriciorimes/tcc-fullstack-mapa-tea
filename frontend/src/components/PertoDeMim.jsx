import { formatarDistancia } from '../utils/distancia'
import { classificarPrecisao } from '../utils/precisao'
import { TELA_DE_TOQUE } from '../utils/dispositivo'
import { PRECISAO_ACEITAVEL_METROS } from '../services/localizacaoService'
import BuscaEndereco from './BuscaEndereco'

const OPCOES_DE_RAIO = [1, 5, 10, 50]

function formatarDataHora(iso) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Explica de onde veio a posição e o quanto ela é confiável, com medidas.
function QualidadeDaPosicao({ minhaPosicao, buscando }) {
  const { origem, restaurada, salvaEm, descricao, precisaoMetros } = minhaPosicao

  if (origem === 'ajuste' || origem === 'endereco') {
    return (
      <div className="small mt-2">
        <span className="badge text-bg-secondary mb-1">Definida por você</span>
        <p className="mb-0">
          {origem === 'ajuste'
            ? 'Posição ajustada manualmente no mapa.'
            : `Posição definida pelo endereço: ${descricao}.`}
          {restaurada && ` Salva em ${formatarDataHora(salvaEm)}.`} As distâncias são calculadas a
          partir do ponto azul.
        </p>
      </div>
    )
  }

  const qualidade = classificarPrecisao(precisaoMetros)
  const margem = formatarDistancia(precisaoMetros / 1000)
  const aproximada = precisaoMetros > PRECISAO_ACEITAVEL_METROS

  return (
    <div className={`small mt-2 p-2 rounded border border-${qualidade.cor}-subtle bg-${qualidade.cor}-subtle`}>
      <div className="d-flex justify-content-between align-items-center gap-2 mb-1">
        <span className={`badge text-bg-${qualidade.cor}`}>{qualidade.titulo}</span>
        <strong>± {margem}</strong>
      </div>
      <p className="mb-1">
        Estamos mostrando a posição mais próxima possível de acordo com o seu dispositivo, obtida{' '}
        {qualidade.fonte}.
        {restaurada && ` Última posição salva em ${formatarDataHora(salvaEm)}.`}
      </p>
      <p className="mb-0">
        <span className="amostra amostra-precisao" aria-hidden="true" /> O círculo azul claro no mapa
        tem <strong>{margem} de raio</strong>: segundo o seu dispositivo, você deve estar em algum
        ponto dentro dele, a até {margem} do ponto azul.
      </p>
      {qualidade.porIp && (
        <p className="mb-0 mt-1">
          <strong>Atenção:</strong> quando a posição vem do IP, o erro real pode ser maior que o
          círculo e apontar até para outra cidade.
        </p>
      )}
      {buscando && <p className="mb-0 mt-1 fst-italic">Tentando melhorar a precisão…</p>}
      {aproximada && !buscando && (
        <p className="mb-0 mt-1">
          <strong>Para melhorar:</strong>{' '}
          {TELA_DE_TOQUE
            ? 'ative a localização precisa (GPS) do aparelho, permita-a para o navegador e tente de novo, ou busque seu endereço abaixo.'
            : 'computadores costumam não ter GPS. Busque seu endereço abaixo ou ajuste a posição no mapa.'}
        </p>
      )}
    </div>
  )
}

export default function PertoDeMim({
  minhaPosicao,
  buscando,
  erro,
  raioKm,
  ajustando,
  onLocalizar,
  onMudarRaio,
  onAlternarAjuste,
  onEscolherEndereco,
}) {
  const margemKm = minhaPosicao?.precisaoMetros ? minhaPosicao.precisaoMetros / 1000 : 0
  const raioMenorQueMargem = raioKm != null && margemKm > raioKm

  return (
    <section className="card mb-3" aria-labelledby="titulo-perto-de-mim">
      <div className="card-body">
        <h2 id="titulo-perto-de-mim" className="h6 card-title">
          Perto de mim
        </h2>

        <button
          type="button"
          className="btn btn-primary w-100"
          onClick={onLocalizar}
          disabled={buscando || ajustando}
        >
          {buscando ? 'Buscando sua localização…' : minhaPosicao ? 'Atualizar minha localização' : 'Usar minha localização'}
        </button>

        {erro && (
          <div className="alert alert-warning py-2 mt-2 mb-0" role="alert">
            {erro}
          </div>
        )}

        {minhaPosicao && (
          <>
            <div aria-live="polite">
              <QualidadeDaPosicao minhaPosicao={minhaPosicao} buscando={buscando} />
            </div>

            <button
              type="button"
              className={`btn w-100 mt-2 ${ajustando ? 'btn-success' : 'btn-outline-secondary'}`}
              onClick={onAlternarAjuste}
              aria-pressed={ajustando}
            >
              {ajustando ? 'Concluir ajuste' : 'Ajustar minha posição no mapa'}
            </button>
            {ajustando && (
              <p className="small text-body-secondary mt-2 mb-0">
                Arraste o ponto azul ou clique/toque no mapa onde você realmente está.
              </p>
            )}
          </>
        )}

        {!ajustando && <BuscaEndereco onEscolher={onEscolherEndereco} />}

        {minhaPosicao && (
          <div className="mt-3">
            <label htmlFor="raio" className="form-label">
              Mostrar locais em um raio de
            </label>
            <select
              id="raio"
              className="form-select"
              value={raioKm ?? ''}
              onChange={(evento) => onMudarRaio(evento.target.value ? Number(evento.target.value) : null)}
              aria-describedby={raioMenorQueMargem ? 'aviso-raio' : undefined}
            >
              <option value="">Qualquer distância</option>
              {OPCOES_DE_RAIO.map((km) => (
                <option key={km} value={km}>
                  {km} km
                </option>
              ))}
            </select>
            {raioKm != null && (
              <p className="small text-body-secondary mt-1 mb-0">
                <span className="amostra amostra-raio" aria-hidden="true" /> No mapa, o círculo roxo
                tracejado marca os {raioKm} km de busca.
              </p>
            )}
            {raioMenorQueMargem && (
              <div id="aviso-raio" className="alert alert-warning py-2 mt-2 mb-0 small">
                A margem de erro da sua posição (± {formatarDistancia(margemKm)}) é maior que o raio
                escolhido ({raioKm} km). A lista pode incluir ou deixar de fora locais por engano.
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
