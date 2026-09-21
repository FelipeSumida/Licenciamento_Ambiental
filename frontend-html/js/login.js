const USUARIO_TEMPORARIO = "CAP";
const SENHA_TEMPORARIA = "licenciamento2026";


const form =
    document.getElementById("formLogin");

const usuarioInput =
    document.getElementById("usuario");

const senhaInput =
    document.getElementById("senha");

const erroLogin =
    document.getElementById("erroLogin");


if (
    sessionStorage.getItem(
        "licenciamentoAutenticado"
    ) === "true"
) {
    window.location.href = "./index.html";
}


form.addEventListener(
    "submit",
    (event) => {

        event.preventDefault();


        const usuario =
            usuarioInput.value.trim();

        const senha =
            senhaInput.value;


        if (!usuario) {

            alert("Informe o usuário.");

            usuarioInput.focus();

            return;
        }


        if (!senha) {

            alert("Informe a senha.");

            senhaInput.focus();

            return;
        }


        if (
            usuario === USUARIO_TEMPORARIO &&
            senha === SENHA_TEMPORARIA
        ) {

            sessionStorage.setItem(
                "licenciamentoAutenticado",
                "true"
            );


            sessionStorage.setItem(
                "licenciamentoUsuario",
                usuario
            );


            window.location.href =
                "./index.html";

            return;
        }


        erroLogin.hidden = false;

        senhaInput.value = "";
        senhaInput.focus();
    }
);