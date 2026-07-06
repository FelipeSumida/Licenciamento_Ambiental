import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const { usuario, senha } = await req.json()

  if (usuario === "cap" && senha === "cap@der2026") {
    const cookieStore = await cookies()

    cookieStore.set("cap-auth", "logado", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    })

    return NextResponse.json({ ok: true })
  }

  return NextResponse.json(
    { message: "Usuário ou senha inválidos" },
    { status: 401 }
  )
}