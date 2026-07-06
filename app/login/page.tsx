"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"

export default function LoginPage() {
  const router = useRouter()
  const [usuario, setUsuario] = useState("")
  const [senha, setSenha] = useState("")
  const [erro, setErro] = useState("")
  const [carregando, setCarregando] = useState(false)

  async function entrar(e: React.FormEvent) {
    e.preventDefault()
    setErro("")
    setCarregando(true)

    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuario, senha }),
    })

    setCarregando(false)

    if (!res.ok) {
      setErro("Usuário ou senha inválidos.")
      return
    }

    router.push("/")
    router.refresh()
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f8f5] px-4">
      <form
        onSubmit={entrar}
        className="w-full max-w-sm rounded-2xl border bg-white p-8 shadow-sm"
      >
        <div className="mb-6 flex flex-col items-center">
          <Image
            src="/logoder.png"
            alt="Logo DER"
            width={170}
            height={80}
            className="h-auto"
            priority
          />

          <h1 className="mt-4 text-xl font-semibold">
            Acesso CAP
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Licenciamento Ambiental
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">
              Usuário
            </label>
            <input
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              className="h-11 w-full rounded-md border px-3 outline-none focus:ring-2 focus:ring-green-600"
              placeholder="Digite o usuário"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Senha
            </label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="h-11 w-full rounded-md border px-3 outline-none focus:ring-2 focus:ring-green-600"
              placeholder="Digite a senha"
            />
          </div>

          {erro && (
            <p className="text-sm text-red-600">
              {erro}
            </p>
          )}

          <button
            type="submit"
            disabled={carregando}
            className="cursor-pointer h-11 w-full rounded-md bg-green-600 font-medium text-white hover:bg-green-700 disabled:opacity-60"
          >
            {carregando ? "Entrando..." : "Entrar"}
          </button>
        </div>
      </form>
    </main>
  )
}