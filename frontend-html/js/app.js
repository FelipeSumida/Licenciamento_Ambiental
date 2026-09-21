const API_URL = "http://localhost:5161/api";

const CORES_DIVISAO_CAP = {
    "Meio Sócio": "#2563eb",
    "Flora": "#16a34a",
    "Meio Físico": "#f59e0b",
    "Fauna": "#dc2626",
    "Licenciamento": "#7c3aed",
    "INFRAÇÃO AMBIENTAL": "#0891b2",
    "Concessionária": "#ea580c",
    "Supervisão obra": "#db2777",
    "Não Aplicável": "#64748b"
};


const CORES_CLASSIFICACAO = {
    "CP": "#2563eb",
    "LP": "#16a34a",
    "LI": "#f59e0b",
    "LO": "#dc2626",
    "ASV": "#7c3aed",
    "TCRA": "#0891b2",
    "AMIS": "#ea580c",
    "SUP.OBRA": "#db2777",
    "OP-FAUNA": "#0d9488",
    "OUTROS": "#64748b"
};

document.addEventListener("DOMContentLoaded", () => {
    carregarDashboard();

    const btnSair = document.getElementById("btnSair");

    if (btnSair) {
        btnSair.addEventListener("click", () => {
            console.log("Botão sair funcionando.");
        });
    }
});


async function carregarDashboard() {
    try {
        const response =
            await fetch(`${API_URL}/processos`);

        if (!response.ok) {
            throw new Error(
                `Erro HTTP: ${response.status}`
            );
        }

        const processos =
            await response.json();

        console.log(
            "Processos recebidos:",
            processos
        );

        const total =
            processos.length;


        const abertos =
            processos.filter((processo) =>
                processo.pendencias?.some(
                    (pendencia) =>
                        pendencia.situacao === "Aberta"
                )
            ).length;

        const concluidos =
            processos.filter((processo) =>
                !processo.pendencias?.some(
                    (pendencia) =>
                        pendencia.situacao === "Aberta"
                )
            ).length;


        const aguardando = abertos;


        document
            .getElementById("totalProcessos")
            .textContent =
            total;

        document
            .getElementById("totalAbertos")
            .textContent =
            abertos;

        document
            .getElementById("totalConcluidos")
            .textContent =
            concluidos;

        document
            .getElementById("totalAguardando")
            .textContent =
            aguardando;

        const contagemAreas = {};


        processos.forEach((processo) => {

            const areasDoProcesso =
                new Set();


            (processo.pendencias ?? [])
                .forEach((pendencia) => {

                    const divisao =
                        pendencia.divisaoCap
                            ?.trim();

                    if (divisao) {
                        areasDoProcesso.add(
                            divisao
                        );
                    }

                });


            areasDoProcesso.forEach(
                (divisao) => {

                    contagemAreas[divisao] =
                        (
                            contagemAreas[
                                divisao
                            ] ?? 0
                        ) + 1;

                }
            );

        });


        const areasOrdenadas =
            Object.entries(contagemAreas)
                .sort(
                    (a, b) =>
                        b[1] - a[1]
                );


        const nomesAreas =
            areasOrdenadas.map(
                ([nome]) => nome
            );

        const valoresAreas =
            areasOrdenadas.map(
                ([, quantidade]) =>
                    quantidade
            );


        const canvasAreas =
            document.getElementById(
                "graficoAreasCap"
            );


        if (
            canvasAreas &&
            nomesAreas.length > 0
        ) {

            new Chart(
                canvasAreas,
                {
                    type: "bar",

                    data: {
                        labels:
                            nomesAreas,

                        datasets: [
                            {
                                label:
                                    "Processos",

                                data:
                                    valoresAreas,

                                backgroundColor:
                                    nomesAreas.map(
                                        (nome) =>
                                            CORES_DIVISAO_CAP[nome] ??
                                            "#64748b"
                                    ),

                                borderRadius:
                                    5,

                                barThickness:
                                    22
                            }
                        ]
                    },

                    options: {
                        indexAxis: "y",

                        responsive: true,

                        maintainAspectRatio:
                            false,

                        plugins: {
                            legend: {
                                display: false
                            }
                        },

                        scales: {
                            x: {
                                beginAtZero: true,

                                ticks: {
                                    precision: 0
                                },

                                grid: {
                                    color:
                                        "#edf0ee"
                                }
                            },

                            y: {
                                grid: {
                                    display:
                                        false
                                }
                            }
                        }
                    }
                }
            );

        }

        const contagemTematicas = {};


        processos.forEach((processo) => {

            let tematica =
                processo.classificacao
                    ?.trim();

            if (!tematica) {

                const fases = [];

                (processo.trechos ?? [])
                    .forEach((trecho) => {

                        (trecho.fases ?? [])
                            .forEach((fase) => {

                                if (
                                    fase.fase
                                        ?.trim()
                                ) {
                                    fases.push(
                                        fase
                                    );
                                }

                            });

                    });


                if (fases.length > 0) {

                    tematica =
                        fases[
                            fases.length - 1
                        ].fase;

                }

            }


            if (!tematica) {
                return;
            }


            contagemTematicas[tematica] =
                (
                    contagemTematicas[
                        tematica
                    ] ?? 0
                ) + 1;

        });


        const tematicasOrdenadas =
            Object.entries(
                contagemTematicas
            )
                .sort(
                    (a, b) =>
                        b[1] - a[1]
                );


        const nomesTematicas =
            tematicasOrdenadas.map(
                ([nome]) => nome
            );

        const valoresTematicas =
            tematicasOrdenadas.map(
                ([, quantidade]) =>
                    quantidade
            );


        const canvasTematicas =
            document.getElementById(
                "graficoTematicas"
            );


        if (
            canvasTematicas &&
            nomesTematicas.length > 0
        ) {

            new Chart(
                canvasTematicas,
                {
                    type: "doughnut",

                    data: {
                        labels:
                            nomesTematicas,

                        datasets: [
                            {
                                data:
                                    valoresTematicas,

                                backgroundColor:
                                    nomesTematicas.map(
                                        (nome) =>
                                            CORES_CLASSIFICACAO[nome] ??
                                            "#64748b"
                                    ),

                                borderWidth:
                                    2,

                                borderColor:
                                    "#ffffff"
                            }
                        ]
                    },

                    options: {
                        responsive: true,

                        maintainAspectRatio:
                            false,

                        cutout:
                            "68%",

                        plugins: {
                            legend: {
                                position:
                                    "bottom",

                                labels: {
                                    usePointStyle:
                                        true,

                                    pointStyle:
                                        "circle",

                                    padding:
                                        16
                                }
                            }
                        }
                    }
                }
            );

        }


    } catch (error) {

        console.error(
            "Erro ao carregar processos da API:",
            error
        );

    }
}