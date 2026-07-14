import { formatarData } from "@/lib/format"

type PdfAcompanhamentoProps = {
  processo: any
}

function PdfCampo({
  label,
  valor,
}: {
  label: string
  valor?: string | number | null
}) {
  return (
    <div className="pdf-field">
      <p className="pdf-label">{label}</p>
      <p className="pdf-value">{valor || "—"}</p>
    </div>
  )
}

export function PdfAcompanhamento({
  processo,
}: PdfAcompanhamentoProps) {
  const situacao =
    processo.pendencias?.some(
      (pendencia: any) => pendencia.situacao === "Aberta"
    )
      ? "Aberta"
      : processo.pendencias?.length
        ? "Atendida"
        : "Sem pendência"

  return (
    <div className="hidden print:block pdf-page">
      <header className="pdf-header">
        <img
          src="/logoder.png"
          alt="Logo do DER"
          className="pdf-logo-img"
        />

        <div className="pdf-header-text">
          <h1>Comunique-se</h1>
          <p>Relatório de Outros Acompanhamentos</p>
          <p>Departamento de Estradas de Rodagem — DER</p>
        </div>
      </header>

      <div className="pdf-process-highlight">
        <div>
          <span>PROCESSO</span>
          <strong>{processo.processo || "Sem número"}</strong>
        </div>

        <div>
          <span>CLASSIFICAÇÃO</span>
          <strong>{processo.classificacao || "—"}</strong>
        </div>

        <div>
          <span>SITUAÇÃO</span>
          <strong>{situacao}</strong>
        </div>

        <div>
          <span>EMITIDO EM</span>
          <strong>{new Date().toLocaleString("pt-BR")}</strong>
        </div>
      </div>

        <section className="pdf-section">
            <h2>Dados do acompanhamento</h2>

            <div className="pdf-grid">
                <PdfCampo
                    label="Empreendimento"
                    valor={processo.empreendimento}
                />

                <PdfCampo
                    label="Classificação"
                    valor={processo.classificacao}
                />

                <PdfCampo
                    label="Interessado"
                    valor={processo.interessado}
                />

                <PdfCampo
                    label="Técnico responsável"
                    valor={processo.tecnicoResponsavel}
                />

                <div className="pdf-field pdf-full">
                    <p className="pdf-label">
                        Identificação do empreendimento
                    </p>
                    <p className="pdf-value pdf-pre-wrap">
                        {processo.identificacaoEmpreendimento || "—"}
                    </p>
                </div>

                <div className="pdf-field pdf-full">
                    <p className="pdf-label">
                        Caracterização do empreendimento
                    </p>
                    <p className="pdf-value pdf-pre-wrap">
                        {processo.caracterizacaoEmpreendimento || "—"}
                    </p>
                </div>
            </div>
        </section>

        <section className="pdf-section">
            <h2>Trechos</h2>

            {processo.trechos?.length ? (
                <div className="pdf-items">
                    {processo.trechos.map((trecho: any, index: number) => (
                        <div className="pdf-item" key={trecho.id ?? index}>
                            <h3>Trecho {index + 1}</h3>

                            <div className="pdf-grid">
                                <PdfCampo
                                    label="Código da rodovia"
                                    valor={trecho.rodovia}
                                />

                                <PdfCampo
                                    label="Denominação"
                                    valor={trecho.denominacao}
                                />

                                <PdfCampo
                                    label="KM inicial"
                                    valor={trecho.kmInicial}
                                />

                                <PdfCampo
                                    label="KM final"
                                    valor={trecho.kmFinal}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="pdf-empty">Sem trechos registrados.</p>
            )}
        </section>

        <section className="pdf-section">
            <h2>Pendências e prazos</h2>

            {processo.pendencias?.length ? (
                <div className="pdf-items">
                    {processo.pendencias.map(
                        (pendencia: any, index: number) => (
                            <div className="pdf-item" key={pendencia.id ?? index}>
                                <h3>Pendência {index + 1}</h3>

                                <div className="pdf-grid">
                                    <PdfCampo
                                        label="Situação"
                                        valor={pendencia.situacao}
                                    />

                                    <PdfCampo
                                        label="Divisão CAP"
                                        valor={pendencia.divisaoCap}
                                    />

                                    <PdfCampo
                                        label="Atribuído a"
                                        valor={
                                        pendencia.atribuidoA?.length
                                        ? pendencia.atribuidoA.join(", ")
                                        : "Não informado"
                                    }
                                    />

                                    <PdfCampo
                                        label="Regionais"
                                        valor={
                                        pendencia.regionais?.length
                                        ? pendencia.regionais.join(", ")
                                        : "—"
                                    }
                                    />

                                    <PdfCampo
                                        label="Data de entrada"
                                        valor={formatarData(pendencia.dataEntrada)}
                                    />

                                    <PdfCampo
                                        label="Prazo"
                                        valor={formatarData(pendencia.prazo)}
                                    />

                                    <PdfCampo
                                        label="Data de saída"
                                        valor={formatarData(pendencia.dataSaida)}
                                    />

                                    <div className="pdf-field pdf-full">
                                        <p className="pdf-label">Descrição</p>
                                        <p className="pdf-value pdf-pre-wrap">
                                            {pendencia.descricao || "Sem descrição."}
                                        </p>
                                    </div>
                                </div>

                                <div className="pdf-history-block">
                                    <h4>Históricos da pendência</h4>

                                    {pendencia.historicos?.length ? (
                                        pendencia.historicos.map(
                                            (historico: any, histIndex: number) => (
                                            <div
                                                className="pdf-history-item"
                                                key={historico.id ?? histIndex}
                                            >
                                                <strong>
                                                {formatarData(historico.data)}
                                                </strong>

                                                <p>
                                                {historico.texto ||
                                                    "Sem descrição do histórico."}
                                                </p>
                                            </div>
                                            )
                                        )
                                    ) : (
                                        <p className="pdf-empty">
                                            Sem históricos registrados.
                                        </p>
                                    )}
                                </div>
                            </div>
                        )
                    )}
                </div>
            ) : (
            <p className="pdf-empty">
                Sem pendências registradas.
            </p>
            )}
        </section>

        <section className="pdf-section">
            <h2>Histórico do acompanhamento</h2>

            <div className="pdf-grid">
                <PdfCampo
                    label="Data"
                    valor={
                    processo.historicoProcessoData
                        ? processo.historicoProcessoData
                            .substring(0, 10)
                            .split("-")
                            .reverse()
                            .join("/")
                        : "—"
                    }
                />

                <div className="pdf-field pdf-full">
                    <p className="pdf-label">Descrição</p>
                    <p className="pdf-value pdf-pre-wrap">
                        {processo.historicoProcessoTexto ||
                            "Nenhum histórico cadastrado."}
                    </p>
                </div>
            </div>
        </section>

        <footer className="pdf-footer">
            <p>
                Emitido automaticamente pelo sistema Comunique-se
            </p>
            <p>
                Departamento de Estradas de Rodagem — DER
            </p>
        </footer>
    </div>
  )
}